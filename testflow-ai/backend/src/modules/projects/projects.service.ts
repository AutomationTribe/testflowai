import type { PoolClient } from 'pg';
import { pool } from '../../db/pool.js';
import { HttpError } from '../../lib/httpError.js';
import { logger } from '../../lib/logger.js';
import type { SessionUser } from '../../lib/session.js';

export const PROJECT_NAME_MAX_LENGTH = 120;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 500;
export const PROJECT_LIST_DEFAULT_LIMIT = 25;
export const PROJECT_LIST_MAX_LIMIT = 100;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ProjectStatus = 'active' | 'archived';

export interface ProjectMember {
  userId: string;
  name: string;
}

export interface ProjectQaConfiguration {
  versionId: string;
  versionNumber: number;
  presetOrigin: 'standard' | 'lightweight' | 'controlled' | 'custom';
}

export interface Project {
  id: string;
  organisationId: string;
  projectCode: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  createdBy: { userId: string; name: string };
  qaConfiguration: ProjectQaConfiguration;
  members: ProjectMember[];
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  qaConfigurationVersionId?: string;
}

export interface ListProjectsInput {
  q?: string;
  status?: ProjectStatus;
  qaConfigurationVersionId?: string;
  cursor?: string;
  limit?: number;
}

export interface ProjectListResult {
  items: Project[];
  nextCursor: string | null;
  /** Counts of the caller's visible projects, honouring `q` and the QA configuration filter but not `status`. */
  counts: { total: number; active: number; archived: number };
  /** Distinct QA configuration versions among the caller's visible projects — feeds the list filter. */
  qaConfigurations: ProjectQaConfiguration[];
}

interface ProjectRow {
  id: string;
  organisation_id: string;
  project_code: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_at_iso: string;
  created_by_user_id: string;
  created_by_name: string;
  qa_configuration_version_id: string;
  qa_version_number: number;
  qa_preset_origin: ProjectQaConfiguration['presetOrigin'];
}

/** Postgres `text` cannot store a NUL byte; reject it up front so the client gets a 422, not a 500. */
function containsNulByte(text: string): boolean {
  return text.includes('\u0000');
}

/** Escapes LIKE wildcards so a user's search text is matched literally. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** PD-066: `PRJ-` + zero-padded per-organisation sequence number (grows past 3 digits after 999). */
export function formatProjectCode(sequenceNumber: number): string {
  return `PRJ-${String(sequenceNumber).padStart(3, '0')}`;
}

interface ValidatedCreateInput {
  name: string;
  description: string | null;
  qaConfigurationVersionId: string | null;
}

/** Validates and normalises the request body. Throws the shared 422 envelope with per-field messages. */
export function validateCreateProjectInput(body: unknown): ValidatedCreateInput {
  const input = (body ?? {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const rawName = input.name;
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if (typeof rawName !== 'string' || name.length === 0) {
    fields.name = 'Project name is required.';
  } else if (containsNulByte(name)) {
    fields.name = 'Project name contains a character that is not allowed.';
  } else if (name.length > PROJECT_NAME_MAX_LENGTH) {
    fields.name = `Project name must be ${PROJECT_NAME_MAX_LENGTH} characters or fewer.`;
  }

  const rawDescription = input.description;
  let description: string | null = null;
  if (rawDescription !== undefined && rawDescription !== null) {
    if (typeof rawDescription !== 'string') {
      fields.description = 'Description must be text.';
    } else {
      const trimmed = rawDescription.trim();
      if (containsNulByte(trimmed)) {
        fields.description = 'Description contains a character that is not allowed.';
      } else if (trimmed.length > PROJECT_DESCRIPTION_MAX_LENGTH) {
        fields.description = `Description must be ${PROJECT_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
      } else {
        description = trimmed.length > 0 ? trimmed : null;
      }
    }
  }

  const rawVersionId = input.qaConfigurationVersionId;
  let qaConfigurationVersionId: string | null = null;
  if (rawVersionId !== undefined && rawVersionId !== null) {
    if (typeof rawVersionId !== 'string' || !UUID_PATTERN.test(rawVersionId)) {
      fields.qaConfigurationVersionId = 'QA configuration must be a valid published configuration version.';
    } else {
      qaConfigurationVersionId = rawVersionId;
    }
  }

  if (Object.keys(fields).length > 0) {
    throw HttpError.validation('The project could not be created. Check the highlighted fields.', fields);
  }

  return { name, description, qaConfigurationVersionId };
}

/** The version a new project must pin to: the organisation's current published version (FR-QAOM-012). */
async function getCurrentPublishedVersion(
  client: PoolClient,
  organisationId: string,
): Promise<{ id: string; version_number: number; preset_origin: ProjectQaConfiguration['presetOrigin'] } | null> {
  const result = await client.query(
    `SELECT id, version_number, preset_origin
     FROM qa_configuration_versions
     WHERE organisation_id = $1 AND status = 'published'
     ORDER BY version_number DESC
     LIMIT 1`,
    [organisationId],
  );
  return result.rows[0] ?? null;
}

/**
 * Runs the whole create inside one transaction on a dedicated client and returns the new
 * project's id. The client is always released before this function returns, so the caller
 * can safely use the shared pool afterwards (holding it while waiting for a second pool
 * connection would deadlock the pool under concurrent creates).
 */
async function insertProjectInTransaction(user: SessionUser, input: ValidatedCreateInput): Promise<string> {
  const client = await pool.connect();
  let connectionBroken = false;
  try {
    await client.query('BEGIN');

    const current = await getCurrentPublishedVersion(client, user.organisationId);
    if (!current) {
      throw HttpError.notFound('No published QA configuration exists for this organisation.');
    }

    // A client may only name the version it is allowed to get: the organisation's current
    // published one. A version from another organisation, a draft, or a superseded version
    // all return the same 422 so nothing about other tenants' configuration is revealed.
    if (input.qaConfigurationVersionId !== null && input.qaConfigurationVersionId !== current.id) {
      throw HttpError.validation('The selected QA configuration is not available for this organisation.', {
        qaConfigurationVersionId: 'Select the organisation\'s current published QA configuration.',
      });
    }

    const counter = await client.query<{ project_number: number }>(
      `UPDATE organisations
       SET next_project_number = next_project_number + 1
       WHERE id = $1
       RETURNING next_project_number - 1 AS project_number`,
      [user.organisationId],
    );
    const projectCode = formatProjectCode(counter.rows[0]!.project_number);

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO projects
         (organisation_id, project_code, name, description, qa_configuration_version_id, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [user.organisationId, projectCode, input.name, input.description, current.id, user.id],
    );
    const projectId = inserted.rows[0]!.id;

    await client.query(
      `INSERT INTO project_memberships (project_id, user_id, granted_by_user_id, is_creator_grant)
       VALUES ($1, $2, $2, true)`,
      [projectId, user.id],
    );

    await client.query('COMMIT');

    logger.info('project_created', {
      projectId,
      projectCode,
      organisationId: user.organisationId,
      createdByUserId: user.id,
      qaConfigurationVersionId: current.id,
    });
    return projectId;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      // Never let a failed rollback hide the original error. A connection that cannot even roll
      // back is not safe to reuse, so it is destroyed (not returned to the pool) below.
      connectionBroken = true;
      logger.error('project_create_rollback_failed', {
        organisationId: user.organisationId,
        message: rollbackError instanceof Error ? rollbackError.message : 'unknown',
      });
    }
    throw error;
  } finally {
    client.release(connectionBroken ? true : undefined);
  }
}

/**
 * FR-PRJ-001 / FR-QAOM-012 / PD-066 / PD-067. Creates the project, its creator membership,
 * and its per-organisation code in ONE transaction. Organisation and creator always come
 * from the resolved session, never the request body.
 */
export async function createProject(user: SessionUser, body: unknown): Promise<Project> {
  const input = validateCreateProjectInput(body);
  const projectId = await insertProjectInTransaction(user, input);

  // Read back outside the transaction, after its connection has been released.
  const created = await getVisibleProjectById(user, projectId);
  if (!created) {
    // Cannot happen: the creator always holds a membership on, and belongs to the organisation of, the project just created.
    throw new Error(`Project ${projectId} was created but could not be read back.`);
  }
  return created;
}

const PROJECT_SELECT = `
  SELECT p.id, p.organisation_id, p.project_code, p.name, p.description, p.status,
         to_char(p.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at_iso,
         p.created_by_user_id, creator.name AS created_by_name,
         p.qa_configuration_version_id, v.version_number AS qa_version_number, v.preset_origin AS qa_preset_origin
  FROM projects p
  JOIN users creator ON creator.id = p.created_by_user_id
  JOIN qa_configuration_versions v ON v.id = p.qa_configuration_version_id
`;

/**
 * FR-PRJ-004: the visibility rule, applied inside the SQL itself (never post-filtered in
 * application code). Admin/QA Manager see every project in their organisation; a QA Tester
 * sees only projects they hold a membership on (the creator is granted one at creation).
 * `$1` = organisation id, `$2` = user id, `$3` = whether the caller sees all projects.
 */
const VISIBILITY_PREDICATE = `
  p.organisation_id = $1
  AND ($3::boolean OR EXISTS (
    SELECT 1 FROM project_memberships m WHERE m.project_id = p.id AND m.user_id = $2
  ))
`;

function seesAllProjects(user: SessionUser): boolean {
  return user.role === 'admin' || user.role === 'qa_manager';
}

async function loadMembers(projectIds: string[]): Promise<Map<string, ProjectMember[]>> {
  const byProject = new Map<string, ProjectMember[]>();
  if (projectIds.length === 0) return byProject;
  const result = await pool.query<{ project_id: string; user_id: string; name: string }>(
    `SELECT m.project_id, u.id AS user_id, u.name
     FROM project_memberships m
     JOIN users u ON u.id = m.user_id
     WHERE m.project_id = ANY($1::uuid[])
     ORDER BY m.granted_at, u.name`,
    [projectIds],
  );
  for (const row of result.rows) {
    const members = byProject.get(row.project_id) ?? [];
    members.push({ userId: row.user_id, name: row.name });
    byProject.set(row.project_id, members);
  }
  return byProject;
}

function toProject(row: ProjectRow, members: ProjectMember[]): Project {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    projectCode: row.project_code,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.created_at_iso,
    createdBy: { userId: row.created_by_user_id, name: row.created_by_name },
    qaConfiguration: {
      versionId: row.qa_configuration_version_id,
      versionNumber: row.qa_version_number,
      presetOrigin: row.qa_preset_origin,
    },
    members,
  };
}

async function getVisibleProjectById(user: SessionUser, projectId: string): Promise<Project | null> {
  const result = await pool.query<ProjectRow>(
    `${PROJECT_SELECT} WHERE ${VISIBILITY_PREDICATE} AND p.id = $4`,
    [user.organisationId, user.id, seesAllProjects(user), projectId],
  );
  const row = result.rows[0];
  if (!row) return null;
  const members = await loadMembers([row.id]);
  return toProject(row, members.get(row.id) ?? []);
}

interface DecodedCursor {
  createdAtIso: string;
  id: string;
}

export function encodeCursor(createdAtIso: string, id: string): string {
  return Buffer.from(`${createdAtIso}|${id}`, 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): DecodedCursor {
  const invalid = HttpError.validation('The cursor is not valid.', { cursor: 'Cursor is not valid.' });
  let decoded: string;
  try {
    decoded = Buffer.from(cursor, 'base64url').toString('utf8');
  } catch {
    throw invalid;
  }
  const [createdAtIso, id] = decoded.split('|');
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
  if (!createdAtIso || !id || !isoPattern.test(createdAtIso) || !UUID_PATTERN.test(id)) {
    throw invalid;
  }
  return { createdAtIso, id };
}

/** Validates list query parameters from the raw query string. */
export function parseListProjectsQuery(query: Record<string, unknown>): ListProjectsInput {
  const fields: Record<string, string> = {};
  const input: ListProjectsInput = {};

  if (typeof query.q === 'string' && query.q.trim().length > 0) {
    const text = query.q.trim();
    if (containsNulByte(text)) fields.q = 'Search text contains a character that is not allowed.';
    else if (text.length > PROJECT_NAME_MAX_LENGTH) fields.q = `Search text must be ${PROJECT_NAME_MAX_LENGTH} characters or fewer.`;
    else input.q = text;
  }
  if (query.status !== undefined) {
    if (query.status === 'active' || query.status === 'archived') input.status = query.status;
    else fields.status = 'Status must be active or archived.';
  }
  if (query.qaConfigurationVersionId !== undefined) {
    if (typeof query.qaConfigurationVersionId === 'string' && UUID_PATTERN.test(query.qaConfigurationVersionId)) {
      input.qaConfigurationVersionId = query.qaConfigurationVersionId;
    } else {
      fields.qaConfigurationVersionId = 'QA configuration filter must be a valid id.';
    }
  }
  if (typeof query.cursor === 'string' && query.cursor.length > 0) input.cursor = query.cursor;
  if (query.limit !== undefined) {
    const limit = Number(query.limit);
    if (Number.isInteger(limit) && limit >= 1 && limit <= PROJECT_LIST_MAX_LIMIT) input.limit = limit;
    else fields.limit = `Limit must be a whole number between 1 and ${PROJECT_LIST_MAX_LIMIT}.`;
  }

  if (Object.keys(fields).length > 0) {
    throw HttpError.validation('The project list request is not valid.', fields);
  }
  return input;
}

/** FR-PRJ-004: lists only the projects the caller is allowed to see, newest first, cursor-paginated (APID-002). */
export async function listProjects(user: SessionUser, input: ListProjectsInput): Promise<ProjectListResult> {
  const limit = input.limit ?? PROJECT_LIST_DEFAULT_LIMIT;
  const sharedParams: unknown[] = [user.organisationId, user.id, seesAllProjects(user)];

  // Filters shared by the page query, the counts, and the filter options (everything except
  // `status` and the cursor, which only apply to the page itself).
  let sharedFilters = '';
  if (input.q) {
    sharedParams.push(`%${escapeLike(input.q)}%`);
    sharedFilters += ` AND (p.name ILIKE $${sharedParams.length} OR p.project_code ILIKE $${sharedParams.length})`;
  }
  if (input.qaConfigurationVersionId) {
    sharedParams.push(input.qaConfigurationVersionId);
    sharedFilters += ` AND p.qa_configuration_version_id = $${sharedParams.length}`;
  }

  const pageParams = [...sharedParams];
  let pageFilters = sharedFilters;
  if (input.status) {
    pageParams.push(input.status);
    pageFilters += ` AND p.status = $${pageParams.length}`;
  }
  if (input.cursor) {
    const cursor = decodeCursor(input.cursor);
    pageParams.push(cursor.createdAtIso, cursor.id);
    pageFilters += ` AND (p.created_at, p.id) < ($${pageParams.length - 1}::timestamptz, $${pageParams.length}::uuid)`;
  }
  pageParams.push(limit + 1);

  const pageResult = await pool.query<ProjectRow>(
    `${PROJECT_SELECT}
     WHERE ${VISIBILITY_PREDICATE} ${pageFilters}
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT $${pageParams.length}`,
    pageParams,
  );

  const hasMore = pageResult.rows.length > limit;
  const pageRows = hasMore ? pageResult.rows.slice(0, limit) : pageResult.rows;
  const members = await loadMembers(pageRows.map((row) => row.id));
  const items = pageRows.map((row) => toProject(row, members.get(row.id) ?? []));
  const last = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && last ? encodeCursor(last.created_at_iso, last.id) : null;

  const countResult = await pool.query<{ status: ProjectStatus; count: string }>(
    `SELECT p.status, count(*) AS count
     FROM projects p
     WHERE ${VISIBILITY_PREDICATE} ${sharedFilters}
     GROUP BY p.status`,
    sharedParams,
  );
  const counts = { total: 0, active: 0, archived: 0 };
  for (const row of countResult.rows) {
    counts[row.status] = Number(row.count);
    counts.total += Number(row.count);
  }

  // Filter options come from every project the caller can see (ignoring q/config filters),
  // so choosing one option never makes the others disappear.
  const optionsResult = await pool.query<{ id: string; version_number: number; preset_origin: ProjectQaConfiguration['presetOrigin'] }>(
    `SELECT DISTINCT v.id, v.version_number, v.preset_origin
     FROM projects p
     JOIN qa_configuration_versions v ON v.id = p.qa_configuration_version_id
     WHERE ${VISIBILITY_PREDICATE}
     ORDER BY v.version_number DESC`,
    [user.organisationId, user.id, seesAllProjects(user)],
  );
  const qaConfigurations = optionsResult.rows.map((row) => ({
    versionId: row.id,
    versionNumber: row.version_number,
    presetOrigin: row.preset_origin,
  }));

  return { items, nextCursor, counts, qaConfigurations };
}

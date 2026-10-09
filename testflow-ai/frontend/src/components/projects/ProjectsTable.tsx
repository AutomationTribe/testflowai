'use client';

import type { JSX } from 'react';
import type { Project } from '@/lib/apiClient';
import { formatCreatedOn, initialsOf, memberChipColour, qaConfigurationLabel } from './projectFormat';

const MAX_VISIBLE_MEMBERS = 4;

/** Text for screen readers only (the chips show initials; the full name must still be available). */
const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

const headerCell: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  padding: '11px 12px',
  borderBottom: '1px solid var(--color-outline-variant)',
  background: 'var(--color-surface-low)',
  whiteSpace: 'nowrap',
};

const bodyCell: React.CSSProperties = {
  fontSize: 13.5,
  padding: '14px 12px',
  borderBottom: '1px solid var(--color-outline-variant)',
  verticalAlign: 'middle',
};

/** Square, uppercase status badge as drawn in the design (the shared rounded Badge is left unchanged). */
function StatusBadge({ archived }: { archived: boolean }): JSX.Element {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 3,
        border: '1px solid',
        ...(archived
          ? { background: 'var(--color-surface-low)', color: 'var(--color-text-muted)', borderColor: 'var(--color-outline-variant)' }
          : { background: '#e6f4ea', color: '#1e6b34', borderColor: '#bfe3c9' }),
      }}
    >
      {archived ? 'Archived' : 'Active'}
    </span>
  );
}

function MemberChips({ members }: { members: Project['members'] }): JSX.Element {
  const visible = members.slice(0, MAX_VISIBLE_MEMBERS);
  const extra = members.length - visible.length;
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {visible.map((member) => (
        <span
          key={member.userId}
          title={member.name}
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 24,
            height: 20,
            padding: '0 3px',
            borderRadius: 3,
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            background: memberChipColour(member.userId),
            color: 'var(--color-text)',
          }}
        >
          <span aria-hidden>{initialsOf(member.name)}</span>
          <span style={visuallyHidden}>{member.name}</span>
        </span>
      ))}
      {extra > 0 && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>+{extra}</span>}
    </span>
  );
}

/** The populated "Projects — List" table. Every cell is real project data. */
export function ProjectsTable({ projects }: { projects: Project[] }): JSX.Element {
  return (
    <table aria-label="Projects" style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-surface)' }}>
      <thead>
        <tr>
          <th scope="col" style={headerCell}>Project</th>
          <th scope="col" style={headerCell}>Description</th>
          <th scope="col" style={headerCell}>QA Configuration</th>
          <th scope="col" style={headerCell}>Status</th>
          <th scope="col" style={headerCell}>Created By</th>
          <th scope="col" style={headerCell}>Created On</th>
          <th scope="col" style={headerCell}>Members</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => {
          const archived = project.status === 'archived';
          return (
            <tr key={project.id} style={{ color: archived ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
              <td style={{ ...bodyCell, whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 500, marginRight: 10 }}>{project.name}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11.5,
                    color: 'var(--color-text-muted)',
                    background: archived ? 'var(--color-surface-low)' : '#e9eaf0',
                    borderRadius: 3,
                    padding: '2px 6px',
                  }}
                >
                  {project.projectCode}
                </span>
              </td>
              <td style={{ ...bodyCell, color: 'var(--color-text-muted)', maxWidth: 180 }}>
                <span
                  title={project.description ?? undefined}
                  style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {project.description ?? '—'}
                </span>
              </td>
              <td style={bodyCell}>
                <span
                  style={{
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 3,
                    background: 'var(--color-surface-low)',
                    padding: '3px 6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {qaConfigurationLabel(project.qaConfiguration)}
                </span>
              </td>
              <td style={bodyCell}>
                <StatusBadge archived={archived} />
              </td>
              <td style={{ ...bodyCell, whiteSpace: 'nowrap' }}>{project.createdBy.name}</td>
              <td style={{ ...bodyCell, fontFamily: 'var(--font-mono)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                {formatCreatedOn(project.createdAt)}
              </td>
              <td style={bodyCell}>
                <MemberChips members={project.members} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

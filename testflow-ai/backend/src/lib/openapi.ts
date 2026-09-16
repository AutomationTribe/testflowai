import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

/**
 * Loads the hand-maintained OpenAPI contract (docs/technical/api/openapi.yaml) so
 * Swagger UI can serve it. The YAML file is the single source of truth for the
 * machine-readable contract — this module only parses it, never generates or
 * duplicates its content.
 */
const specPath = fileURLToPath(new URL('../../../docs/technical/api/openapi.yaml', import.meta.url));

export function loadOpenApiSpec(): Record<string, unknown> {
  const raw = readFileSync(specPath, 'utf8');
  return yaml.load(raw) as Record<string, unknown>;
}

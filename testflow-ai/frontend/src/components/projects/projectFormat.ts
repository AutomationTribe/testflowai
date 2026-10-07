import type { ProjectQaConfiguration, QaPresetOrigin } from '@/lib/apiClient';

const PRESET_LABEL: Record<QaPresetOrigin, string> = {
  standard: 'Standard QA',
  lightweight: 'Lightweight QA',
  controlled: 'Controlled QA',
  custom: 'Custom QA',
};

/** "Standard QA" — the preset the configuration version was created from. */
export function qaPresetLabel(presetOrigin: QaPresetOrigin): string {
  return PRESET_LABEL[presetOrigin];
}

/** "v2" — the real published version number (no invented minor version). */
export function qaVersionLabel(versionNumber: number): string {
  return `v${versionNumber}`;
}

/** "Standard QA v1" — the chip text shown in the list and the Create Project form. */
export function qaConfigurationLabel(config: Pick<ProjectQaConfiguration, 'presetOrigin' | 'versionNumber'>): string {
  return `${qaPresetLabel(config.presetOrigin)} ${qaVersionLabel(config.versionNumber)}`;
}

/** Up to two upper-case initials from a display name; empty for a blank name. */
export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/** "2025-01-12" — the UTC calendar date of an ISO timestamp, as the design's "Created On" column shows. */
export function formatCreatedOn(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10);
}

const MEMBER_CHIP_COLOURS = ['#dbe4f5', '#cfe3fb', '#fbe0d4', '#e3e6ee', '#d9eadf'];

/** A stable pastel background for a member chip, derived from the user id (not stored anywhere). */
export function memberChipColour(userId: string): string {
  let hash = 0;
  for (const char of userId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }
  return MEMBER_CHIP_COLOURS[hash % MEMBER_CHIP_COLOURS.length]!;
}

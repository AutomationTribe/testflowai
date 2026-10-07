import { describe, expect, it } from 'vitest';
import {
  formatCreatedOn,
  initialsOf,
  memberChipColour,
  qaConfigurationLabel,
  qaPresetLabel,
  qaVersionLabel,
} from '../src/components/projects/projectFormat';

describe('projectFormat', () => {
  it('labels each QA preset with its approved name', () => {
    expect(qaPresetLabel('standard')).toBe('Standard QA');
    expect(qaPresetLabel('lightweight')).toBe('Lightweight QA');
    expect(qaPresetLabel('controlled')).toBe('Controlled QA');
    expect(qaPresetLabel('custom')).toBe('Custom QA');
  });

  it('uses the real version number, without inventing a minor version', () => {
    expect(qaVersionLabel(3)).toBe('v3');
    expect(qaConfigurationLabel({ presetOrigin: 'controlled', versionNumber: 2 })).toBe('Controlled QA v2');
  });

  it('builds up to two upper-case initials and tolerates blank names', () => {
    expect(initialsOf('alex mercer')).toBe('AM');
    expect(initialsOf('Plato')).toBe('P');
    expect(initialsOf('Mary Jane Watson')).toBe('MJ');
    expect(initialsOf('   ')).toBe('');
  });

  it('formats Created On as the UTC calendar date', () => {
    expect(formatCreatedOn('2026-10-07T23:59:59.123456Z')).toBe('2026-10-07');
  });

  it('gives the same chip colour for the same user every time', () => {
    expect(memberChipColour('user-1')).toBe(memberChipColour('user-1'));
    expect(memberChipColour('user-1')).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

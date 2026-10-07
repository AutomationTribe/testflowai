'use client';

/**
 * Monochrome 16px line-icon set (visual reference: the approved designs).
 * `stroke="currentColor"` throughout so each call site controls colour via the
 * surrounding text colour. No icon library and no external assets — these are
 * the only icons the app uses.
 */
export type IconName =
  // sidebar
  | 'grid'
  | 'list'
  | 'check-square'
  | 'folder'
  | 'play-circle'
  | 'bug'
  | 'bar-chart'
  | 'target'
  | 'shield'
  | 'gear'
  | 'help-circle'
  // card checklist
  | 'file-text'
  | 'check-circle'
  | 'minus-circle'
  | 'no-approval'
  | 'no-report'
  | 'lock'
  | 'user-check'
  | 'sliders'
  | 'layout'
  | 'branch'
  // card footers
  | 'star'
  | 'zap'
  | 'at-sign'
  | 'alert'
  // chrome
  | 'bell'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'shield-check'
  | 'info'
  | 'arrow-left'
  | 'arrow-right'
  // projects
  | 'plus'
  | 'search'
  | 'close'
  | 'filter'
  | 'folder-off'
  | 'external';

const PATHS: Record<IconName, JSX.Element> = {
  grid: (
    <>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </>
  ),
  list: (
    <>
      <path d="M2 4h9M2 8h12M2 12h6" />
    </>
  ),
  'check-square': (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
      <path d="m5.5 8 1.8 1.8L10.8 6" />
    </>
  ),
  folder: (
    <>
      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.2l1.3 1.6h5.5A1.5 1.5 0 0 1 14 6.1v6.4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4.5Z" />
    </>
  ),
  'play-circle': (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M6.6 5.6 10.4 8l-3.8 2.4V5.6Z" />
    </>
  ),
  bug: (
    <>
      <rect x="5" y="5.5" width="6" height="7.5" rx="3" />
      <path d="M6.2 5.5a1.8 1.8 0 0 1 3.6 0" />
      <path d="M5 7.5H2.8M11 7.5h2.2M5 10.5H3M11 10.5h2M6 13.4l-1 1.3M10 13.4l1 1.3" />
    </>
  ),
  'bar-chart': (
    <>
      <path d="M2.5 13.5h11" />
      <path d="M4.8 11.5v-4M8 11.5v-7M11.2 11.5v-2.5" />
    </>
  ),
  target: (
    <>
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="2.4" />
    </>
  ),
  shield: (
    <>
      <path d="M8 1.8 13 4v4c0 3-2.1 5.4-5 6.2C5.1 13.4 3 11 3 8V4l5-2.2Z" />
    </>
  ),
  gear: (
    <>
      <circle cx="8" cy="8" r="2.1" />
      <path d="M8 1.6v1.6M8 12.8v1.6M14.4 8h-1.6M3.2 8H1.6M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1M12.5 12.5l-1.1-1.1M4.6 4.6 3.5 3.5" />
    </>
  ),
  'help-circle': (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M6.2 6.2a1.9 1.9 0 0 1 3.7.6c0 1.3-1.9 1.9-1.9 1.9" />
      <path d="M8 11.6h.01" />
    </>
  ),
  'file-text': (
    <>
      <path d="M3.5 2h6l3 3v9a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 1-.5-.5V2.5a.5.5 0 0 1 .5-.5Z" />
      <path d="M9.5 2v3.5H13" />
      <path d="M5.5 8.5h5M5.5 11h3" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="m5.5 8 1.8 1.8L10.8 6" />
    </>
  ),
  'minus-circle': (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M5.5 8h5" />
    </>
  ),
  'no-approval': (
    <>
      <path d="M2 4.5h6M2 8h4M2 11.5h6" />
      <path d="m10 5.5 4 5M14 5.5l-4 5" />
    </>
  ),
  'no-report': (
    <>
      <path d="M2 4.5h7M2 8h5M2 11.5h7" />
      <path d="m11 6 3.5 4M14.5 6 11 10" />
    </>
  ),
  lock: (
    <>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" />
      <path d="M5.8 7V5.3a2.2 2.2 0 0 1 4.4 0V7" />
    </>
  ),
  'user-check': (
    <>
      <circle cx="6.5" cy="5.5" r="2.4" />
      <path d="M2.5 13.5a4 4 0 0 1 8 0" />
      <path d="m10.8 8.4 1.3 1.3 2.4-2.6" />
    </>
  ),
  sliders: (
    <>
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
      <circle cx="6" cy="4.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="10" cy="8" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="5" cy="11.5" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  layout: (
    <>
      <rect x="2.5" y="3" width="11" height="10" rx="1.4" />
      <path d="M2.5 6.5h11" />
    </>
  ),
  branch: (
    <>
      <circle cx="4.5" cy="4" r="1.7" />
      <circle cx="4.5" cy="12" r="1.7" />
      <circle cx="11.5" cy="6.5" r="1.7" />
      <path d="M4.5 5.7v4.6M6.2 4.6c2.6 0 3.6.6 3.9 1.6M9.9 7.6c-.5 1.4-2.4 2-5.4 2.6" />
    </>
  ),
  star: (
    <>
      <path d="m8 2.2 1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2.2 6.5l4-.6L8 2.2Z" />
    </>
  ),
  zap: (
    <>
      <path d="M8.8 1.5 3.5 9h4l-.3 5.5L12.5 7h-4l.3-5.5Z" />
    </>
  ),
  'at-sign': (
    <>
      <circle cx="8" cy="8" r="2.5" />
      <path d="M10.5 5.5v3.2a1.8 1.8 0 0 0 3.5 0V8a6 6 0 1 0-2.4 4.8" />
    </>
  ),
  alert: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.6M8 11h.01" />
    </>
  ),
  bell: (
    <>
      <path d="M12 6a4 4 0 1 0-8 0c0 3.2-1.2 4.2-1.2 4.2h10.4S12 9.2 12 6Z" />
      <path d="M9.2 12.8a1.4 1.4 0 0 1-2.4 0" />
    </>
  ),
  'chevron-down': (
    <>
      <path d="m4 6.5 4 4 4-4" />
    </>
  ),
  'chevron-left': (
    <>
      <path d="m10 3.5-4 4.5 4 4.5" />
    </>
  ),
  'chevron-right': (
    <>
      <path d="m6 3.5 4 4.5-4 4.5" />
    </>
  ),
  'shield-check': (
    <>
      <path d="M8 1.8 13 4v4c0 3-2.1 5.4-5 6.2C5.1 13.4 3 11 3 8V4l5-2.2Z" />
      <path d="m5.9 7.9 1.5 1.5 2.8-2.8" />
    </>
  ),
  info: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7.2v4M8 5h.01" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M13 8H3M6.5 4.5 3 8l3.5 3.5" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" />
    </>
  ),
  plus: (
    <>
      <path d="M8 3v10M3 8h10" />
    </>
  ),
  search: (
    <>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </>
  ),
  close: (
    <>
      <path d="m3.5 3.5 9 9M12.5 3.5l-9 9" />
    </>
  ),
  filter: (
    <>
      <path d="M2.5 3h11L9.5 8v4.5l-3 1.2V8L2.5 3Z" />
    </>
  ),
  'folder-off': (
    <>
      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.2l1.3 1.6h5.5A1.5 1.5 0 0 1 14 6.1v6.4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4.5Z" />
      <path d="m2 2 12 12" />
    </>
  ),
  external: (
    <>
      <path d="M6 3h7v7M13 3 5.5 10.5" />
    </>
  ),
};

export function Icon({ name, size = 16, strokeWidth = 1.4 }: { name: IconName; size?: number; strokeWidth?: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {PATHS[name]}
    </svg>
  );
}

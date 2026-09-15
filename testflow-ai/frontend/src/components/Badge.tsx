'use client';

type Tone = 'neutral' | 'success' | 'danger' | 'info';

const TONE_STYLES: Record<Tone, React.CSSProperties> = {
  neutral: { background: 'var(--color-surface-low)', color: 'var(--color-text)', borderColor: 'var(--color-outline-variant)' },
  success: { background: '#e6f4ea', color: '#1e6b34', borderColor: '#bfe3c9' },
  danger: { background: '#fdecec', color: '#a4262c', borderColor: '#f3c6c6' },
  info: { background: '#e8ecf5', color: 'var(--color-primary)', borderColor: '#c7d0e8' },
};

/** Small inline status pill — used sparingly, e.g. "Activated" / "No active plan". */
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }): JSX.Element {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 12,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 999,
        border: '1px solid',
        ...TONE_STYLES[tone],
      }}
    >
      {children}
    </span>
  );
}

/** One restrained error-state component (Step 10) — reused for network/unauthorized/server-error states. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: { label: string; onClick: () => void };
}): JSX.Element {
  return (
    <div
      role="alert"
      style={{
        border: '1px solid var(--color-outline-variant)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)',
        padding: 'var(--space-4)',
        maxWidth: 420,
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>{title}</p>
      <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: 14 }}>{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 'var(--space-3)',
            background: 'none',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

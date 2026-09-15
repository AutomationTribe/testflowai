'use client';

interface MinimalHeaderProps {
  /** Shown as an "Organisation: X" chip on screens where the design includes it (Subscription Activated, Subscription Required). Omitted entirely when not passed (Sign Up, Login, Plan Selection — matching each screen's own reference). */
  organisationName?: string;
  /** Shown in place of the reference's "Sign In" text (factually wrong once authenticated) — the real signed-in user's name in that same slot. */
  userName?: string;
  /** Page-context breadcrumb shown next to the logo (Checkout's reference: "Billing System / Secure Checkout"). Omitted on screens whose reference doesn't show one. */
  breadcrumb?: string;
  /** Login's reference shows only the logo and "System Status" — no Documentation, help icon, or identity slot. Defaults to false (full bar) for every other screen's reference. */
  compact?: boolean;
  /** Sign Up's reference ends at the help icon — no "Sign In"/identity slot at all (unlike Subscription Activated/Required's reference, which does show one). Defaults to true. */
  showIdentity?: boolean;
}

/**
 * Shared top bar for Account & Subscription screens (visual references:
 * docs/design/approved/account-subscription/*.png). Matches the approved
 * layout closely: brand mark, "Documentation"/"System Status" (with its status
 * dot), the organisation chip and user identity on post-auth screens, and the
 * help icon. "Documentation"/"System Status" are plain, non-interactive text,
 * not links — this app has no such pages, so a real link would be a broken
 * destination. Two things from the reference are still not implemented: the
 * fake "SUB-FLOW: 03" / "SUB-PLAN: 03" flow-tracking codes (fabricated
 * identifiers) and the literal "Sign In" text (replaced with the actual
 * signed-in user's name — showing "Sign In" while authenticated would be
 * factually wrong, not a style choice).
 */
export function MinimalHeader({
  organisationName,
  userName,
  breadcrumb,
  compact = false,
  showIdentity = true,
}: MinimalHeaderProps): JSX.Element {
  const helpIcon = (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: '1px solid var(--color-outline-variant)',
        fontSize: 11,
      }}
    >
      ?
    </span>
  );
  const divider = <span aria-hidden style={{ width: 1, height: 16, background: 'var(--color-outline-variant)' }} />;
  const identity = userName ? (
    <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{userName}</span>
  ) : (
    <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>Sign In</span>
  );

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-6)',
        borderTop: '3px solid var(--color-primary)',
        borderBottom: '1px solid var(--color-outline-variant)',
        background: 'var(--color-surface)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--color-primary)' }}>
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: 5,
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: 12,
              lineHeight: 1,
            }}
          >
            ✓
          </span>
          TestFlow
        </span>
        {breadcrumb && (
          <>
            {divider}
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{breadcrumb}</span>
          </>
        )}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 13, color: 'var(--color-text-muted)' }}>
        {!compact && <span>Documentation</span>}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: '#2e8b57', display: 'inline-block' }} />
          System Status
        </span>
        {!compact &&
          (organisationName ? (
            <>
              {divider}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid var(--color-outline-variant)',
                  borderRadius: 999,
                  padding: '3px 10px',
                  background: 'var(--color-surface-low)',
                  fontWeight: 500,
                }}
              >
                <span aria-hidden>🏢</span>
                Organisation: {organisationName}
              </span>
              {helpIcon}
              {identity}
            </>
          ) : showIdentity ? (
            <>
              {helpIcon}
              {divider}
              {identity}
            </>
          ) : (
            <>
              {divider}
              {helpIcon}
            </>
          ))}
      </span>
    </header>
  );
}

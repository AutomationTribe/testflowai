'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { MinimalHeader } from '@/components/MinimalHeader';
import { PasswordInput } from '@/components/PasswordInput';
import { TextInput } from '@/components/TextInput';
import { apiClient, ApiError } from '@/lib/apiClient';
import { useSession } from '@/lib/SessionProvider';

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

/**
 * "Sign In" screen (§21; visual reference: docs/design/approved/account-subscription/login.png).
 * Exactly: Email, Password, Sign In, Create Account link, compact header (logo +
 * System Status only — no Documentation/help/identity, matching this screen's own
 * reference), and the shared site footer. Deliberately omits the reference
 * screenshot's invented version/node/telemetry chrome, and uses "TestFlow" (not
 * the reference's fabricated "TestFlow Systematic Inc.") and the already-approved
 * footer link set (Terms of Service / Privacy Policy / Contact Support, not the
 * reference's unapproved "Security Compliance") — see the design conformance review.
 */
export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { refresh } = useSession();
  const router = useRouter();

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.login(email, password);
      await refresh();
      router.replace('/'); // root route resolves to /app or /subscription-required based on server state
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MinimalHeader compact />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            width: '100%',
            maxWidth: 420,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-outline-variant)' }}>
            <h1 style={{ fontSize: 22, margin: 0 }}>Sign In</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              Authenticate credentials to access systematic test suites.
            </p>
          </div>

          <label style={labelStyle}>
            Email
            <TextInput
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="developer@testflow.internal"
              style={{ fontFamily: 'var(--font-mono)' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <div style={labelStyle}>
            <label htmlFor="login-password">Password</label>
            <PasswordInput
              id="login-password"
              name="password"
              autoComplete="current-password"
              required
              style={{ fontFamily: 'var(--font-mono)' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <ErrorState title="Sign-in failed" message={error} />}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In →'}
          </Button>

          <p
            style={{
              fontSize: 13,
              textAlign: 'center',
              margin: 0,
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--color-outline-variant)',
            }}
          >
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}>
              Create Account
            </Link>
          </p>
        </form>
      </div>
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          padding: 'var(--space-4) var(--space-6)',
          borderTop: '1px solid var(--color-outline-variant)',
          fontSize: 12,
          color: 'var(--color-text-muted)',
        }}
      >
        <span>© {new Date().getFullYear()} TestFlow. All rights reserved.</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span>Terms of Service</span>
          <span aria-hidden style={{ color: 'var(--color-outline-variant)' }}>/</span>
          <span>Privacy Policy</span>
          <span aria-hidden style={{ color: 'var(--color-outline-variant)' }}>/</span>
          <span>Contact Support</span>
        </span>
      </footer>
    </div>
  );
}

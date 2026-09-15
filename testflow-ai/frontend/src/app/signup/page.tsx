'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { MinimalHeader } from '@/components/MinimalHeader';
import { PasswordInput } from '@/components/PasswordInput';
import { Select } from '@/components/Select';
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
 * "Create Workspace Account" screen (§18/§20; visual reference:
 * docs/design/approved/account-subscription/signup.png). Exact fields only:
 * Name, Email, Password, Role (Admin | QA Manager), Organisation Name.
 * Deliberately omits the reference screenshot's invented chrome — see the
 * design conformance review for the full list (fake version/tenant/entropy/
 * encryption telemetry has no approved requirement behind it). The reference's
 * "Domain recognized as internal tenant." helper text under Email is also
 * omitted — there is no multi-tenant domain-recognition feature behind it, so
 * showing it would claim functionality that doesn't exist. Uses "TestFlow" (not
 * the reference's fabricated "TestFlow Systematic Inc.") and the already-approved
 * footer link set (Terms of Service / Privacy Policy / Contact Support, not the
 * reference's unapproved "Security Compliance").
 */
export default function SignUpPage(): JSX.Element {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'qa_manager'>('admin');
  const [organisationName, setOrganisationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { refresh } = useSession();
  const router = useRouter();

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await apiClient.signUp({ name, email, password, role, organisationName });
      await refresh();
      // FR-AUTH-006: immediately continue into the mandatory subscription step.
      router.replace('/subscription');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fields ?? {});
      } else {
        setError('Could not create your account. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MinimalHeader showIdentity={false} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            width: '100%',
            maxWidth: 520,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-outline-variant)' }}>
            <h1 style={{ fontSize: 22, margin: 0 }}>Create Workspace Account</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              Create your account to set up your QA workspace.
            </p>
          </div>

          <label style={labelStyle}>
            Name
            <TextInput name="name" required placeholder="Eleanor Vance" value={name} onChange={(e) => setName(e.target.value)} />
            {fieldErrors.name && <span style={{ color: 'crimson', fontSize: 12, textTransform: 'none' }}>{fieldErrors.name}</span>}
          </label>

          <label style={labelStyle}>
            Email
            <TextInput
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="e.vance@core-systems.internal"
              style={{ fontFamily: 'var(--font-mono)' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldErrors.email && <span style={{ color: 'crimson', fontSize: 12, textTransform: 'none' }}>{fieldErrors.email}</span>}
          </label>

          <div style={labelStyle}>
            <label htmlFor="signup-password">Password</label>
            <PasswordInput
              id="signup-password"
              name="password"
              autoComplete="new-password"
              required
              style={{ fontFamily: 'var(--font-mono)' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {fieldErrors.password && (
              <span style={{ color: 'crimson', fontSize: 12, textTransform: 'none' }}>{fieldErrors.password}</span>
            )}
          </div>

          <label style={labelStyle}>
            Role
            <Select name="role" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'qa_manager')}>
              <option value="admin">Admin</option>
              <option value="qa_manager">QA Manager</option>
            </Select>
            {fieldErrors.role && <span style={{ color: 'crimson', fontSize: 12, textTransform: 'none' }}>{fieldErrors.role}</span>}
          </label>

          <label style={labelStyle}>
            Organisation Name
            <TextInput
              name="organisationName"
              required
              placeholder="e.g. Acme Systematic Labs"
              value={organisationName}
              onChange={(e) => setOrganisationName(e.target.value)}
            />
            {fieldErrors.organisationName && (
              <span style={{ color: 'crimson', fontSize: 12, textTransform: 'none' }}>{fieldErrors.organisationName}</span>
            )}
          </label>

          {error && <ErrorState title="Could not create account" message={error} />}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Account →'}
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
            Already have an account?{' '}
            <Link href="/login" style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}>
              Sign In
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
        <span style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Contact Support</span>
        </span>
      </footer>
    </div>
  );
}

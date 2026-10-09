'use client';

import type { ReactNode, JSX } from 'react';
import { AppSidebar } from './AppSidebar';

/**
 * Minimal application shell (Step 6/7/8). Uses the same shared AppSidebar as
 * the QA Setup screen (see AppSidebar.tsx) so the sidebar's color scheme and
 * nav list never drift out of sync between screens in one session — this page
 * is Slice 1's landing boundary, so its active item is "Dashboard".
 */
export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AppSidebar activeKey="dashboard" />
      <main style={{ flex: 1, padding: 'var(--space-6)' }}>{children}</main>
    </div>
  );
}

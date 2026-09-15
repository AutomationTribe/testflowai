import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// vitest.config.ts does not set `test.globals: true`, so React Testing Library's
// own auto-cleanup (which relies on detecting a global `afterEach`) never fires —
// register it explicitly, or every test after the first in a file sees a DOM with
// every previous render still mounted.
afterEach(() => {
  cleanup();
});

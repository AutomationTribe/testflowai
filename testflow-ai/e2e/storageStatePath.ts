import { join } from 'node:path';

/** Where global-setup saves the dedicated tester's signed-in session (git-ignored). */
export const TESTER_STORAGE_STATE = join(__dirname, '.auth', 'tester.json');

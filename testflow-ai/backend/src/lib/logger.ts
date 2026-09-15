/**
 * Structured logging foundation (AD-012: standard structured logging, no custom
 * monitoring platform). A minimal, dependency-free JSON logger is enough for Slice 0;
 * swapping in a mainstream logging library later is a drop-in replacement of this file.
 */

type Level = 'info' | 'warn' | 'error';

function write(level: Level, message: string, meta: Record<string, unknown> = {}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
};

'use client';

import type { SelectHTMLAttributes } from 'react';

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>): JSX.Element {
  return (
    <select
      {...props}
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 14,
        padding: '8px 10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-outline-variant)',
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        width: '100%',
        ...props.style,
      }}
    />
  );
}

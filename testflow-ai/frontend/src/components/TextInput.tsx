'use client';

import type { InputHTMLAttributes } from 'react';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return (
    <input
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

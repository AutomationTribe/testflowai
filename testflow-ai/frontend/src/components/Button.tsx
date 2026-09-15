'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';

export function Button({
  variant = 'primary',
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }): JSX.Element {
  const base: React.CSSProperties = {
    fontFamily: 'var(--font-ui)',
    fontSize: 14,
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent',
    cursor: 'pointer',
  };

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? { background: 'var(--color-primary)', color: '#fff' }
      : {
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          borderColor: 'var(--color-outline-variant)',
        };

  return <button {...props} style={{ ...base, ...variantStyle, ...style }} />;
}

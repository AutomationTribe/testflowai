'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { TextInput } from './TextInput';

/** Password field with a show/hide toggle — same visual chrome as TextInput, plus an eye icon. */
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <TextInput {...props} type={visible ? 'text' : 'password'} style={{ paddingRight: 36, ...props.style }} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 14,
        }}
      >
        {visible ? '🙈' : '👁'}
      </button>
    </div>
  );
}

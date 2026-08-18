'use client';

import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

function AuthField({
  label,
  labelClassName = '',
  children,
}: {
  label: string;
  labelClassName?: string;
  children: ReactNode;
}) {
  return (
    <label className={`auth-field ${labelClassName}`}>
      {label}
      {children}
    </label>
  );
}

export function AuthEmailField({
  inputClassName,
  labelClassName,
  value,
  onChange,
  error,
  describedBy,
  autoComplete = 'username',
}: {
  inputClassName: string;
  labelClassName?: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  describedBy?: string;
  autoComplete?: string;
}) {
  return (
    <AuthField label="Email" labelClassName={labelClassName}>
      <input
        className={`auth-field__control ${inputClassName}`}
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
    </AuthField>
  );
}

export function AuthPasswordField({
  inputClassName,
  labelClassName,
  value,
  onChange,
  error,
  describedBy,
  autoComplete = 'current-password',
  minLength,
  label = 'Password',
}: {
  inputClassName: string;
  labelClassName?: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  describedBy?: string;
  autoComplete?: 'current-password' | 'new-password';
  minLength?: number;
  label?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <AuthField label={label} labelClassName={labelClassName}>
      <div className="auth-field__password">
        <input
          className={`auth-field__control auth-password-input ${inputClassName}`}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="auth-password-toggle"
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((v) => !v)}
        >
          {show ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </AuthField>
  );
}

export function AuthTextField({
  label,
  inputClassName,
  labelClassName,
  value,
  onChange,
  autoComplete,
  required,
}: {
  label: string;
  inputClassName: string;
  labelClassName?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <AuthField label={label} labelClassName={labelClassName}>
      <input
        className={`auth-field__control ${inputClassName}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
      />
    </AuthField>
  );
}

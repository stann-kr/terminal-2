import type { ReactNode } from 'react';
import './forms.css';

export function FormField({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return <div className="tm-form-field"><label htmlFor={id}>{label}</label>{children}{error && <p id={`${id}-error`} className="tm-field-error" role="alert">{error}</p>}</div>;
}

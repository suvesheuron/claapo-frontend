import type { InputHTMLAttributes } from 'react';

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

/**
 * Standardized date input with dd/mm/yyyy calendar locale.
 * Uses native browser calendar while nudging locale to en-GB format.
 */
export default function DateInput({ className = '', ...props }: DateInputProps) {
  return (
    <input
      type="date"
      lang="en-GB"
      placeholder="dd/mm/yyyy"
      className={className}
      {...props}
    />
  );
}

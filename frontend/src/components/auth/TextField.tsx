export interface TextFieldProps {
  id: string
  label: string
  type?: string
  placeholder?: string
  autoComplete?: string
  hint?: string
  value: string
  error?: string
  onChange: (value: string) => void
}

export function TextField({
  id,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  hint,
  value,
  error,
  onChange,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-surface-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
          error ? 'border-red-300 bg-red-50' : 'border-surface-300'
        }`}
      />
      {error ? (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      ) : (
        hint && <p className="text-xs text-surface-400 mt-1">{hint}</p>
      )}
    </div>
  )
}

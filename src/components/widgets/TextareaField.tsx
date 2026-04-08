type TextareaFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  error?: string;
};

export default function TextareaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
  error,
}: TextareaFieldProps) {
  return (
    <div>
      <label
        className="block text-sm font-medium text-gray-700 mb-1"
        htmlFor={id}
      >
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition resize-none ${error ? "border-red-400" : "border-gray-300"}`}
        style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

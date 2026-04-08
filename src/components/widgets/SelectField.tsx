type SelectOption = { label: string; value: string };

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
};

export default function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  required,
  error,
}: SelectFieldProps) {
  return (
    <div>
      <label
        className="block text-sm font-medium text-gray-700 mb-1"
        htmlFor={id}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:border-transparent transition appearance-none ${error ? "border-red-400" : "border-gray-300"}`}
        style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

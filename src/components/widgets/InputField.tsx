type InputFieldProps = {
  id: string;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  error?: string;
};

export default function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  error,
}: InputFieldProps) {
  return (
    <div>
      <label
        className="block text-sm font-medium text-gray-700 mb-1"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${error ? "border-red-400" : "border-gray-300"}`}
        style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

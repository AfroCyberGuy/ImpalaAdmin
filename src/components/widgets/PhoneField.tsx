const PREFIX = "+263";

type PhoneFieldProps = {
  id: string;
  label: string;
  value: string; // always stored as +263XXXXXXXXX (or empty)
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
};

/**
 * Strips the +263 prefix from a full number so we can display only the local part.
 */
function toLocalDigits(full: string): string {
  if (full.startsWith(PREFIX)) return full.slice(PREFIX.length);
  return full;
}

/**
 * Formats user keystrokes into only digits, max 9 characters (Zimbabwe local part).
 */
function sanitise(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 9);
}

export default function PhoneField({
  id,
  label,
  value,
  onChange,
  placeholder = "7X XXX XXXX",
  error,
}: PhoneFieldProps) {
  const localDigits = toLocalDigits(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = sanitise(e.target.value);
    onChange(digits ? PREFIX + digits : "");
  }

  return (
    <div>
      <label
        className="block text-sm font-medium text-gray-700 mb-1"
        htmlFor={id}
      >
        {label}
      </label>
      <div
        className={`flex w-full rounded-lg border text-sm text-gray-900 overflow-hidden focus-within:ring-2 focus-within:border-transparent transition ${
          error ? "border-red-400" : "border-gray-300"
        }`}
        style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
      >
        {/* Fixed prefix */}
        <span className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-gray-500 select-none whitespace-nowrap">
          +263
        </span>
        {/* Local number input */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={localDigits}
          onChange={handleChange}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 bg-white focus:outline-none placeholder-gray-400"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

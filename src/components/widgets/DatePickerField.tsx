import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import "react-day-picker/style.css";

type DatePickerFieldProps = {
  id: string;
  label: string;
  value: string; // ISO date string "yyyy-MM-dd" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  allowFuture?: boolean;
};

const BRAND = "#2E8B57";

export default function DatePickerField({
  id,
  label,
  value,
  onChange,
  placeholder = "Select date",
  required,
  error,
  allowFuture = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  const displayValue =
    selected && isValid(selected) ? format(selected, "dd MMM yyyy") : "";

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleSelect(day: Date | undefined) {
    if (day && isValid(day)) {
      onChange(format(day, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div className="relative" ref={ref}>
      <label
        className="block text-sm font-medium text-gray-700 mb-1"
        htmlFor={id}
      >
        {label}
      </label>

      {/* Trigger */}
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-required={required}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={[
          "w-full flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:border-transparent text-left",
          open
            ? "border-[#2E8B57] ring-2 ring-[#2E8B57]/30"
            : error
              ? "border-red-400"
              : "border-gray-300 hover:border-gray-400",
          displayValue ? "text-gray-900" : "text-gray-400",
        ].join(" ")}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-gray-500" />
        <span className="flex-1">{displayValue || placeholder}</span>
        {displayValue && (
          <span
            role="button"
            onClick={handleClear}
            className="ml-auto flex h-5 w-5 items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Clear date"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* Popover */}
      {open && (
        <div
          role="dialog"
          aria-label="Date picker"
          className="absolute left-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg p-2"
        >
          <DayPicker
            mode="single"
            selected={selected && isValid(selected) ? selected : undefined}
            onSelect={handleSelect}
            captionLayout="dropdown"
            startMonth={new Date(1940, 0)}
            endMonth={
              allowFuture
                ? new Date(new Date().getFullYear() + 20, 11)
                : new Date()
            }
            style={
              {
                "--rdp-accent-color": BRAND,
                "--rdp-accent-background-color": `${BRAND}18`,
                "--rdp-day-font": "inherit",
                color: "#374151",
              } as React.CSSProperties
            }
            classNames={{
              month_caption: "text-gray-700",
              dropdowns: "text-gray-700",
              dropdown: "text-gray-700",
              nav: "text-gray-500",
              weekday: "text-gray-400",
              day: "text-gray-700",
              today: "font-bold text-gray-900",
              selected: `!bg-[${BRAND}] !text-white rounded-full`,
            }}
          />
        </div>
      )}
    </div>
  );
}

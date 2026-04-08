type ButtonVariant = "primary" | "ghost";

type ButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

const BRAND = "#2E8B57";

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: BRAND,
    color: "#fff",
    "--tw-ring-color": BRAND,
  } as React.CSSProperties,
  ghost: { color: BRAND },
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "shadow-sm hover:opacity-90 active:opacity-80 focus:ring-2 focus:ring-offset-2 text-white font-semibold",
  ghost: "hover:underline font-medium",
};

export default function Button({
  children,
  type = "button",
  variant = "primary",
  fullWidth = false,
  onClick,
  disabled,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-lg px-4 py-2.5 text-sm tracking-wide transition-opacity focus:outline-none",
        variantClasses[variant],
        fullWidth ? "w-full" : "",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={variantStyles[variant]}
    >
      {children}
    </button>
  );
}

import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import Button from "#/components/widgets/Button";
import InputField from "#/components/widgets/InputField";
import { supabase } from "#/utils/supabase";

export const Route = createFileRoute("/login/")({
  beforeLoad: ({ context }) => {
    if (typeof window !== "undefined" && context.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ALLOWED_DOMAINS = ["impala.co.zw", "dacit.co.uk"];

  async function handleSignIn() {
    setError(null);

    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
      setError("Access restricted to @impala.co.zw and @dacit.co.uk accounts.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/ridepro_icon.png"
            alt="Impala"
            className="w-16 h-16 rounded-2xl object-contain mb-1"
          />
          <h1 className="text-2xl font-bold text-gray-800">Ridepro Admin</h1>
        
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSignIn();
          }}
          className="space-y-5"
        >
          <InputField
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <InputField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300" />
              Remember me
            </label>
            <a
              href="#"
              className="text-sm font-medium"
              style={{ color: "#2E8B57" }}
            >
              Forgot password?
            </a>
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center -mt-1">{error}</p>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium"
            style={{ color: "#2E8B57" }}
          >
            Sign up
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          &copy; {new Date().getFullYear()} Impala. All rights reserved.
        </p>
      </div>
    </div>
  );
}

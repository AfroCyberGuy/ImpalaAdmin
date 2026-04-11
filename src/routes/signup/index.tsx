import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import Button from "#/components/widgets/Button";
import InputField from "#/components/widgets/InputField";
import { supabase } from "#/utils/supabase";

export const Route = createFileRoute("/signup/")({
  component: SignupPage,
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

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    console.log("[signup] data:", data);
    console.log("[signup] error:", error);

    if (error) {
      setError(error.message);
      return;
    }

    // If email confirmation is required, Supabase returns a user but no session.
    // Otherwise the user is immediately signed in.
    if (data.session) {
      navigate({ to: "/" });
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#2E8B57" }}
          >
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Check your email
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            We sent a confirmation link to{" "}
            <span className="font-medium text-gray-700">{email}</span>. Click it
            to activate your account.
          </p>
          <Link
            to="/login"
            className="text-sm font-medium"
            style={{ color: "#2E8B57" }}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
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
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
            autoComplete="new-password"
            required
          />

          <InputField
            id="confirm-password"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />

          {error && (
            <p className="text-sm text-red-600 text-center -mt-1">{error}</p>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Creating account…
              </span>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium"
            style={{ color: "#2E8B57" }}
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          &copy; {new Date().getFullYear()} Impala. All rights reserved.
        </p>
      </div>
    </div>
  );
}

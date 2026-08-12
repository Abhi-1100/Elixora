"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { BreathOrb } from "@/components/ui/breath-orb";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { saveSession } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(""); // clear error on keystroke
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await login(form);
      saveSession(data.access_token, data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-4 py-12 transition-colors duration-200 relative overflow-hidden">
      {/* Ambient glow backdrop */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-[var(--glow-a)] to-[var(--glow-b)] opacity-20 blur-3xl pointer-events-none" />

      {/* Brand mark above card */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <BreathOrb size="sm" mode="idle" />
        <span className="font-semibold text-lg tracking-tight text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
          Elixora
        </span>
      </Link>

      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Top accent strip */}
        <div className="absolute -top-px left-8 right-8 h-0.5 rounded-full bg-gradient-to-r from-[var(--glow-a)] via-[var(--accent)] to-[var(--glow-b)]" />

        <div className="w-full bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-2xl p-8 transition-colors duration-200">
          <div className="mb-7">
            <h1 className="text-2xl font-display font-semibold text-[var(--ink)] mb-1.5">
              Welcome back
            </h1>
            <p className="text-sm text-[var(--ink-muted)]">
              Log in to continue to your health dashboard.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              id="login-error"
              role="alert"
              className="mb-5 flex items-start gap-2.5 text-sm text-[var(--warn)] bg-[var(--warn-soft)] border border-[var(--warn)]/20 rounded-xl px-3.5 py-3 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-[var(--ink)] mb-1.5"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--border)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all placeholder:text-[var(--ink-muted)]"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-[var(--ink)] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--border)] px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all placeholder:text-[var(--ink-muted)]"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  id="toggle-password-login"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--accent)] text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md mt-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          <p className="text-sm text-[var(--ink-muted)] mt-6 text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              id="go-to-signup"
              className="text-[var(--accent)] font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-xs text-[var(--ink-muted)] text-center max-w-xs">
        By continuing, you agree to Elixora&apos;s terms of service and acknowledge our
        HIPAA-compliant privacy practices.
      </p>
    </div>
  );
}

"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { BreathOrb } from "@/components/ui/breath-orb";
import { Eye, EyeOff, AlertCircle, Loader2, UserCheck, LogOut, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { user, logout, saveSession } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "Male",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        age: form.age ? parseInt(form.age, 10) : null,
      };

      const data = await signup(payload);
      saveSession(data.access_token, data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-4 py-12 transition-colors duration-200 relative overflow-hidden">
      {/* Ambient glow backdrop */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[var(--glow-a)] to-[var(--glow-b)] opacity-20 blur-3xl pointer-events-none" />

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

        <div className="w-full clinical-card rounded-2xl shadow-xl p-7 sm:p-8 transition-colors duration-200">
          <div className="mb-7">
            <p className="clinical-eyebrow mb-2">Create your secure workspace</p>
            <h1 className="text-2xl font-display font-semibold text-[var(--ink)] mb-1.5">
              Create an account
            </h1>
            <p className="text-sm text-[var(--ink-muted)]">
              Sign up to access your personal AI health assistant.
            </p>
          </div>

          {/* Active Session Notice if already logged in */}
          {user && (
            <div className="mb-6 p-4 rounded-2xl bg-[var(--accent-soft)]/40 border border-[var(--accent)]/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
                <UserCheck className="w-4 h-4" />
                <span>Currently Logged In</span>
              </div>
              <p className="text-xs text-[var(--ink)]">
                You are signed in as <strong>{user.name}</strong> ({user.email}).
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 py-2 px-3 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1 shadow-xs"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-rose-600 text-xs font-semibold hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div
              id="signup-error"
              role="alert"
              className="mb-5 flex items-start gap-2.5 text-sm text-[var(--warn)] bg-[var(--warn-soft)] border border-[var(--warn)]/20 rounded-xl px-3.5 py-3 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-[var(--ink)] mb-1.5 font-mono uppercase tracking-wider"
              >
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                name="name"
                required
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--border)] px-4 py-3 text-sm focus-ring placeholder:text-[var(--ink-muted)]"
                placeholder="Jane Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-[var(--ink)] mb-1.5 font-mono uppercase tracking-wider"
              >
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--border)] px-4 py-3 text-sm focus-ring placeholder:text-[var(--ink-muted)]"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-[var(--ink)] mb-1.5 font-mono uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--border)] px-4 py-3 pr-11 text-sm focus-ring placeholder:text-[var(--ink-muted)]"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  id="toggle-password-signup"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors p-1 focus-ring rounded-lg"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {form.password.length > 0 && form.password.length < 6 && (
                <p className="mt-1.5 text-xs text-[var(--warn)] font-medium">
                  Password must be at least 6 characters ({form.password.length}/6)
                </p>
              )}
            </div>

            {/* Age + Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="signup-age"
                  className="block text-xs font-semibold text-[var(--ink)] mb-1.5 font-mono uppercase tracking-wider"
                >
                  Age <span className="text-[var(--ink-muted)] font-normal text-[10px] lowercase">(optional)</span>
                </label>
                <input
                  id="signup-age"
                  type="number"
                  name="age"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--border)] px-4 py-3 text-sm focus-ring placeholder:text-[var(--ink-muted)]"
                  placeholder="25"
                />
              </div>
              <div>
                <label
                  htmlFor="signup-gender"
                  className="block text-xs font-semibold text-[var(--ink)] mb-1.5 font-mono uppercase tracking-wider"
                >
                  Gender
                </label>
                <select
                  id="signup-gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--border)] px-4 py-3 text-sm focus-ring"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full clinical-button py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1 focus-ring"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-sm text-[var(--ink-muted)] mt-6 text-center">
            Already have an account?{" "}
            <Link
              href="/login"
              id="go-to-login"
              className="text-[var(--accent)] font-semibold hover:underline focus-ring rounded-md px-1"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-xs text-[var(--ink-muted)] text-center max-w-xs">
        By creating an account, you agree to Elixora&apos;s terms of service and acknowledge our
        HIPAA-compliant privacy practices.
      </p>
    </div>
  );
}

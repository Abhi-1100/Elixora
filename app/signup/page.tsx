"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
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
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-4 py-10 transition-colors duration-200 relative overflow-hidden font-sans">
      {/* Ambient background glows matching template aesthetic in Elixora dark theme */}
      <div className="absolute top-1/4 -left-20 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-[var(--accent)]/30 via-indigo-600/20 to-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-purple-500/25 via-blue-600/15 to-transparent blur-[120px] pointer-events-none" />

      {/* Brand mark above card */}
      <Link href="/" className="flex items-center gap-2.5 mb-6 group z-10">
        <BreathOrb size="sm" mode="idle" />
        <span className="font-semibold text-lg tracking-tight text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
          Elixora
        </span>
      </Link>

      {/* Centered Template Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="w-full bg-[#0A0E1A]/85 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-blue-950/40 p-8 sm:p-9 transition-all duration-300">
          
          {/* Title Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] mb-2 font-display">
              Create an Account
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)] font-normal">
              Sign up to access your personal AI health assistant
            </p>
          </div>

          {/* Active Session Notice if already logged in */}
          {user && (
            <div className="mb-6 p-3.5 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[var(--accent)]">
                <UserCheck className="w-4 h-4" />
                <span>Currently Logged In</span>
              </div>
              <p className="text-[var(--ink)]">
                Signed in as <strong>{user.name}</strong> ({user.email}).
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => router.push("/chat")}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1 shadow-xs"
                >
                  <span>Go to Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="py-1.5 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-rose-500 font-semibold hover:bg-rose-500/10 transition-colors flex items-center gap-1"
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
              className="mb-6 flex items-start gap-2.5 text-xs text-[var(--warn)] bg-[var(--warn-soft)] border border-[var(--warn)]/20 rounded-2xl px-4 py-3 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-[var(--ink)] text-left"
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
                className="w-full rounded-2xl bg-white/[0.04] text-[var(--ink)] border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--ink-muted)]/70"
                placeholder="Jane Doe"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-[var(--ink)] text-left"
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
                className="w-full rounded-2xl bg-white/[0.04] text-[var(--ink)] border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--ink-muted)]/70"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-[var(--ink)] text-left"
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
                  className="w-full rounded-2xl bg-white/[0.04] text-[var(--ink)] border border-white/10 px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--ink-muted)]/70"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  id="toggle-password-signup"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors p-1 focus:outline-none"
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
                <p className="mt-1 text-xs text-[var(--warn)] font-medium">
                  Password must be at least 6 characters ({form.password.length}/6)
                </p>
              )}
            </div>

            {/* Age + Gender */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-age"
                  className="block text-xs font-semibold text-[var(--ink)] text-left"
                >
                  Age <span className="text-[var(--ink-muted)] font-normal text-[10px]">(optional)</span>
                </label>
                <input
                  id="signup-age"
                  type="number"
                  name="age"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-white/[0.04] text-[var(--ink)] border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--ink-muted)]/70"
                  placeholder="25"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-gender"
                  className="block text-xs font-semibold text-[var(--ink)] text-left"
                >
                  Gender
                </label>
                <select
                  id="signup-gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-[#0A0E1A] text-[var(--ink)] border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                >
                  <option value="Male" className="bg-[#0A0E1A] text-white">Male</option>
                  <option value="Female" className="bg-[#0A0E1A] text-white">Female</option>
                  <option value="Other" className="bg-[#0A0E1A] text-white">Other</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#09153a] hover:bg-[#0f2157] text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-950/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-blue-500/30 hover:border-blue-400/50 active:scale-[0.99] mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            <div className="h-px flex-1 bg-[#D8E4E1]/30" />
            <span>Or continue with</span>
            <div className="h-px flex-1 bg-[#D8E4E1]/30" />
          </div>

          <GoogleLoginButton onError={setError} />

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[var(--ink-muted)]">
              Already have an account?{" "}
              <Link
                href="/login"
                id="go-to-login"
                className="text-[var(--accent)] font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer HIPAA notice */}
      <p className="mt-6 text-[11px] text-[var(--ink-muted)]/70 text-center max-w-xs z-10">
        By continuing, you agree to Elixora&apos;s terms of service and acknowledge our HIPAA-compliant privacy practices.
      </p>
    </div>
  );
}

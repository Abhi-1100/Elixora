"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { BreathOrb } from "@/components/ui/breath-orb";
import { Eye, EyeOff, AlertCircle, Loader2, UserCheck, LogOut, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, logout, saveSession } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await login(form);
      saveSession(data.access_token, data.user);
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSocialLogin(provider: string) {
    alert(`${provider} sign-in is currently in demo mode. Please use email and password to log in.`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-4 py-10 transition-colors duration-200 relative overflow-hidden font-sans">
      {/* Ambient background glows matching template aesthetic in Elixora dark theme */}
      <div className="absolute top-1/4 -left-20 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-[var(--accent)]/30 via-indigo-600/20 to-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-purple-500/25 via-blue-600/15 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />

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
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)] font-normal">
              Sign in to your account to continue
            </p>
          </div>

          {/* Active Session Banner */}
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
              id="login-error"
              role="alert"
              className="mb-6 flex items-start gap-2.5 text-xs text-[var(--warn)] bg-[var(--warn-soft)] border border-[var(--warn)]/20 rounded-2xl px-4 py-3 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-[var(--ink)] text-left"
              >
                Email Address
              </label>
              <input
                id="login-email"
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
            <div className="space-y-2">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[var(--ink)] text-left"
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
                  className="w-full rounded-2xl bg-white/[0.04] text-[var(--ink)] border border-white/10 px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--ink-muted)]/70"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  id="toggle-password-login"
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
            </div>

            {/* Sign In Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#09153a] hover:bg-[#0f2157] text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-950/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-blue-500/30 hover:border-blue-400/50 active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center justify-center relative">
            <div className="w-full border-t border-white/10 absolute inset-0 my-auto" />
            <span className="relative bg-[#0A0E1A] px-3 text-[10px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] z-10">
              OR CONTINUE WITH
            </span>
          </div>

          {/* Social Auth Buttons */}
          <div className="space-y-2.5">
            {/* Google Identity Services renders Google's official button here. */}
            <GoogleLoginButton onError={setError} />

            {/* Apple */}
            <button
              type="button"
              onClick={() => handleSocialLogin("Apple")}
              className="w-full py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[var(--ink)] text-xs font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.99]"
            >
              <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.93c.63-.78 1.05-1.87.94-2.93-.91.04-2.02.61-2.67 1.37-.58.67-1.09 1.77-.95 2.82 1.02.08 2.05-.48 2.68-1.26" />
              </svg>
              <span>Continue with Apple</span>
            </button>

            {/* Meta */}
            <button
              type="button"
              onClick={() => handleSocialLogin("Meta")}
              className="w-full py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[var(--ink)] text-xs font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.99]"
            >
              <svg className="w-4 h-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
              </svg>
              <span>Continue with Meta</span>
            </button>
          </div>

          {/* Footer links */}
          <div className="mt-7 pt-2 text-center space-y-3">
            <button
              type="button"
              onClick={() => {
                setForgotModal(true);
                setForgotSent(false);
              }}
              className="text-xs text-[var(--ink-muted)] hover:text-[var(--accent)] font-medium transition-colors focus:outline-none"
            >
              Forgot your password?
            </button>

            <p className="text-xs text-[var(--ink-muted)]">
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
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#0A0E1A] border border-white/10 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-lg font-bold text-[var(--ink)]">Reset Password</h3>
            {forgotSent ? (
              <div className="space-y-3">
                <p className="text-xs text-emerald-400 font-medium">
                  Password reset link has been sent to your email! Please check your inbox.
                </p>
                <button
                  onClick={() => setForgotModal(false)}
                  className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSent(true);
                }}
                className="space-y-3"
              >
                <p className="text-xs text-[var(--ink-muted)]">
                  Enter your email address and we will send you a reset link.
                </p>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-white/[0.04] text-[var(--ink)] border border-white/10 px-3.5 py-2.5 text-xs focus:outline-none focus:border-[var(--accent)]"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotModal(false)}
                    className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-[var(--ink-muted)] font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer HIPAA notice */}
      <p className="mt-6 text-[11px] text-[var(--ink-muted)]/70 text-center max-w-xs z-10">
        By continuing, you agree to Elixora&apos;s terms of service and acknowledge our HIPAA-compliant privacy practices.
      </p>
    </div>
  );
}

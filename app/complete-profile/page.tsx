"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { BreathOrb } from "@/components/ui/breath-orb";
import { AlertCircle, Loader2, UserCheck, ArrowRight, Sparkles, User as UserIcon } from "lucide-react";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, token, saveSession } = useAuth();

  const [age, setAge] = useState<string>(user?.age ? String(user.age) : "");
  const [gender, setGender] = useState<string>(user?.gender || "Male");
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const parsedAge = Number(age);
    if (!age || isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setError("Please enter a valid age between 1 and 120.");
      return;
    }

    setSaving(true);
    try {
      const data = await updateProfile({ age: parsedAge, gender }, token);
      if (data?.user && token) {
        saveSession(token, data.user);
      }
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Redirect to login if user session is missing
  if (!user && !saving) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-4 py-10 relative overflow-hidden font-sans">
        <div className="relative w-full max-w-md z-10 text-center space-y-4 bg-[#0A0E1A]/85 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <BreathOrb size="md" mode="idle" />
          <h2 className="text-xl font-bold text-[var(--ink)] font-display">Session Expired</h2>
          <p className="text-xs text-[var(--ink-muted)]">Please sign in to complete your profile setup.</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-[#09153a] hover:bg-[#0f2157] text-white text-xs font-semibold border border-blue-500/30 transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-4 py-10 transition-colors duration-200 relative overflow-hidden font-sans">
      {/* Ambient background glows matching login page theme */}
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

      {/* Centered Profile Completion Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="w-full bg-[#0A0E1A]/85 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-blue-950/40 p-8 sm:p-9 transition-all duration-300">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] mb-2 font-display">
              Complete Your Profile
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)] font-normal leading-relaxed">
              Please enter your age and gender so Elixora can calibrate lab reference ranges and clinical insights accurately for you.
            </p>
          </div>

          {/* User Email Badge */}
          {user && (
            <div className="mb-6 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-xs text-left overflow-hidden">
                <p className="font-semibold text-[var(--ink)] truncate">{user.name || "Google Account"}</p>
                <p className="text-[var(--ink-muted)] text-[11px] truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              id="profile-error"
              role="alert"
              className="mb-6 flex items-start gap-2.5 text-xs text-[var(--warn)] bg-[var(--warn-soft)] border border-[var(--warn)]/20 rounded-2xl px-4 py-3 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Age Input */}
            <div className="space-y-2">
              <label
                htmlFor="profile-age"
                className="block text-xs font-semibold text-[var(--ink)] text-left"
              >
                Age <span className="text-[var(--warn)]">*</span>
              </label>
              <input
                id="profile-age"
                type="number"
                name="age"
                required
                min={1}
                max={120}
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (error) setError("");
                }}
                className="w-full rounded-2xl bg-white/[0.04] text-[var(--ink)] border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--ink-muted)]/70"
                placeholder="e.g. 28"
              />
            </div>

            {/* Gender Input */}
            <div className="space-y-2">
              <label
                htmlFor="profile-gender"
                className="block text-xs font-semibold text-[var(--ink)] text-left"
              >
                Gender <span className="text-[var(--warn)]">*</span>
              </label>
              <select
                id="profile-gender"
                name="gender"
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  if (error) setError("");
                }}
                className="w-full rounded-2xl bg-[#0A0E1A] text-[var(--ink)] border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] cursor-pointer"
              >
                <option value="Male" className="bg-[#0A0E1A] text-white">Male</option>
                <option value="Female" className="bg-[#0A0E1A] text-white">Female</option>
                <option value="Other" className="bg-[#0A0E1A] text-white">Other</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              id="profile-submit-btn"
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#09153a] hover:bg-[#0f2157] text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-950/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-blue-500/30 hover:border-blue-400/50 active:scale-[0.99] mt-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Save & Continue to Chat</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer HIPAA notice */}
      <p className="mt-6 text-[11px] text-[var(--ink-muted)]/70 text-center max-w-xs z-10">
        Your profile data is encrypted and used strictly for gender-aware health reference range evaluations.
      </p>
    </div>
  );
}

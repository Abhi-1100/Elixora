"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, token, saveSession } = useAuth();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = await updateProfile({ age: Number(age), gender }, token);
      saveSession(token!, data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (!user || !token) return null;

  return (
    <main className="min-h-screen bg-[#E8F3F1] px-4 py-16 text-[#0B3D3A]">
      <div className="mx-auto max-w-md rounded-3xl border border-[#D8E4E1] bg-white p-8 shadow-xl">
        <h1 className="font-display text-2xl font-bold">Complete your profile</h1>
        <p className="mt-2 text-sm text-[#416462]">We use this information for gender-aware lab reference ranges.</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block text-sm font-semibold">Age
            <input required min={1} max={120} type="number" value={age} onChange={(e) => setAge(e.target.value)} className="mt-2 w-full rounded-xl border border-[#D8E4E1] px-4 py-3 outline-none focus:border-[#0B3D3A]" />
          </label>
          <label className="block text-sm font-semibold">Gender
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="mt-2 w-full rounded-xl border border-[#D8E4E1] bg-white px-4 py-3 outline-none focus:border-[#0B3D3A]">
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={saving} className="w-full rounded-xl bg-[#0B3D3A] px-4 py-3 font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : "Continue to dashboard"}</button>
        </form>
      </div>
    </main>
  );
}

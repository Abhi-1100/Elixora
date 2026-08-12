"use client";
// app/login/page.jsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { saveSession } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E8F3F1] px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#D8E4E1] shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-[#0B3D3A] mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Log in to continue to your health dashboard.
        </p>

        {error && (
          <div className="mb-4 text-sm text-[#D97A4D] bg-[#FBEDE6] border border-[#F0C9B4] rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#D8E4E1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D3A]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#D8E4E1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D3A]"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0B3D3A] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#0a332f] transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#0B3D3A] font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

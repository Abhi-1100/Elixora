"use client";
// app/signup/page.jsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { saveSession } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
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
        age: form.age ? Number(form.age) : null,
      };
      const data = await signup(payload);
      saveSession(data.access_token, data.user);
      router.push("/chat");
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
          Create your account
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Get personalized health guidance, report summaries, and medicine info.
        </p>

        {error && (
          <div className="mb-4 text-sm text-[#D97A4D] bg-[#FBEDE6] border border-[#F0C9B4] rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Full name
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#D8E4E1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D3A]"
              placeholder="Jane Doe"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Age
              </label>
              <input
                type="number"
                name="age"
                min="1"
                max="120"
                value={form.age}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#D8E4E1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D3A]"
                placeholder="25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#D8E4E1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D3A]"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
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
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0B3D3A] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#0a332f] transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-[#0B3D3A] font-medium hover:underline">
            Log in
          </Link>
        </p>

        <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
          This platform provides general guidance, not medical diagnosis.
          Always consult a licensed doctor for medical decisions.
        </p>
      </div>
    </div>
  );
}

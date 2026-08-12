"use client";
// app/dashboard/page.jsx
// A minimal protected page - shows the pattern to reuse for chat/report/medicine pages.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2EC]">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null; // redirecting

  return (
    <div className="min-h-screen bg-[#F5F2EC] p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-[#D8E4E1] p-6">
        <h1 className="text-xl font-semibold text-[#0B3D3A] mb-2">
          Welcome, {user.name}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          You're logged in as {user.email}. This is a placeholder dashboard —
          chat, report upload, and medicine scan modules will plug in here.
        </p>
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="text-sm text-[#D97A4D] font-medium hover:underline"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

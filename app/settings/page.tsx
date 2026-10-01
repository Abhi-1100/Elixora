"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { SettingsModal } from "@/components/chat/settings-modal";
import { Loader2 } from "lucide-react";

function SettingsPageContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center p-4">
      <SettingsModal
        isOpen={true}
        onClose={() => router.push("/chat")}
        initialTab="general"
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}

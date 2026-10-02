"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, Loader2, X } from "lucide-react";
import { getContacts, sendAlert } from "@/lib/api";

interface EmergencyAlertPromptProps {
  token: string | null;
}

function locationPayload(): Promise<{ latitude?: number; longitude?: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve({}),
      { timeout: 7000, maximumAge: 30000 }
    );
  });
}

export function EmergencyAlertPrompt({ token }: EmergencyAlertPromptProps) {
  const [seconds, setSeconds] = useState(10);
  const [contactCount, setContactCount] = useState<number | null>(null);
  const [state, setState] = useState<"pending" | "sending" | "sent" | "cancelled" | "error" | "empty">("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!token) return;
    getContacts(token)
      .then((data) => {
        if (!mounted) return;
        const count = data.contacts?.length || 0;
        setContactCount(count);
        if (!count) setState("empty");
      })
      .catch(() => mounted && setContactCount(0));
    return () => { mounted = false; };
  }, [token]);

  const notify = async (withLocation: boolean) => {
    if (!token || state === "sending" || state === "sent") return;
    setState("sending");
    try {
      const location = withLocation ? await locationPayload() : {};
      const result = await sendAlert({ trigger: "chat_emergency", ...location }, token);
      setMessage(result.message || `Alert sent to ${result.contacts_notified || 0} contacts`);
      setState("sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The alert could not be sent.");
      setState("error");
    }
  };

  useEffect(() => {
    if (state !== "pending" || contactCount === 0) return;
    if (seconds <= 0) {
      void notify(false);
      return;
    }
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds, state, contactCount]);

  if (state === "empty") {
    return <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-3 text-xs text-amber-100"><p className="font-medium">No emergency contacts saved yet.</p><Link href="/emergency" className="mt-1 inline-flex items-center gap-1 text-amber-300 hover:underline">Add contacts <ExternalLink className="h-3 w-3" /></Link></div>;
  }
  if (state === "sent") {
    return <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-3 text-xs text-emerald-100"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{message}</div>;
  }
  if (state === "cancelled") {
    return <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-[var(--ink-muted)]"><X className="h-4 w-4" />Alert cancelled.</div>;
  }
  if (state === "error") {
    return <div className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-3 text-xs text-red-100"><p>{message}</p><button onClick={() => { setState("pending"); setSeconds(10); }} className="mt-2 font-semibold text-red-300 hover:underline">Try again</button></div>;
  }

  return (
    <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3.5 shadow-[0_0_24px_rgba(239,68,68,0.08)]">
      <div className="flex items-start gap-2.5">
        <div className="rounded-lg bg-red-500/15 p-2 text-red-300"><AlertTriangle className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1"><p className="font-semibold text-red-100">Notify your emergency contacts?</p><p className="mt-0.5 text-[11px] text-red-100/70">This sends only your name, time, and optional location.</p></div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-red-300"><Clock3 className="h-3.5 w-3.5" />{seconds}s</div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => void notify(true)} disabled={state === "sending"} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-60">{state === "sending" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Notify now</button>
        <button onClick={() => setState("cancelled")} disabled={state === "sending"} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[var(--ink-muted)] hover:bg-white/5 disabled:opacity-60">Cancel</button>
      </div>
    </div>
  );
}

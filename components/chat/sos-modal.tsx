"use client";

import React, { useEffect, useState, useRef } from "react";
import { Siren, X, CheckCircle2, AlertTriangle, Loader2, Send, MapPin, ShieldAlert, ArrowRight } from "lucide-react";
import { sendAlert } from "@/lib/api";
import { useRouter } from "next/navigation";

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onOpenSettings?: (tab?: string) => void;
  onAlertStatus?: (notice: { type: "pending" | "success" | "error"; message: string } | null) => void;
}

export function SosModal({
  isOpen,
  onClose,
  token,
  onOpenSettings,
  onAlertStatus,
}: SosModalProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(5);
  const [status, setStatus] = useState<"countdown" | "sending" | "sent" | "error">("countdown");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isTokenExpired, setIsTokenExpired] = useState<boolean>(false);
  const [isNoContacts, setIsNoContacts] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string>("");

  const router = useRouter();
  const coordsRef = useRef<{ latitude?: number; longitude?: number }>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset and initialize when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Reset states
    setSecondsLeft(5);
    setStatus("countdown");
    setErrorMessage("");
    setIsTokenExpired(false);
    setIsNoContacts(false);
    setResultMessage("");
    coordsRef.current = {};

    // Silently pre-fetch user's geolocation in background during the countdown
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          coordsRef.current = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        },
        () => {
          // If location is denied or timed out, we still proceed without coordinates
        },
        { timeout: 5000, maximumAge: 30000 }
      );
    }

    // Start 5-second countdown
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // When countdown hits 0, automatically dispatch alert
  useEffect(() => {
    if (isOpen && status === "countdown" && secondsLeft === 0) {
      void dispatchEmergencyAlert();
    }
  }, [secondsLeft, isOpen, status]);

  const dispatchEmergencyAlert = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("sending");

    try {
      const payload = {
        trigger: "sos_button" as const,
        latitude: coordsRef.current.latitude,
        longitude: coordsRef.current.longitude,
      };

      const result = await sendAlert(payload, token);
      const isOk = result.status === "sent" || result.status === "partial";
      const message =
        result.message ||
        `Emergency alert sent to family members via SMS & Email.`;

      setStatus(isOk ? "sent" : "error");
      if (isOk) {
        setResultMessage(message);
        onAlertStatus?.({ type: "success", message });
        // Auto-close after 3.5 seconds
        setTimeout(() => {
          onClose();
        }, 3500);
      } else {
        setErrorMessage(result.message || "Failed to deliver emergency alert.");
        onAlertStatus?.({ type: "error", message: result.message || "SOS alert failed" });
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to send emergency notification.";
      const expired =
        err?.isTokenExpired ||
        msg.toLowerCase().includes("token has expired") ||
        msg.toLowerCase().includes("session has expired");
      const noContacts = msg.toLowerCase().includes("contact");

      setIsTokenExpired(expired);
      setIsNoContacts(noContacts);
      setErrorMessage(
        expired
          ? "Your login session has expired. Please sign in again to send alerts."
          : msg
      );
      setStatus("error");
      onAlertStatus?.({
        type: "error",
        message: expired ? "Session expired. Please log in again." : msg,
      });
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("countdown");
    onAlertStatus?.({ type: "pending", message: "SOS alert was cancelled." });
    setTimeout(() => {
      onAlertStatus?.(null);
    }, 3000);
    onClose();
  };

  const handleSendNow = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    void dispatchEmergencyAlert();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0d131f] p-6 sm:p-7 shadow-2xl shadow-red-500/10 text-center overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* State 1: 5-Second Countdown */}
        {status === "countdown" && (
          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Siren Beacon */}
            <div className="relative mb-5 flex items-center justify-center">
              <span className="absolute inline-flex h-20 w-20 animate-ping rounded-full bg-red-500/30 opacity-75" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 border-2 border-red-500/50 shadow-lg shadow-red-500/30">
                <Siren className="h-8 w-8 text-red-400 animate-pulse" />
              </div>
            </div>

            <h2 id="sos-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Emergency SOS Triggered
            </h2>

            <p className="mt-2 text-sm text-red-200/80 max-w-xs leading-relaxed">
              Sending emergency SMS & Email alert with your location to your family members in:
            </p>

            {/* Countdown Display */}
            <div className="my-5 flex flex-col items-center">
              <div className="flex items-baseline gap-1 text-6xl font-black font-mono text-red-400">
                <span>{secondsLeft}</span>
                <span className="text-xl font-medium text-red-300/70">s</span>
              </div>

              {/* Countdown progress bar */}
              <div className="w-56 bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                <div
                  style={{ width: `${(secondsLeft / 5) * 100}%` }}
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-1000 ease-linear rounded-full"
                />
              </div>

              <p className="mt-3 text-xs text-amber-200/90 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                Triggered by mistake? Click Cancel below immediately.
              </p>
            </div>

            {/* Action Buttons: Cancel vs Send Now */}
            <div className="mt-4 flex w-full gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold border border-white/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                Cancel SOS
              </button>

              <button
                type="button"
                onClick={handleSendNow}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                Send Now
              </button>
            </div>
          </div>
        )}

        {/* State 2: Sending */}
        {status === "sending" && (
          <div className="relative z-10 flex flex-col items-center py-6">
            <Loader2 className="h-14 w-14 text-red-400 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white">Sending Emergency Alert...</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)] max-w-xs">
              Contacting your family members via SMS & Email with your GPS coordinates...
            </p>
          </div>
        )}

        {/* State 3: Successfully Sent */}
        {status === "sent" && (
          <div className="relative z-10 flex flex-col items-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="text-xl font-bold text-white">Emergency Alert Sent!</h2>
            <p className="mt-2 text-sm text-emerald-200/90 max-w-xs leading-relaxed">
              {resultMessage || "SMS and Email notifications have been delivered to your family members."}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition"
            >
              Close
            </button>
          </div>
        )}

        {/* State 4: Error */}
        {status === "error" && (
          <div className="relative z-10 flex flex-col items-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 border-2 border-red-500/40 text-red-400 mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-white">Alert Delivery Notice</h2>
            <p className="mt-2 text-sm text-red-200/90 max-w-xs leading-relaxed">
              {errorMessage}
            </p>

            <div className="mt-6 flex w-full flex-col gap-2">
              {isTokenExpired && (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  Log In Again <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {isNoContacts && onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings("contacts");
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition"
                >
                  Open Contacts Settings
                </button>
              )}

              <div className="flex w-full gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm transition"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("countdown");
                    setSecondsLeft(5);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Send,
  Siren,
  X,
} from "lucide-react";
import { sendAlert } from "@/lib/api";
import { useRouter } from "next/navigation";

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onOpenSettings?: (tab?: string) => void;
  onAlertStatus?: (notice: { type: "pending" | "success" | "error"; message: string } | null) => void;
}

interface ChannelResult {
  requested: number;
  attempted: number;
  accepted: number;
  failed: number;
  invalid: number;
  configured: boolean;
  status: "provider_accepted" | "partial" | "failed" | "not_configured" | "not_requested";
  errors?: string[];
}

type AlertChannelResults = Partial<Record<"sms" | "email", ChannelResult>>;

function getChannelResults(error: unknown): AlertChannelResults | null {
  if (typeof error !== "object" || error === null || !("response" in error)) return null;
  const response = error.response;
  if (typeof response !== "object" || response === null || !("channel_results" in response)) return null;
  const results = response.channel_results;
  if (typeof results !== "object" || results === null) return null;
  return results as AlertChannelResults;
}

function formatChannelError(error: string) {
  const [category, detail] = error.split(":", 2);
  if (category === "missing_configuration") return `Missing ${detail}`;
  if (category === "invalid_configuration") return `Invalid ${detail}`;
  if (category === "invalid_recipient") {
    return detail === "sms" ? "Saved phone number is invalid" : "Saved email address is invalid";
  }
  if (category === "provider_error") {
    if (detail === "sendgrid_http_401") return "SendGrid authentication failed; check SENDGRID_API_KEY";
    if (detail === "sendgrid_http_403") return "SendGrid rejected the request; check Mail Send permission and sender authentication";
    if (detail === "twilio_20003") return "Twilio rejected the Account SID/Auth Token; verify both are current in backend/.env and restart Flask";
    if (detail === "sendgrid_timeout") return "SendGrid request timed out; verify network access and try again";
    if (detail === "sendgrid_connection_error") return "Could not connect to SendGrid; verify backend internet access";
    if (detail === "twilio_21211") return "Twilio rejected the destination phone number";
    if (detail === "twilio_21606") return "Twilio rejected the sender; use an SMS-capable authorized number";
    if (detail === "twilio_21608") return "Twilio trial accounts can only message verified destination numbers";
    return `Provider error (${detail})`;
  }
  if (category === "provider_rejected") return `Provider rejected the request (${detail})`;
  if (category === "delivery_failure") return `Provider reports delivery failure (${detail})`;
  return error;
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
  const [channelResults, setChannelResults] = useState<AlertChannelResults>({});

  const router = useRouter();
  const coordsRef = useRef<{ latitude?: number; longitude?: number }>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dispatchingRef = useRef(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  // Reset and initialize when modal opens
  useEffect(() => {
    if (!isOpen) return;

    idempotencyKeyRef.current =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : null;

    // The countdown is a confirmation window; it never sends on its own.
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

  async function dispatchEmergencyAlert() {
    if (dispatchingRef.current) return;
    dispatchingRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("sending");

    try {
      if (
        coordsRef.current.latitude === undefined &&
        coordsRef.current.longitude === undefined &&
        navigator.geolocation
      ) {
        await new Promise<void>((resolve) => {
          try {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                coordsRef.current = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                };
                resolve();
              },
              () => resolve(),
              { timeout: 5000, maximumAge: 30000 }
            );
          } catch {
            resolve();
          }
        });
      }
      const payload = {
        trigger: "sos_button" as const,
        latitude: coordsRef.current.latitude,
        longitude: coordsRef.current.longitude,
      };

      const result = await sendAlert(payload, token, idempotencyKeyRef.current || undefined);
      setChannelResults((result.channel_results || {}) as AlertChannelResults);
      const isOk = result.status === "queued" || result.status === "partial";
      const message =
        result.message ||
        `Alert request accepted for ${result.contacts_accepted || 0} contact(s). Delivery is not confirmed.`;

      setStatus(isOk ? "sent" : "error");
      if (isOk) {
        setResultMessage(message);
        onAlertStatus?.({ type: "success", message });
      } else {
        setErrorMessage(result.message || "Failed to deliver emergency alert.");
        onAlertStatus?.({ type: "error", message: result.message || "SOS alert failed" });
      }
    } catch (err: unknown) {
      const channelErrors = getChannelResults(err);
      if (channelErrors) setChannelResults(channelErrors);
      const msg = err instanceof Error ? err.message : "Failed to send emergency notification.";
      const expiredFlag =
        typeof err === "object" &&
        err !== null &&
        "isTokenExpired" in err &&
        err.isTokenExpired === true;
      const expired =
        expiredFlag ||
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
    } finally {
      dispatchingRef.current = false;
    }
  }

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
      <div className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-red-500/30 bg-[#0d131f] p-6 sm:p-7 shadow-2xl shadow-red-500/10 text-center">
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
              Review the alert, then choose Send Now to notify your saved contacts.
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
                No message is sent until you confirm with Send Now.
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
              Contacting your saved recipients through their enabled email and SMS options...
            </p>
          </div>
        )}

        {/* State 3: Successfully Sent */}
        {status === "sent" && (
          <div className="relative z-10 flex flex-col items-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="text-xl font-bold text-white">Emergency Alert Submitted</h2>
            <p className="mt-2 text-sm text-emerald-200/90 max-w-xs leading-relaxed">
              {resultMessage || "Notification providers accepted the request. Delivery is not confirmed."}
            </p>
            <div className="mt-3 w-full space-y-1 text-left text-xs text-emerald-100/80">
              {(["sms", "email"] as const).map((channel) => {
                const result = channelResults[channel];
                if (!result) return null;
                const title = channel === "sms" ? "SMS" : "Email";
                const detail = result.status === "not_configured"
                  ? "Not configured"
                  : result.status === "not_requested"
                    ? "Not enabled for contacts"
                    : `${result.accepted}/${result.attempted} provider-accepted, ${result.failed + result.invalid} failed`;
                const errors = result.errors?.map(formatChannelError).join("; ");
                return <p key={channel}>{title}: {detail}{errors ? ` — ${errors}` : ""}</p>;
              })}
            </div>

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
            <div className="mt-3 w-full space-y-1 text-left text-xs text-red-100/80">
              {(["sms", "email"] as const).map((channel) => {
                const result = channelResults[channel];
                if (!result) return null;
                const title = channel === "sms" ? "SMS" : "Email";
                const detail = result.status === "not_configured"
                  ? "Not configured"
                  : result.status === "not_requested"
                    ? "Not enabled for contacts"
                    : `${result.accepted}/${result.attempted} provider-accepted, ${result.failed + result.invalid} failed`;
                const errors = result.errors?.map(formatChannelError).join("; ");
                return <p key={channel}>{title}: {detail}{errors ? ` — ${errors}` : ""}</p>;
              })}
            </div>

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
                {Object.values(channelResults).some((channel) => channel?.configured) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsTokenExpired(false);
                      setIsNoContacts(false);
                      setErrorMessage("");
                      setChannelResults({});
                      idempotencyKeyRef.current =
                        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                          ? crypto.randomUUID()
                          : null;
                      void dispatchEmergencyAlert();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

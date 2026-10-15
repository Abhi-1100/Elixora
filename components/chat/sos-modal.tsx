"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Send,
  Siren,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getContacts, sendAlert } from "@/lib/api";

interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone?: string | null;
  email?: string | null;
  is_primary?: boolean;
}

interface AlertChannelResult {
  requested: number;
  attempted: number;
  accepted: number;
  failed: number;
  invalid: number;
  configured: boolean;
  status: string;
}

interface AlertResult {
  status: string;
  message?: string;
  channel_results?: Partial<Record<"sms" | "email", AlertChannelResult>>;
}

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onOpenSettings?: (tab?: string) => void;
  onAlertStatus?: (notice: { type: "pending" | "success" | "error"; message: string } | null) => void;
}

type ModalStatus = "countdown" | "loading" | "contacts" | "error";

function normalizeWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone || !/^\+?[\d\s().-]+$/.test(phone.trim())) return null;

  let digits = phone.trim().replace(/\D/g, "");
  if (phone.trim().startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10) digits = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;

  return /^[1-9]\d{6,14}$/.test(digits) ? digits : null;
}

function getPosition(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const { latitude, longitude } = coords;
          resolve(
            Number.isFinite(latitude) &&
              Number.isFinite(longitude) &&
              latitude >= -90 &&
              latitude <= 90 &&
              longitude >= -180 &&
              longitude <= 180
              ? { latitude, longitude }
              : null
          );
        },
        () => resolve(null),
        { timeout: 8000, maximumAge: 30000 }
      );
    } catch {
      resolve(null);
    }
  });
}

export function SosModal({
  isOpen,
  onClose,
  token,
  onOpenSettings,
  onAlertStatus,
}: SosModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [status, setStatus] = useState<ModalStatus>("countdown");
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [message, setMessage] = useState("");
  const [hasLocation, setHasLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryFailed, setDeliveryFailed] = useState(false);
  const [callConfirmation, setCallConfirmation] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  async function prepareSos() {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("loading");
    setErrorMessage("");
    setDeliveryMessage("");
    setDeliveryFailed(false);

    try {
      let deliveryRequestFailed = false;
      const position = await getPosition();
      setHasLocation(position !== null);
      const locationLink = position
        ? `https://maps.google.com/?q=${position.latitude},${position.longitude}`
        : null;
      const alertMessage = locationLink
        ? `SOS! I need help. My current location is: ${locationLink}. Please contact me immediately.`
        : "SOS! I need help. Please contact me immediately.";
      setMessage(alertMessage);

      if (!token) {
        throw new Error("Please sign in to access your saved emergency contacts.");
      }
      try {
        const alert = (await sendAlert(
          {
            trigger: "sos_button",
            latitude: position?.latitude,
            longitude: position?.longitude,
          },
          token
        )) as AlertResult;
        const channelSummary = (["sms", "email"] as const)
          .map((channel) => {
            const result = alert.channel_results?.[channel];
            if (!result || result.requested === 0) return null;
            const label = channel === "sms" ? "SMS" : "Email";
            if (!result.configured) return `${label} is not configured.`;
            if (result.accepted > 0) {
              return `${label}: ${result.accepted} request(s) accepted by the provider; delivery is not confirmed.`;
            }
            if (result.invalid > 0) return `${label}: saved recipient details are invalid.`;
            if (result.failed > 0) return `${label}: provider did not accept the request.`;
            return `${label}: no request was accepted.`;
          })
          .filter(Boolean)
          .join(" ");
        const hasAcceptedRequest = Object.values(alert.channel_results || {}).some(
          (result) => (result?.accepted || 0) > 0
        );
        const noEnabledChannels = Object.values(alert.channel_results || {}).every(
          (result) => !result || result.requested === 0
        );
        deliveryRequestFailed =
          alert.status === "failed" ||
          alert.status === "partial" ||
          (!hasAcceptedRequest && !noEnabledChannels);
        setDeliveryFailed(deliveryRequestFailed);
        setDeliveryMessage(
          [
            alert.message,
            channelSummary,
            noEnabledChannels ? "No emergency contact has SMS or Email alerts enabled." : "",
          ]
            .filter(Boolean)
            .join(" ")
        );
      } catch (alertError) {
        deliveryRequestFailed = true;
        setDeliveryFailed(true);
        setDeliveryMessage(
          alertError instanceof Error
            ? `Email/SMS alert request failed: ${alertError.message}`
            : "Email/SMS alert request failed. You can still prepare a WhatsApp message."
        );
      }

      const result = await getContacts(token);
      const savedContacts = Array.isArray(result.contacts)
        ? (result.contacts as EmergencyContact[])
        : [];
      setContacts(savedContacts);
      setSelectedContactId(savedContacts[0]?.id || "");
      setStatus("contacts");
      onAlertStatus?.({
        type: deliveryRequestFailed ? "error" : "pending",
        message: deliveryRequestFailed
          ? "Email/SMS notification did not complete. Review the SOS screen; WhatsApp still requires you to press Send."
          : "SOS prepared. Email/SMS delivery is not guaranteed; WhatsApp requires you to press Send.",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load your saved emergency contacts."
      );
      setStatus("error");
    } finally {
      loadingRef.current = false;
    }
  }

  function handleCancel() {
    if (timerRef.current) clearInterval(timerRef.current);
    onAlertStatus?.({ type: "pending", message: "SOS alert was cancelled." });
    setTimeout(() => onAlertStatus?.(null), 3000);
    onClose();
  }

  function openEmergencyCall() {
    window.location.href = "tel:112";
  }

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId);
  const selectedNumber = normalizeWhatsAppNumber(selectedContact?.phone);
  const whatsappUrl = selectedNumber
    ? `https://wa.me/${selectedNumber}?text=${encodeURIComponent(message)}`
    : null;
  const tokenExpired =
    errorMessage.toLowerCase().includes("session has expired") ||
    errorMessage.toLowerCase().includes("token has expired");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-title"
    >
      <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-red-500/30 bg-[#0d131f] p-6 text-center shadow-2xl shadow-red-500/10 sm:p-7">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-red-500/20 blur-3xl" />

        {status === "countdown" && (
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative mb-5 flex items-center justify-center">
              <span className="absolute inline-flex h-20 w-20 animate-ping rounded-full bg-red-500/30 opacity-75" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500/50 bg-red-500/20 shadow-lg shadow-red-500/30">
                <Siren className="h-8 w-8 animate-pulse text-red-400" />
              </div>
            </div>
            <h2 id="sos-title" className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Emergency SOS Triggered
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-red-200/80">
              After you confirm, Elixora will ask for your location and let you choose a saved
              contact.
            </p>
            <div className="my-5 flex flex-col items-center">
              <div className="flex items-baseline gap-1 font-mono text-6xl font-black text-red-400">
                <span>{secondsLeft}</span>
                <span className="text-xl font-medium text-red-300/70">s</span>
              </div>
              <div className="mt-3 h-2 w-56 overflow-hidden rounded-full bg-white/10">
                <div
                  style={{ width: `${(secondsLeft / 5) * 100}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-1000 ease-linear"
                />
              </div>
              <p className="mt-3 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200/90">
                Send Now attempts enabled SMS/Email alerts. WhatsApp still needs you to press Send.
              </p>
            </div>
            <div className="mt-4 flex w-full gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/15 active:scale-95"
              >
                <X className="h-4 w-4" />
                Cancel SOS
              </button>
              <button
                type="button"
                onClick={() => void prepareSos()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-500 active:scale-95"
              >
                <Send className="h-4 w-4" />
                Send Now
              </button>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="relative z-10 flex flex-col items-center py-6">
            <Loader2 className="mb-4 h-14 w-14 animate-spin text-red-400" />
            <h2 id="sos-title" className="text-xl font-bold text-white">
              Preparing your SOS
            </h2>
            <p className="mt-2 max-w-xs text-sm text-[var(--ink-muted)]">
              Allow location access if you want to include a map link. You can continue without it.
            </p>
          </div>
        )}

        {status === "contacts" && (
          <div className="relative z-10 flex flex-col items-center py-2">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 id="sos-title" className="text-xl font-bold text-white">
              Choose an emergency contact
            </h2>
            <div
              className={`mt-3 flex items-center gap-1.5 text-xs ${hasLocation ? "text-emerald-200" : "text-amber-200"}`}
              role="status"
            >
              <MapPin className="h-3.5 w-3.5" />
              {hasLocation
                ? "Your current location is included."
                : "Location unavailable; the message will be sent without a map link."}
            </div>
            {deliveryMessage && (
              <p
                className={`mt-3 w-full rounded-lg border p-2.5 text-left text-xs leading-relaxed ${
                  deliveryFailed
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                    : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                }`}
                role={deliveryFailed ? "alert" : "status"}
              >
                {deliveryMessage}
              </p>
            )}

            {contacts.length > 0 ? (
              <div className="mt-4 w-full space-y-2 text-left">
                {contacts.map((contact) => {
                  const number = normalizeWhatsAppNumber(contact.phone);
                  const disabledReason = !contact.phone
                    ? "No phone number saved"
                    : !number
                      ? "Invalid phone number"
                      : "";
                  return (
                    <label
                      key={contact.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                        selectedContactId === contact.id
                          ? "border-red-400/60 bg-red-500/10"
                          : "border-white/10 bg-white/5"
                      } ${!number ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <input
                        type="radio"
                        name="sos-contact"
                        value={contact.id}
                        checked={selectedContactId === contact.id}
                        disabled={!number}
                        onChange={() => setSelectedContactId(contact.id)}
                        className="mt-0.5 accent-red-500"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-sm font-semibold text-white">
                          {contact.name}
                          {contact.is_primary && (
                            <span className="text-[10px] font-medium text-emerald-300">Primary</span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">
                          {contact.relation}
                          {contact.phone ? ` · ${contact.phone}` : ""}
                        </span>
                        {disabledReason && (
                          <span className="mt-1 block text-xs text-amber-200">{disabledReason}</span>
                        )}
                      </span>
                    </label>
                  );
                })}
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                    Message preview
                  </p>
                  <p className="mt-1 break-words text-xs leading-relaxed text-white/90">{message}</p>
                </div>
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      onAlertStatus?.({
                        type: "pending",
                        message: "WhatsApp opened with your SOS draft. Press Send in WhatsApp to share it.",
                      })
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                  >
                    <Send className="h-4 w-4" />
                    Open WhatsApp
                  </a>
                ) : (
                  <p className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-2 text-xs text-amber-100" role="alert">
                    Select a contact with a valid phone number to open WhatsApp.
                  </p>
                )}
                <p className="text-center text-[11px] leading-relaxed text-amber-100/80">
                  The message is not sent automatically. Review it in WhatsApp and press Send.
                </p>
              </div>
            ) : (
              <div className="mt-4 w-full rounded-xl border border-dashed border-white/20 px-4 py-6 text-sm text-[var(--ink-muted)]">
                No emergency contacts are saved yet.
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings("contacts");
                    }}
                    className="mt-3 block w-full rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500"
                  >
                    Open Contacts Settings
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white transition hover:bg-white/15"
            >
              Close
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="relative z-10 flex flex-col items-center py-4">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500/40 bg-red-500/20 text-red-400">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 id="sos-title" className="text-lg font-bold text-white">
              Unable to prepare SOS
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-red-200/90" role="alert">
              {errorMessage}
            </p>
            <div className="mt-6 flex w-full flex-col gap-2">
              {tokenExpired && (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Log In Again <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {onOpenSettings && errorMessage.toLowerCase().includes("contact") && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings("contacts");
                  }}
                  className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500"
                >
                  Open Contacts Settings
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white transition hover:bg-white/15"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="relative z-10 mt-4 border-t border-white/10 pt-4">
          {callConfirmation ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-sm font-semibold text-white">
                Call emergency services in India at 112?
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
                This will open your device&apos;s phone app. Call charges or network availability may
                apply.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCallConfirmation(false)}
                  className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={openEmergencyCall}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call 112
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCallConfirmation(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
            >
              <Phone className="h-4 w-4" />
              Call Emergency Services in India (112)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

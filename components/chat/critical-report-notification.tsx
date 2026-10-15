import { useMemo, useState } from "react";
import Image from "next/image";
import { AlertCircle, Loader2, Send, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getContacts } from "@/lib/api";

interface CriticalReportResult {
  status: string;
  test_name: string;
  value: number | string;
  unit: string;
  normal_range: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone?: string | null;
  notify_sms?: boolean;
}

export interface EmergencyNotificationStatus {
  email_status: string;
  contacts_notified?: number;
  channels?: string[];
}

interface CriticalReportNotificationProps {
  results: CriticalReportResult[];
  notification?: EmergencyNotificationStatus | null;
  reportId?: string;
  showEmailStatus?: boolean;
}

function normalizeWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone || !/^\+?[\d\s().-]+$/.test(phone.trim())) return null;

  let digits = phone.trim().replace(/\D/g, "");
  if (phone.trim().startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10) digits = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
  return /^[1-9]\d{9,14}$/.test(digits) ? digits : null;
}

function concernReason(result: CriticalReportResult): string {
  const match = result.normal_range.match(
    /^\s*(-?[\d,]+(?:\.\d+)?)\s*[-–]\s*(-?[\d,]+(?:\.\d+)?)\s*$/
  );
  if (match) {
    const value = Number(String(result.value).replaceAll(",", ""));
    const lower = Number(match[1].replaceAll(",", ""));
    const upper = Number(match[2].replaceAll(",", ""));
    if (Number.isFinite(value)) {
      if (value < lower) return "below the listed reference range";
      if (value > upper) return "above the listed reference range";
    }
  }
  return "classified as Critical by the report analysis";
}

export function CriticalReportEmailStatus({
  notification,
}: {
  notification?: EmergencyNotificationStatus | null;
}) {
  const emailStatus = notification?.email_status;
  if (emailStatus !== "partial" && emailStatus !== "failed") return null;

  const isPartial = emailStatus === "partial";
  const title = isPartial
    ? "Some critical report notifications failed"
    : "Critical report email failed";
  const description = isPartial
    ? "At least one enabled recipient or provider request failed. Check contact details and email-provider configuration."
    : "No email provider accepted the notification. Check enabled contacts, email addresses, and backend email-provider configuration.";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
        isPartial
          ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-100"
          : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-100"
      }`}
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-relaxed opacity-90">{description}</p>
      </div>
    </div>
  );
}

export function CriticalReportNotification({
  results,
  notification,
  reportId,
  showEmailStatus = true,
}: CriticalReportNotificationProps) {
  const { token } = useAuth();
  const criticalResults = useMemo(
    () =>
      results.filter(
        (result) =>
          result.status?.toLowerCase() === "critical" &&
          result.value !== null &&
          result.value !== undefined &&
          result.value !== "" &&
          result.test_name?.trim()
      ),
    [results],
  );
  const [isWhatsAppPreviewOpen, setIsWhatsAppPreviewOpen] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState("");

  if (criticalResults.length === 0) return null;

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId);
  const whatsappContacts = contacts.filter(
    (contact) => contact.notify_sms && normalizeWhatsAppNumber(contact.phone),
  );
  const selectedNumber = normalizeWhatsAppNumber(selectedContact?.phone);
  const message = [
    "Elixora critical lab report summary:",
    ...criticalResults.map(
      (result) =>
        `- ${result.test_name}: ${result.value} ${result.unit}; severity: Critical (${concernReason(result)}); reference range: ${result.normal_range} ${result.unit}.`
    ),
    reportId ? `Report reference: ${reportId}` : "",
    "Recommended action: Please help arrange urgent review by a qualified clinician. If there are severe symptoms, contact local emergency services.",
    "This automated report analysis is not a diagnosis.",
  ]
    .filter(Boolean)
    .join("\n");
  const whatsappUrl = selectedNumber
    ? `https://wa.me/${selectedNumber}?text=${encodeURIComponent(message)}`
    : null;

  async function openWhatsAppPreview() {
    setIsWhatsAppPreviewOpen(true);
    setContactsError("");
    if (!token) {
      setContactsError("Please sign in to load your saved emergency contacts.");
      return;
    }
    setContactsLoading(true);
    try {
      const response = await getContacts(token);
      if (!Array.isArray(response.contacts)) {
        throw new Error("The saved emergency contacts response was invalid.");
      }
      const savedContacts = response.contacts as EmergencyContact[];
      setContacts(savedContacts);
      setSelectedContactId((current) =>
        savedContacts.some((contact) => contact.id === current && contact.notify_sms && normalizeWhatsAppNumber(contact.phone))
          ? current
          : savedContacts.find((contact) => contact.notify_sms && normalizeWhatsAppNumber(contact.phone))?.id || ""
      );
    } catch (error) {
      setContactsError(
        error instanceof Error ? error.message : "Unable to load saved emergency contacts."
      );
    } finally {
      setContactsLoading(false);
    }
  }

  return (
    <>
      {showEmailStatus && <CriticalReportEmailStatus notification={notification} />}

      <button
        type="button"
        onClick={() => void openWhatsAppPreview()}
        className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[10px] font-semibold text-emerald-800 transition hover:bg-emerald-500/15 dark:text-emerald-100 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs"
        title="Prepare a critical report breakdown to review and send in WhatsApp"
      >
        <Image
          src="/whatsapp-mark.png"
          alt=""
          width={28}
          height={28}
          className="h-6 w-6 shrink-0 rounded-md object-cover sm:h-7 sm:w-7"
        />
        <span className="whitespace-nowrap sm:hidden">WhatsApp</span>
        <span className="hidden whitespace-nowrap sm:inline">Prepare WhatsApp breakdown</span>
      </button>

      {isWhatsAppPreviewOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="critical-whatsapp-title"
        >
          <section className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-emerald-500/30 bg-[var(--surface)] p-5 text-[var(--ink)] shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="critical-whatsapp-title" className="text-base font-semibold">
                  Review WhatsApp report message
                </h2>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Select a saved contact and check the actual critical results before opening WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppPreviewOpen(false)}
                aria-label="Close WhatsApp preview"
                className="rounded-lg p-1.5 text-[var(--ink-muted)] transition hover:bg-white/10 hover:text-[var(--ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {contactsLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--ink-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading saved emergency contacts...
              </div>
            ) : contactsError ? (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-200" role="alert">
                {contactsError}
              </p>
            ) : contacts.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--ink-muted)]">
                No saved emergency contacts are available.
              </p>
            ) : (
              <>
                <fieldset className="mt-4 space-y-2">
                  <legend className="mb-2 text-xs font-semibold">Choose a contact</legend>
                  {whatsappContacts.map((contact) => {
                    const validPhone = normalizeWhatsAppNumber(contact.phone);
                    return (
                      <label
                        key={contact.id}
                        className={`flex items-start gap-3 rounded-xl border p-3 ${
                          selectedContactId === contact.id
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : "border-[var(--border)]"
                        } ${validPhone ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                      >
                        <input
                          type="radio"
                          name="critical-report-whatsapp-contact"
                          checked={selectedContactId === contact.id}
                          disabled={!validPhone}
                          onChange={() => setSelectedContactId(contact.id)}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <span>
                          <span className="block text-sm font-medium">{contact.name}</span>
                          <span className="block text-xs text-[var(--ink-muted)]">
                            {contact.relation}
                            {contact.phone ? ` · ${contact.phone}` : " · No phone number saved"}
                          </span>
                          {!validPhone && contact.phone && (
                            <span className="block text-xs text-amber-700 dark:text-amber-200">
                              Invalid phone number
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
                {whatsappContacts.length === 0 && (
                  <p className="mt-3 rounded-lg border border-dashed border-[var(--border)] p-3 text-xs text-[var(--ink-muted)]">
                    No saved contact has phone alerts enabled for a WhatsApp draft.
                  </p>
                )}

                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                    Message preview
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-xs leading-relaxed">
                    {message}
                  </pre>
                </div>
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    <Send className="h-4 w-4" />
                    Open WhatsApp draft
                  </a>
                ) : (
                  <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-100" role="alert">
                    Select a saved contact with Phone alerts enabled and a valid phone number to continue.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

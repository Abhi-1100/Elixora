"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { googleLogin } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
        };
      };
    };
  }
}

const GSI_SCRIPT = "https://accounts.google.com/gsi/client";
const LAST_LOGIN_METHOD_KEY = "mg_last_login_method";

type GoogleLoginButtonProps = {
  onError?: (message: string) => void;
};

export function GoogleLoginButton({ onError }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { saveSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [wasLastUsed, setWasLastUsed] = useState(false);

  useEffect(() => {
    setWasLastUsed(localStorage.getItem(LAST_LOGIN_METHOD_KEY) === "google");
  }, []);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError?.("Google sign-in is not configured. Check NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
      return;
    }

    const renderGoogleButton = () => {
      if (!window.google || !buttonRef.current) return;
      buttonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setIsLoading(true);
          onError?.("");
          try {
            const data = await googleLogin(credential);
            localStorage.setItem(LAST_LOGIN_METHOD_KEY, "google");
            setWasLastUsed(true);
            saveSession(data.access_token, data.user);
            router.push(data.user.profile_complete ? "/chat" : "/complete-profile");
          } catch (error) {
            onError?.(error instanceof Error ? error.message : "Google sign-in failed. Please try again.");
          } finally {
            setIsLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 360,
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SCRIPT}"]`);
    if (existingScript) {
      if (window.google) renderGoogleButton();
      else existingScript.addEventListener("load", renderGoogleButton, { once: true });
      return () => existingScript.removeEventListener("load", renderGoogleButton);
    }

    const script = document.createElement("script");
    script.src = GSI_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => onError?.("Unable to load Google sign-in. Please try again.");
    document.head.appendChild(script);
  }, [onError, router, saveSession]);

  return (
    <div className="relative h-12 w-full">
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-[var(--ink)] transition-all duration-200 hover:bg-white/[0.08]"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M21.35 12.23c0-.74-.07-1.45-.21-2.13H12v4.03h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.29Z" />
          <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.75Z" />
          <path fill="#FBBC05" d="M6.53 13.83a5.86 5.86 0 0 1 0-3.66V7.64H3.29a9.75 9.75 0 0 0 0 8.72l3.24-2.53Z" />
          <path fill="#EA4335" d="M12 6.14c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.22 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.71 5.39l3.24 2.53C7.3 7.86 9.46 6.14 12 6.14Z" />
        </svg>
        <span>Continue with Google</span>
      </div>
      <div ref={buttonRef} aria-label="Continue with Google" className="absolute inset-0 z-10 overflow-hidden opacity-0" />
      {wasLastUsed && (
        <span className="absolute -right-1 -top-2 z-20 rounded-full border border-[var(--accent)]/30 bg-[#0A0E1A] px-2 py-0.5 text-[9px] font-semibold tracking-wide text-[var(--accent)] shadow-sm">
          Last used
        </span>
      )}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-full bg-[#0A0E1A]/80 text-xs font-semibold text-[var(--ink)] backdrop-blur-sm">
          Signing you in…
        </div>
      )}
    </div>
  );
}

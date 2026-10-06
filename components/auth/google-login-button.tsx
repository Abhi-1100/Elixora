"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
          prompt?: () => void;
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

// Track global initialization to prevent GSI re-initialization warnings across StrictMode remounts
let isGsiInitialized = false;

export function GoogleLoginButton({ onError }: GoogleLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { saveSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [wasLastUsed, setWasLastUsed] = useState(false);

  useEffect(() => {
    setWasLastUsed(localStorage.getItem(LAST_LOGIN_METHOD_KEY) === "google");
  }, []);

  const handleCredentialResponse = useCallback(
    async ({ credential }: { credential: string }) => {
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
    [onError, router, saveSession]
  );

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError?.("Google sign-in is not configured. Check NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
      return;
    }

    const renderGoogleButton = () => {
      if (!window.google || !buttonRef.current) return;

      const containerWidth = containerRef.current?.offsetWidth || 360;
      // Google standard button requires width between 200 and 400
      const targetWidth = Math.max(200, Math.min(400, containerWidth));

      buttonRef.current.replaceChildren();

      if (!isGsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
        isGsiInitialized = true;
      }

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: targetWidth,
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SCRIPT}"]`);
    if (existingScript) {
      if (window.google) {
        renderGoogleButton();
      } else {
        existingScript.addEventListener("load", renderGoogleButton, { once: true });
      }
      return () => {
        existingScript.removeEventListener("load", renderGoogleButton);
      };
    }

    const script = document.createElement("script");
    script.src = GSI_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => {
      onError?.(
        "Unable to load Google sign-in. If you have an ad-blocker or Brave Shields active, please disable it for localhost."
      );
    };
    document.head.appendChild(script);
  }, [handleCredentialResponse, onError]);

  const handleManualClick = () => {
    if (!window.google) {
      onError?.(
        "Google Sign-In is blocked or hasn't loaded. If you are using Brave Shields or an ad-blocker (uBlock Origin), please allow scripts for this site."
      );
      return;
    }
    // Attempt prompt as fallback if popup blocker suppressed iframe click
    try {
      window.google.accounts.id.prompt?.();
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleManualClick}
      className="relative h-12 w-full cursor-pointer select-none"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-[var(--ink)] transition-all duration-200 hover:bg-white/[0.08]"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M21.35 12.23c0-.74-.07-1.45-.21-2.13H12v4.03h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.29Z" />
          <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.75Z" />
          <path fill="#FBBC05" d="M6.53 13.83a5.86 5.86 0 0 1 0-3.66V7.64H3.29a9.75 9.75 0 0 0 0 8.72l3.24-2.53Z" />
          <path fill="#EA4335" d="M12 6.14c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.22 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.71 5.39l3.24 2.53C7.3 7.86 9.46 6.14 12 6.14Z" />
        </svg>
        <span className="truncate">Continue with Google</span>
      </div>
      <div
        ref={buttonRef}
        aria-label="Continue with Google"
        className="absolute inset-0 z-10 overflow-hidden opacity-[0.001] cursor-pointer flex items-center justify-center [&>div]:!w-full [&>div]:!h-full [&>div]:!flex [&>div]:!items-center [&>div]:!justify-center [&_iframe]:!h-full [&_iframe]:!min-w-full"
      />
      {wasLastUsed && (
        <span className="absolute -right-1 -top-2 z-20 rounded-full border border-[var(--accent)]/30 bg-[#0A0E1A] px-2 py-0.5 text-[9px] font-semibold tracking-wide text-[var(--accent)] shadow-sm pointer-events-none">
          Last used
        </span>
      )}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-full bg-[#0A0E1A]/80 text-xs font-semibold text-[var(--ink)] backdrop-blur-sm pointer-events-none">
          Signing you in…
        </div>
      )}
    </div>
  );
}

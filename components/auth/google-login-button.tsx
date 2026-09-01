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

type GoogleLoginButtonProps = {
  onError?: (message: string) => void;
};

export function GoogleLoginButton({ onError }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { saveSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

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
            saveSession(data.access_token, data.user);
            router.push(data.user.profile_complete ? "/dashboard" : "/complete-profile");
          } catch (error) {
            onError?.(error instanceof Error ? error.message : "Google sign-in failed. Please try again.");
          } finally {
            setIsLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
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
    <div className="relative flex min-h-10 justify-center">
      <div ref={buttonRef} aria-label="Continue with Google" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 text-xs font-semibold text-[#0B3D3A]">
          Signing you in…
        </div>
      )}
    </div>
  );
}

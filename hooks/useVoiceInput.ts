"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionResult = {
  results: ArrayLike<ArrayLike<{ transcript: string; isFinal: boolean }>>;
  resultIndex: number;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResult) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
export type VoiceLanguage = "auto" | "en" | "hi" | "gu";

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getRecognitionLocale(language: VoiceLanguage) {
  if (language === "hi") return "hi-IN";
  if (language === "gu") return "gu-IN";
  if (language === "en") return "en-IN";

  if (typeof navigator !== "undefined") {
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith("hi")) return "hi-IN";
    if (browserLanguage.startsWith("gu")) return "gu-IN";
  }
  return "en-IN";
}

export function useVoiceInput(
  onResult: (transcript: string) => void,
  onInterim?: (transcript: string) => void,
) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  const finishRef = useRef<((transcript: string | null) => void) | null>(null);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onInterimRef.current = onInterim;
  }, [onInterim]);

  const startListening = useCallback((
    language: VoiceLanguage = "auto",
    signal?: AbortSignal,
    onInterimCallback?: (text: string) => void,
  ): Promise<string> => {
    if (recognitionRef.current) return Promise.resolve("");

    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        setError("Voice input is not available outside the browser.");
        resolve("");
        return;
      }
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        setError("Voice input is not supported in this browser. Try Chrome or Edge.");
        resolve("");
        return;
      }

      setError(null);
      setInterimTranscript("");
      let settled = false;
      let latestSpoken = "";
      const recognition = new Recognition();
      const finish = (transcript: string | null) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", abortRecognition);
        if (recognitionRef.current === recognition) recognitionRef.current = null;
        if (finishRef.current === finish) finishRef.current = null;
        setIsListening(false);
        setInterimTranscript("");
        const committed = (transcript ?? latestSpoken).trim();
        if (committed) onResultRef.current(committed);
        resolve(committed);
      };
      const abortRecognition = () => {
        try {
          recognition.stop();
        } catch { }
        finish(latestSpoken || null);
      };

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = getRecognitionLocale(language);
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const finalParts: string[] = [];
        const interimParts: string[] = [];
        for (let index = 0; index < event.results.length; index += 1) {
          const result = event.results[index];
          const text = result?.[0]?.transcript?.trim();
          if (!text) continue;
          (result[0].isFinal ? finalParts : interimParts).push(text);
        }
        const interim = interimParts.join(" ");
        const finalTranscript = finalParts.join(" ").trim();
        const activeText = finalTranscript || interim;
        if (activeText) {
          latestSpoken = activeText;
        }
        setInterimTranscript(interim);
        onInterimRef.current?.(interim);
        onInterimCallback?.(activeText);
        if (finalTranscript) {
          try {
            recognition.stop();
          } catch { }
          finish(finalTranscript);
        }
      };
      recognition.onerror = (event) => {
        if (event.error !== "aborted") {
          setError(event.error === "not-allowed"
            ? "Microphone permission was denied."
            : "I couldn't hear that. Please try again.");
        }
        finish(latestSpoken || null);
      };
      recognition.onend = () => finish(latestSpoken || null);
      recognitionRef.current = recognition;
      finishRef.current = finish;
      signal?.addEventListener("abort", abortRecognition, { once: true });

      if (signal?.aborted) {
        finish(null);
        return;
      }

      try {
        recognition.start();
      } catch {
        setError("Voice input could not be started. Please try again.");
        finish(null);
      }
    });
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    finishRef.current?.(null);
  }, []);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    finishRef.current?.(null);
  }, []);

  return { isListening, interimTranscript, error, startListening, stopListening };
}

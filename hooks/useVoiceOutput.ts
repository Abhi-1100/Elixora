"use client";

import { useCallback, useEffect, useState } from "react";
import type { VoiceLanguage } from "@/hooks/useVoiceInput";

export function useVoiceOutput() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, language: VoiceLanguage = "auto") => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const detectedLanguage = language === "auto"
      ? /[\u0a80-\u0aff]/.test(text)
        ? "gu"
        : /[\u0900-\u097f]/.test(text)
          ? "hi"
          : "en"
      : language;
    const locale = detectedLanguage === "hi"
      ? "hi-IN"
      : detectedLanguage === "gu"
        ? "gu-IN"
        : "en-IN";
    utterance.lang = locale;
    utterance.voice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2))) ?? null;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => () => stopSpeaking(), [stopSpeaking]);

  return { isSpeaking, speak, stopSpeaking };
}

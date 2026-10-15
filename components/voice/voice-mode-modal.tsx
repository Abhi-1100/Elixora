"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, X, Volume2 } from "lucide-react";
import { ParticleOrbCanvas } from "@/components/landing/particle-orb-canvas";
import { GradientWaves } from "@/components/ui/gradient-waves";
import type { VoiceLanguage } from "@/hooks/useVoiceInput";
import { useAuth } from "@/context/AuthContext";

type VoiceChatReply = {
  text: string;
  summary?: string;
  intent?: string;
  lang?: string;
  sections?: { heading?: string; items: (string | { name: string; confidence?: number })[] }[];
  follow_up?: string;
  disclaimer?: string;
  englishTranslation?: string;
  translationStatus?: string;
};
type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "error";
type RecognitionAlternative = { transcript: string; confidence?: number };
type RecognitionResult = ArrayLike<RecognitionAlternative> & { isFinal: boolean };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionError = { error: string };
type ContinuousRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionError) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => ContinuousRecognition;

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: VoiceLanguage;
  onLanguageChange: (language: VoiceLanguage) => void;
  onSendTranscript: (transcript: string, translateToEnglish: boolean) => Promise<string | VoiceChatReply | null | undefined> | string | VoiceChatReply | null | undefined;
}

function recognitionLocale(language: VoiceLanguage) {
  if (language === "hi") return "hi-IN";
  if (language === "gu") return "gu-IN";
  if (language === "en") return "en-IN";
  const browserLanguage = typeof navigator === "undefined" ? "en-US" : navigator.language;
  if (browserLanguage.toLowerCase().startsWith("hi")) return "hi-IN";
  if (browserLanguage.toLowerCase().startsWith("gu")) return "gu-IN";
  return browserLanguage || "en-US";
}

function cleanForSpeech(text: string) {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~`>#]/g, "")
    .replace(/^\s*[-•]\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  const seen = new Set<string>();
  return cleaned.split(/(?<=[.!?।])\s+/u).filter((sentence) => {
    const key = normalizedSpeech(sentence);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join(" ");
}

function splitSpeechIntoChunks(text: string, maxLength = 240) {
  const sentences = text.split(/(?<=[.!?।])\s+/u).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (sentence.length <= maxLength) {
      const combined = current ? `${current} ${sentence}` : sentence;
      if (combined.length <= maxLength) current = combined;
      else {
        if (current) chunks.push(current);
        current = sentence;
      }
      continue;
    }
    if (current) { chunks.push(current); current = ""; }
    let fragment = "";
    for (const word of sentence.split(/\s+/)) {
      const combined = fragment ? `${fragment} ${word}` : word;
      if (combined.length > maxLength && fragment) {
        chunks.push(fragment);
        fragment = word;
      } else fragment = combined;
    }
    if (fragment) current = fragment;
  }
  if (current) chunks.push(current);
  return chunks;
}

function normalizedSpeech(text: string) {
  return text.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function isLikelyEcho(text: string, assistantText: string) {
  const candidate = normalizedSpeech(text);
  const answer = normalizedSpeech(assistantText);
  if (candidate.length < 4 || !answer) return false;
  if (answer.includes(candidate)) return true;
  // Web Speech often splits playback into slightly different chunks. Treat a
  // short phrase made mostly of words in the current reply as speaker echo.
  const candidateWords = candidate.split(" ").filter(Boolean);
  const answerWords = new Set(answer.split(" ").filter(Boolean));
  if (candidateWords.length > 1 && candidateWords.length <= 12) {
    const matching = candidateWords.filter((word) => answerWords.has(word)).length;
    return matching / candidateWords.length >= 0.8;
  }
  return false;
}

function speechTextForReply(result: string | VoiceChatReply | null | undefined) {
  if (typeof result === "string") return result;
  if (!result) return "I couldn't prepare a response. Please try again.";
  if (result.intent === "unknown" && result.summary) return result.summary;
  const parts: string[] = [];
  if (result.summary) parts.push(result.summary);
  const sections = result.sections || [];
  for (const section of sections) {
    for (const item of section.items) parts.push(typeof item === "string" ? item : item.name);
  }
  if (result.follow_up) parts.push(result.follow_up);
  // The chat panel still shows Elixora's medical disclaimer. Spoken replies
  // keep the conversation natural and avoid repeating generic boilerplate.
  return parts.join(" ") || result.text || "I couldn't prepare a response. Please try again.";
}

export function VoiceModeModal({ isOpen, onClose, language, onLanguageChange, onSendTranscript }: VoiceModeModalProps) {
  const { user } = useAuth();
  const [state, setState] = useState<VoiceState>("idle");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [preferredVoiceURI, setPreferredVoiceURI] = useState("");
  const languageRef = useRef(language);
  const recognitionRef = useRef<ContinuousRecognition | null>(null);
  const recognitionConstructorRef = useRef<RecognitionConstructor | null>(null);
  const startRecognitionRef = useRef<() => void>(() => undefined);
  const echoGraceTimerRef = useRef<number | null>(null);
  const speechSessionRef = useRef(0);
  const restartAfterLanguageChangeRef = useRef(false);
  const activeRef = useRef(false);
  const mutedRef = useRef(false);
  const callbackRef = useRef(onSendTranscript);
  const assistantTextRef = useRef("");
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakingRef = useRef(false);
  const interruptedRef = useRef(false);
  const processingRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const lastTranscriptRef = useRef({ text: "", at: 0 });

  useEffect(() => { callbackRef.current = onSendTranscript; }, [onSendTranscript]);
  useEffect(() => { languageRef.current = language; }, [language]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const refreshVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    try {
      const saved = JSON.parse(localStorage.getItem("elixora_settings") || "{}");
      setPreferredVoiceURI(typeof saved.voiceName === "string" ? saved.voiceName : "");
    } catch { setPreferredVoiceURI(""); }
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
  }, [isOpen]);

  const stopSpeech = useCallback((preserveEchoTranscript = false) => {
    speechSessionRef.current += 1;
    speechRef.current = null;
    speakingRef.current = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    if (echoGraceTimerRef.current !== null) window.clearTimeout(echoGraceTimerRef.current);
    echoGraceTimerRef.current = preserveEchoTranscript
      ? null
      : window.setTimeout(() => { assistantTextRef.current = ""; }, 1500);
  }, []);

  const chooseGentleVoice = useCallback((voices: SpeechSynthesisVoice[], locale: string) => {
    const matching = voices.filter((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2)));
    const preferred = matching.find((voice) => voice.voiceURI === preferredVoiceURI);
    if (preferred) return preferred;
    const naturalHints = /natural|enhanced|premium|neural|samantha|ava|allison|karen|susan|zira|aria|jenny|female/i;
    return matching.find((voice) => naturalHints.test(`${voice.name} ${voice.voiceURI}`))
      ?? matching.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
      ?? matching.find((voice) => voice.default)
      ?? matching[0]
      ?? null;
  }, [preferredVoiceURI]);

  const speakReply = useCallback((text: string, lang = "en") => {
    const spoken = cleanForSpeech(text);
    if (!spoken || typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setState("listening");
      return;
    }
    stopSpeech(true);
    const chunks = splitSpeechIntoChunks(spoken);
    const session = ++speechSessionRef.current;
    const detectedLanguage = lang === "auto"
      ? /[\u0a80-\u0aff]/.test(spoken) ? "gu" : /[\u0900-\u097f]/.test(spoken) ? "hi" : "en"
      : lang;
    const locale = detectedLanguage === "hi" ? "hi-IN" : detectedLanguage === "gu" ? "gu-IN" : "en-IN";
    const voices = availableVoices.length ? availableVoices : window.speechSynthesis.getVoices();
    const voice = chooseGentleVoice(voices, locale);
    let rate = 0.88;
    try {
      const settings = JSON.parse(localStorage.getItem("elixora_settings") || "{}");
      if (settings.voiceSpeed === "0.8x Slower") rate = 0.8;
      else if (settings.voiceSpeed === "1.2x Faster") rate = 0.95;
      else if (settings.voiceSpeed === "1.5x Rapid") rate = 1;
    } catch { /* Use the steady default speaking rate. */ }
    speakingRef.current = true;
    setState("speaking");
    const speakChunk = (index: number) => {
      if (session !== speechSessionRef.current || !activeRef.current || mutedRef.current) return;
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = locale;
      utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = 1.04;
      utterance.volume = 0.9;
      utterance.onstart = () => {
        if (session === speechSessionRef.current && speechRef.current === utterance) setState("speaking");
      };
      utterance.onend = () => {
        if (session !== speechSessionRef.current || speechRef.current !== utterance) return;
        speechRef.current = null;
        if (index + 1 < chunks.length) {
          window.setTimeout(() => speakChunk(index + 1), 80);
          return;
        }
        speakingRef.current = false;
        if (echoGraceTimerRef.current !== null) window.clearTimeout(echoGraceTimerRef.current);
        echoGraceTimerRef.current = window.setTimeout(() => { assistantTextRef.current = ""; }, 1500);
        if (activeRef.current) setState("listening");
      };
      utterance.onerror = (event) => {
        if (session !== speechSessionRef.current || speechRef.current !== utterance) return;
        speechRef.current = null;
        speakingRef.current = false;
        if (echoGraceTimerRef.current !== null) window.clearTimeout(echoGraceTimerRef.current);
        echoGraceTimerRef.current = window.setTimeout(() => { assistantTextRef.current = ""; }, 1500);
        if (activeRef.current) {
          setError(`Spoken playback stopped (${event.error}). The reply is shown on screen; continue speaking when ready.`);
          setState("listening");
        }
      };
      speechRef.current = utterance;
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        speechRef.current = null;
        speakingRef.current = false;
        if (activeRef.current) {
          setError("Spoken playback could not start in this browser. The reply is shown on screen; continue speaking when ready.");
          setState("listening");
        }
      }
    };
    speakChunk(0);
  }, [availableVoices, chooseGentleVoice, stopSpeech]);

  const processQueue = useCallback(async () => {
    if (processingRef.current || !activeRef.current) return;
    processingRef.current = true;
    while (queueRef.current.length > 0 && activeRef.current) {
      const text = queueRef.current.shift();
      if (!text) continue;
      setTranscript(text);
      setInterim("");
      setReply("");
      setError("");
      setState("thinking");
      try {
        const result = await callbackRef.current(text, true);
        if (!activeRef.current) break;
        const firstName = user?.name?.trim().split(/\s+/)[0];
        const responseLanguage = typeof result === "object" && result?.lang ? result.lang : languageRef.current;
        const isGreeting = typeof result === "object" && result?.intent === "greeting";
        const personalizedGreeting = isGreeting
          ? responseLanguage === "hi" ? `नमस्ते${firstName ? ` ${firstName}` : ""}, मैं आपकी कैसे मदद कर सकता हूँ?`
            : responseLanguage === "gu" ? `નમસ્તે${firstName ? ` ${firstName}` : ""}, હું તમારી કેવી રીતે મદદ કરી શકું?`
              : `Hello${firstName ? ` ${firstName}` : ""}, how can I help you?`
          : "";
        const answer = personalizedGreeting || speechTextForReply(result);
        assistantTextRef.current = cleanForSpeech(answer);
        setReply(answer);
        if (queueRef.current.length === 0) {
          const detectedLanguage = typeof result === "object" && result?.lang ? result.lang : languageRef.current;
          speakReply(answer, detectedLanguage);
        }
      } catch (cause) {
        if (activeRef.current) {
          setError(cause instanceof Error ? cause.message : "The response could not be prepared. Please try again.");
          setState("error");
        }
      }
    }
    processingRef.current = false;
    if (activeRef.current && queueRef.current.length === 0 && !speakingRef.current) setState("listening");
  }, [speakReply, user?.name]);

  const submitTranscript = useCallback((rawText: string) => {
    const text = rawText.trim();
    const now = Date.now();
    if (!text || !activeRef.current) return;
    const normalized = normalizedSpeech(text);
    if (normalized === lastTranscriptRef.current.text && now - lastTranscriptRef.current.at < 3000) return;
    lastTranscriptRef.current = { text: normalized, at: now };
    if (isLikelyEcho(text, assistantTextRef.current)) return;
    interruptedRef.current = false;
    if (speakingRef.current) {
      stopSpeech();
      setState("listening");
    }
    queueRef.current.push(text);
    void processQueue();
  }, [processQueue, stopSpeech]);

  const startRecognition = useCallback(() => {
    if (!activeRef.current || mutedRef.current || recognitionRef.current || !recognitionConstructorRef.current) return;
    try {
      const recognition = new recognitionConstructorRef.current();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognition.lang = recognitionLocale(languageRef.current);
      recognition.onstart = () => {
        if (!activeRef.current) return;
        if (processingRef.current) setState("thinking");
        else if (speakingRef.current) setState("speaking");
        else setState("listening");
      };
      recognition.onresult = (event) => {
        let partial = "";
        const committed: string[] = [];
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const alternatives = Array.from({ length: result.length }, (_, alternativeIndex) => result[alternativeIndex])
            .filter((alternative) => alternative?.transcript?.trim());
          const bestAlternative = alternatives.reduce<RecognitionAlternative | undefined>((best, alternative) => {
            if (!best) return alternative;
            return (alternative.confidence ?? -1) > (best.confidence ?? -1) ? alternative : best;
          }, undefined);
          const text = bestAlternative?.transcript?.trim();
          if (!text) continue;
          if (result.isFinal) committed.push(text);
          else partial += `${partial ? " " : ""}${text}`;
        }
        if (partial) {
          setInterim(partial);
          if (speakingRef.current && !isLikelyEcho(partial, assistantTextRef.current)) {
            interruptedRef.current = true;
            stopSpeech();
            setState("listening");
          }
        }
        for (const text of committed) submitTranscript(text);
      };
      recognition.onerror = (event) => {
        if (!activeRef.current || event.error === "aborted" || event.error === "no-speech") return;
        const messages: Record<string, string> = {
          "not-allowed": "Microphone permission was denied. Allow microphone access in your browser settings, then try again.",
          "service-not-allowed": "This browser's speech recognition service is unavailable. Try Chrome or Edge, or use typed chat.",
          "audio-capture": "No microphone was found. Connect or enable a microphone and try again.",
          network: "Browser speech recognition needs a working network connection. Check your connection and retry.",
        };
        activeRef.current = false;
        setError(messages[event.error] || "Browser speech recognition stopped unexpectedly. Try restarting Voice Mode.");
        setState("error");
      };
      recognition.onend = () => {
        if (recognitionRef.current === recognition) recognitionRef.current = null;
        if (!activeRef.current || mutedRef.current) return;
        if (restartAfterLanguageChangeRef.current) {
          restartAfterLanguageChangeRef.current = false;
          startRecognitionRef.current();
          return;
        }
        setError("Speech recognition paused. Tap Try again to resume the conversation.");
        setState("error");
      };
      recognitionRef.current = recognition;
      recognition.start();
      setError("");
    } catch (cause) {
      recognitionRef.current = null;
      const message = cause instanceof Error && /not.?allowed|denied/i.test(cause.message)
        ? "Microphone permission was denied. Allow microphone access in your browser settings, then try again."
        : "Voice recognition could not start. Check microphone access and try again.";
      setError(message);
      setState("error");
    }
  }, [stopSpeech, submitTranscript]);

  useEffect(() => { startRecognitionRef.current = startRecognition; }, [startRecognition]);

  const stopCall = useCallback(() => {
    activeRef.current = false;
    if (echoGraceTimerRef.current !== null) window.clearTimeout(echoGraceTimerRef.current);
    echoGraceTimerRef.current = null;
    restartAfterLanguageChangeRef.current = false;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      try { recognition.abort(); } catch { /* Browser may already have ended recognition. */ }
    }
    stopSpeech();
    queueRef.current = [];
    processingRef.current = false;
    interruptedRef.current = false;
    assistantTextRef.current = "";
    setInterim("");
    setMuted(false);
    mutedRef.current = false;
  }, [stopSpeech]);

  const startCall = useCallback(() => {
    if (typeof window === "undefined") return;
    stopCall();
    const NativeRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!NativeRecognition) {
      setError("Speech recognition is not supported in this browser. Try Chrome or Edge, or continue with typed chat.");
      setState("error");
      return;
    }
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setError("This browser cannot speak replies. Try a browser with speech synthesis, or continue with typed chat.");
      setState("error");
      return;
    }
    activeRef.current = true;
    recognitionConstructorRef.current = NativeRecognition as unknown as RecognitionConstructor;
    setTranscript("");
    setReply("");
    setError("");
    setState("listening");
    startRecognitionRef.current();
  }, [stopCall]);

  useEffect(() => {
    if (!isOpen) return;
    return () => stopCall();
  }, [isOpen, stopCall]);

  useEffect(() => {
    if (!activeRef.current || mutedRef.current) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;
    restartAfterLanguageChangeRef.current = true;
    recognition.stop();
  }, [language]);

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) {
      recognitionRef.current?.stop();
      if (!speakingRef.current) setState("listening");
      return;
    }
    startRecognitionRef.current();
  };

  const endCall = () => { stopCall(); setState("idle"); onClose(); };
  if (!isOpen) return null;

  const status = state === "idle" ? "Ready when you are"
    : state === "thinking" ? "Preparing a safe response…"
      : state === "speaking" ? "Elixora is speaking · speak to interrupt"
        : state === "error" ? "Voice mode needs attention"
          : muted ? "Microphone muted" : "Listening · speak naturally";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex flex-col items-center justify-between overflow-hidden bg-[#030611] p-5 text-white sm:p-8">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-70"><GradientWaves horizonColor="#96beff" waveColor="#96beff" crestColor="#ffffff" speed={0.3} amplitude={1.55} waveScale={0.8} waveRatio={0.55} swell={35} turbulence={23.5} tilt={1.11} zoom={0.75} height={3.1} fogDepth={15} detail="medium" brightness={0.95} opacity={1} mouseInteraction={false} parallaxStrength={0} grain grainIntensity={0.05} /></div>
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-blue-600/25 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="relative z-10 flex w-full max-w-5xl justify-between">
          <div><p className="text-sm font-medium tracking-wide text-white/90">ELIXORA · VOICE MODE</p><p className="mt-1 text-xs text-white/55">Health information, with clinician-first safety</p></div>
          <button onClick={endCall} aria-label="Close Voice Mode" className="rounded-full border border-white/15 bg-white/10 p-2.5 text-white/80 hover:bg-white/20"><X className="h-5 w-5" /></button>
        </div>
        <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-5 text-center">
          <h1 className="text-3xl font-medium tracking-tight text-zinc-200 sm:text-5xl">How can I help you today?</h1>
          <p className="flex items-center gap-2 text-sm text-cyan-100/80"><span className={`h-2 w-2 rounded-full ${state === "error" ? "bg-rose-400" : state === "speaking" ? "bg-cyan-300" : "bg-emerald-400 animate-pulse"}`} />{status}</p>
          <div className="relative flex h-[260px] w-full max-w-sm items-center justify-center sm:h-[320px]">
            <ParticleOrbCanvas size={300} isListening={state === "listening" && !muted} onMicClick={state === "idle" || state === "error" ? startCall : toggleMute} />
            <div className="pointer-events-none absolute bottom-2 flex h-10 items-center justify-center gap-1.5" aria-label={state === "speaking" ? "Speaking waveform" : "Listening waveform"}>
              {Array.from({ length: 25 }, (_, index) => <motion.span key={index} className="w-1 rounded-full bg-cyan-200/90" animate={{ height: state === "listening" && !muted ? [5, 8 + ((index * 7) % 18), 6] : state === "speaking" ? [6, 10 + ((index * 11) % 25), 5] : 3, opacity: state === "error" ? 0.35 : 1 }} transition={{ duration: 0.45 + (index % 4) * 0.08, repeat: state === "listening" || state === "speaking" ? Infinity : 0, delay: index * 0.015 }} />)}
            </div>
          </div>
          <div aria-live="polite" className="min-h-20 w-full max-w-2xl space-y-2 px-2">
            {(interim || transcript) && <p className="text-sm leading-relaxed text-cyan-100/75">You: {interim || transcript}</p>}
            {reply && <p className="line-clamp-5 text-left text-base leading-relaxed text-white/90"><span className="mr-1.5 font-semibold text-cyan-100">Elixora:</span>{reply}</p>}
            {error && <div className="mx-auto max-w-xl rounded-xl border border-rose-300/25 bg-rose-950/50 px-4 py-3 text-sm text-rose-100">{error}</div>}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/65">
            <label className="flex items-center gap-2">Speech language <select value={language} onChange={(event) => { const value = event.currentTarget.value; if (value === "auto" || value === "en" || value === "hi" || value === "gu") onLanguageChange(value); }} className="rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1.5 text-white"><option value="auto">Use browser language</option><option value="en">English</option><option value="hi">हिन्दी</option><option value="gu">ગુજરાતી</option></select></label>
            <label className="flex items-center gap-2">Spoken voice <select value={preferredVoiceURI} onChange={(event) => {
              const value = event.currentTarget.value;
              setPreferredVoiceURI(value);
              try {
                const saved = JSON.parse(localStorage.getItem("elixora_settings") || "{}");
                localStorage.setItem("elixora_settings", JSON.stringify({ ...saved, voiceName: value }));
              } catch { /* Voice selection remains active for this call. */ }
            }} disabled={availableVoices.length === 0} className="max-w-[230px] rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1.5 text-white disabled:opacity-50">
              <option value="">Gentle automatic (match reply language)</option>
              {availableVoices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}
            </select></label>
          </div>
          <p className="max-w-lg text-[11px] leading-relaxed text-white/45">Uses your browser’s speech recognition and installed speech voices. Gentle automatic playback prefers natural-sounding voices in the reply language when your device provides one. Voice quality depends on your browser and system. Automatic recognition follows your browser language; choose Hindi or Gujarati for better recognition when needed. Recognized text is sent through Elixora’s existing medical chat service. This is not a diagnosis or emergency service.</p>
        </main>
        <div className="relative z-10 flex items-center gap-5 pb-2">
          {(state === "idle" || state === "error") ? <button type="button" onClick={startCall} aria-label={state === "error" ? "Restart voice call" : "Start voice call"} className="flex h-14 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 text-white transition hover:bg-white/20"><Mic className="h-5 w-5" />{state === "error" ? "Try again" : "Start call"}</button> : <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute microphone" : "Mute microphone"} className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20">{muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>}
          {state === "speaking" && <span className="flex items-center gap-2 text-xs text-cyan-100/75"><Volume2 className="h-4 w-4" />Interrupt by speaking</span>}
          <button type="button" onClick={endCall} aria-label="End voice call" className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500"><PhoneOff className="h-5 w-5" /></button>
        </div>
      </div>
    </AnimatePresence>
  );
}

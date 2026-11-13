"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaMicrophone, FaTimes, FaCheck, FaGlobe, FaRedo } from "react-icons/fa";
import { toast } from "react-toastify";

/**
 * GoogleVoiceModal - YouTube & Google Style Floating Voice Dictation Dialog
 * Streams recognized words in real-time with large animated soundwaves and 1-click apply.
 */
export default function GoogleVoiceModal({
  isOpen = false,
  onClose,
  onApply,
  title = "Voice Typing",
  fieldName = "Field",
  initialText = "",
  placeholder = "Bolna shuru karein (e.g. Ahluwalia Contracts, CTM 2000kN)...",
  defaultLang = "en-IN",
}) {
  const [lang, setLang] = useState(defaultLang);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialText);
  const [isFinalized, setIsFinalized] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Listening... Speak clearly");

  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTranscript(initialText || "");
      setIsFinalized(false);
      startVoiceSession(lang);
    } else {
      stopVoiceSession();
    }
    return () => {
      stopVoiceSession();
    };
  }, [isOpen, lang]);

  const stopVoiceSession = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startVoiceSession = (useLang = "en-IN") => {
    stopVoiceSession();

    if (typeof window === "undefined") return;
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      toast.warn("🎙️ Voice typing is supported in Google Chrome & Microsoft Edge.");
      setStatusMessage("Voice input not supported in this browser");
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.lang = useLang;
      recognition.interimResults = true;
      recognition.continuous = false; // Fast YouTube/Google low-latency streaming
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setIsFinalized(false);
        setStatusMessage(
          useLang.startsWith("hi")
            ? "सुन रहे हैं... बोलना शुरू करें"
            : "Listening... Speak now"
        );
      };

      recognition.onresult = (event) => {
        if (!event || !event.results) return;

        const liveText = Array.from(event.results)
          .map((res) => (res && res[0] ? res[0].transcript : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        const last = event.results[event.results.length - 1];
        const final = Boolean(last?.isFinal);

        if (liveText) {
          setTranscript(liveText);
          if (final) {
            setIsFinalized(true);
            setStatusMessage("✅ Complete! You can apply or speak again");
          } else {
            setStatusMessage("🎙️ Hearing you...");
          }
        }
      };

      recognition.onerror = (event) => {
        const err = event?.error || "unknown";
        if (err === "aborted") return;

        setIsListening(false);
        if (err === "not-allowed") {
          setStatusMessage("❌ Microphone Blocked! Browser me lock icon se allow karein");
          toast.error("Microphone Blocked! Browser URL bar ke paas 🔒 Lock icon se Allow karein.");
        } else if (err === "no-speech") {
          setStatusMessage("Koi aawaz nahi aayi. Mic button daba ke dobara bolein");
        } else {
          setStatusMessage(`Speech note: ${err}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start voice:", err);
      setIsListening(false);
      setStatusMessage("Mic start failed. Try again.");
    }
  };

  const handleApply = () => {
    const clean = (transcript || "").trim().replace(/[.,!?;]+$/, "");
    if (clean) {
      onApply?.(clean);
    }
    onClose?.();
  };

  const handleRestart = () => {
    setTranscript("");
    setIsFinalized(false);
    startVoiceSession(lang);
  };

  const toggleLanguage = () => {
    const nextLang = lang === "en-IN" ? "hi-IN" : "en-IN";
    setLang(nextLang);
    startVoiceSession(nextLang);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full flex flex-col items-center text-center border border-slate-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          title="Close voice dialog"
        >
          <FaTimes className="text-sm" />
        </button>

        {/* Google / YouTube 4-Color Accent Dots */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "450ms" }} />
        </div>

        {/* Header Title & Target Field */}
        <h3 className="text-base font-black text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 mt-1 mb-4">
          Dictating for: <span className="text-slate-900 font-extrabold">{fieldName}</span>
        </p>

        {/* Language Switcher Pill */}
        <div className="flex items-center gap-1 mb-5">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-xs cursor-pointer border bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
          >
            <FaGlobe className="text-blue-500 text-xs" />
            <span>{lang === "hi-IN" ? "🇮🇳 हिन्दी (Hindi)" : "🇮🇳 English (India)"}</span>
            <span className="text-[10px] text-blue-600 underline ml-1">Change</span>
          </button>
        </div>

        {/* Central Pulsating YouTube / Google Microphone Circle */}
        <div className="relative my-2 flex items-center justify-center">
          {/* Outer Ripple 1 */}
          {isListening && (
            <div className="absolute w-32 h-32 rounded-full bg-rose-500/20 animate-ping" />
          )}
          {/* Outer Ripple 2 */}
          {isListening && (
            <div className="absolute w-24 h-24 rounded-full bg-blue-500/20 animate-pulse" />
          )}

          {/* Core Mic Button */}
          <button
            type="button"
            onClick={isListening ? stopVoiceSession : handleRestart}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl shadow-xl transition transform active:scale-95 cursor-pointer ${
              isListening
                ? "bg-gradient-to-tr from-rose-600 to-red-500 ring-4 ring-rose-200 animate-pulse"
                : "bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 ring-4 ring-blue-100"
            }`}
            title={isListening ? "Listening... Tap to stop" : "Tap to speak again"}
          >
            <FaMicrophone />
          </button>
        </div>

        {/* Live Status Message */}
        <p className="text-xs font-semibold text-slate-500 mt-3 mb-2 flex items-center gap-1.5">
          {isListening && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
          {statusMessage}
        </p>

        {/* Live Real-Time Transcription Box */}
        <div className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[90px] flex items-center justify-center text-center">
          {transcript ? (
            <p className="text-base sm:text-lg font-black text-slate-900 leading-snug break-words">
              "{transcript}"
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {placeholder}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestart}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Clear and speak again"
          >
            <FaRedo className="text-[10px]" /> Re-Speak
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!transcript.trim()}
            className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <FaCheck /> Apply &amp; Fill
          </button>
        </div>
      </div>
    </div>
  );
}

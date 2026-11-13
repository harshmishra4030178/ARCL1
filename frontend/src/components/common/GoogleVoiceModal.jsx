"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaMicrophone,
  FaTimes,
  FaCheck,
  FaRedo,
  FaBuilding,
  FaTools,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

/**
 * GoogleVoiceModal - YouTube & Google Style Floating Voice Dictation Dialog
 * Features:
 * - 100% Native Web Speech API with full lifecycle events (audiostart, soundstart, speechstart, result)
 * - Zero audio-locking conflicts (no simultaneous getUserMedia)
 * - Real-time word-by-word streaming into display
 * - Bilingual tabs (English en-IN & Hindi hi-IN)
 * - 1-Tap Quick Select Chips for instant filling without waiting
 * - Live diagnostic indicator so user sees exactly what Chrome detects
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
  quickSuggestions = [],
}) {
  const [lang, setLang] = useState(defaultLang);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialText);
  const [isFinalized, setIsFinalized] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Microphone connecting...");
  const [soundDetected, setSoundDetected] = useState(false);
  const [speechDetected, setSpeechDetected] = useState(false);
  const [lastError, setLastError] = useState("");

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const sessionPrefixRef = useRef("");
  const lastRecognizedRef = useRef("");

  // Sync initial text when modal opens
  useEffect(() => {
    if (isOpen) {
      sessionPrefixRef.current = "";
      lastRecognizedRef.current = "";
      setTranscript(initialText || "");
      setIsFinalized(false);
      setLastError("");
      setSoundDetected(false);
      setSpeechDetected(false);
      startVoiceSession(lang);
    } else {
      stopVoiceSession();
    }
    return () => {
      stopVoiceSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const stopVoiceSession = useCallback(() => {
    isListeningRef.current = false;
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
    setSoundDetected(false);
    setSpeechDetected(false);
  }, []);

  const startVoiceSession = useCallback(
    (useLang = "en-IN") => {
      stopVoiceSession();

      if (typeof window === "undefined") return;
      const SpeechRec =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRec) {
        toast.warn("🎙️ Voice typing Google Chrome ya Edge me support hota hai.");
        setStatusMessage("Voice input is not supported in this browser");
        return;
      }

      try {
        const recognition = new SpeechRec();
        recognitionRef.current = recognition;
        recognition.lang = useLang;
        recognition.interimResults = true;
        recognition.continuous = true; // Continuous listening: never disconnects on pauses
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          isListeningRef.current = true;
          setIsListening(true);
          setIsFinalized(false);
          setLastError("");
          setStatusMessage(
            useLang.startsWith("hi")
              ? "🎙️ Mic On: हिन्दी में बोलना शुरू करें..."
              : "🎙️ Mic On: Speak clearly now..."
          );
        };

        recognition.onaudiostart = () => {
          setStatusMessage("🎙️ Mic Connected & Capturing Audio...");
        };

        recognition.onsoundstart = () => {
          setSoundDetected(true);
          setStatusMessage("🔊 Sound Detected! Aawaz aa rahi hai...");
        };

        recognition.onspeechstart = () => {
          setSpeechDetected(true);
          setStatusMessage("🗣️ Human Speech Detected! Transcribing words...");
        };

        recognition.onspeechend = () => {
          setStatusMessage("⏳ Speech paused. Listening for more...");
        };

        recognition.onsoundend = () => {
          // Sound pause in continuous session
        };

        recognition.onresult = (event) => {
          if (!event || !event.results) return;

          let fullLive = "";
          let finalFound = false;

          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            if (res && res[0]) {
              const chunk = (res[0].transcript || "").trim();
              if (chunk) {
                fullLive += (fullLive ? " " : "") + chunk;
              }
              if (res.isFinal) {
                finalFound = true;
              }
            }
          }

          const prefix = sessionPrefixRef.current ? sessionPrefixRef.current + " " : "";
          const cleaned = (prefix + fullLive).replace(/[.,!?;]+$/, "").trim();
          if (cleaned) {
            lastRecognizedRef.current = cleaned;
            setTranscript(cleaned);
            setSoundDetected(true);
            setSpeechDetected(true);
            if (finalFound) {
              setIsFinalized(true);
              setStatusMessage(`✅ Suna gaya: "${cleaned}"`);
            } else {
              setStatusMessage(`🎙️ Sun rahe hain: "${cleaned}"...`);
            }
          }
        };

        recognition.onnomatch = () => {
          setStatusMessage("⚠️ Shabd samajh nahi aaye. Thoda saaf ya mic ke paas se bolein.");
        };

        recognition.onerror = (event) => {
          const err = event?.error || "unknown";
          if (err === "aborted") return;

          setLastError(err);

          if (err === "no-speech") {
            // Normal pause in continuous mode, don't abort
            return;
          }

          if (err === "not-allowed" || err === "service-not-allowed") {
            isListeningRef.current = false;
            setIsListening(false);
            setStatusMessage("❌ Microphone Blocked! Browser me lock icon se allow karein");
            toast.error(
              "🎙️ Microphone Blocked! Chrome URL bar ke paas 🔒 Lock icon pe click karke 'Microphone: Allow' karein.",
              { autoClose: 7000 }
            );
          } else if (err === "network") {
            setStatusMessage("⚠️ Google Speech Network timeout / reconnecting...");
          } else if (err === "audio-capture") {
            setStatusMessage("❌ Koi microphone nahi mila. Check audio device.");
          } else {
            setStatusMessage(`Speech note: ${err}`);
          }
        };

        recognition.onend = () => {
          if (lastRecognizedRef.current) {
            sessionPrefixRef.current = lastRecognizedRef.current;
          }
          if (isListeningRef.current) {
            // Create a FRESH instance on restart to prevent InvalidStateError
            setTimeout(() => {
              if (isListeningRef.current) {
                startVoiceSession(useLang);
              }
            }, 150);
          } else {
            setIsListening(false);
          }
        };

        isListeningRef.current = true;
        recognition.start();
      } catch (err) {
        console.error("Failed to start voice recognition:", err);
        setIsListening(false);
        isListeningRef.current = false;
        setStatusMessage("Mic start failed. Check browser permissions.");
        setLastError(err.message || "Failed to start");
      }
    },
    [stopVoiceSession]
  );

  const handleApply = (customText = null) => {
    const textToApply = typeof customText === "string" ? customText : transcript;
    const clean = (textToApply || "").trim().replace(/[.,!?;]+$/, "");
    if (clean) {
      onApply?.(clean);
      toast.success(`✅ "${clean}" filled successfully!`, { autoClose: 2000 });
    }
    stopVoiceSession();
    onClose?.();
  };

  const handleRestart = () => {
    sessionPrefixRef.current = "";
    lastRecognizedRef.current = "";
    setTranscript("");
    setIsFinalized(false);
    startVoiceSession(lang);
  };

  const handleSelectLang = (selectedLang) => {
    setLang(selectedLang);
    startVoiceSession(selectedLang);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl p-5 sm:p-6 max-w-md w-full flex flex-col items-center text-center border border-slate-200 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition cursor-pointer"
          title="Close dialog"
        >
          <FaTimes className="text-base" />
        </button>

        {/* Google / YouTube 4-Color Accent Dots */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "450ms" }} />
        </div>

        {/* Header Title & Target Field */}
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-[11px] font-bold text-blue-700 bg-blue-50 px-3 py-0.5 rounded-full border border-blue-200 mt-1 mb-3">
          Target: <span className="text-slate-900 font-extrabold">{fieldName}</span>
        </p>

        {/* Bilingual Language Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 border border-slate-200">
          <button
            type="button"
            onClick={() => handleSelectLang("en-IN")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              lang === "en-IN"
                ? "bg-white text-blue-700 shadow-sm border border-blue-200 font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🇮🇳</span> English (India)
          </button>
          <button
            type="button"
            onClick={() => handleSelectLang("hi-IN")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              lang === "hi-IN"
                ? "bg-white text-rose-700 shadow-sm border border-rose-200 font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🇮🇳</span> हिन्दी (Hindi)
          </button>
        </div>

        {/* Central Pulsating YouTube / Google Microphone Circle */}
        <div className="relative my-2 flex items-center justify-center">
          {isListening && (
            <div className="absolute w-28 h-28 rounded-full bg-rose-500/20 animate-ping" />
          )}
          {isListening && soundDetected && (
            <div className="absolute w-36 h-36 rounded-full bg-emerald-500/25 animate-pulse" />
          )}

          {/* Core Mic Button */}
          <button
            type="button"
            onClick={isListening ? stopVoiceSession : handleRestart}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl shadow-xl transition transform active:scale-95 cursor-pointer ${
              isListening
                ? soundDetected
                  ? "bg-gradient-to-tr from-emerald-600 to-teal-500 ring-4 ring-emerald-200 animate-pulse"
                  : "bg-gradient-to-tr from-rose-600 to-red-500 ring-4 ring-rose-200 animate-pulse"
                : "bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 ring-4 ring-blue-100"
            }`}
            title={isListening ? "Listening... Tap to pause" : "Tap to speak"}
          >
            <FaMicrophone />
          </button>
        </div>

        {/* Live Status Diagnostics Badge */}
        <div className="flex items-center gap-1.5 my-1.5 px-3 py-1 rounded-full text-xs font-bold border transition bg-slate-50 border-slate-200 text-slate-700">
          {speechDetected ? (
            <span className="flex items-center gap-1 text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              🗣️ Speech Detected
            </span>
          ) : soundDetected ? (
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              🔊 Sound Detected
            </span>
          ) : isListening ? (
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              🎙️ Listening... Speak now
            </span>
          ) : (
            <span className="text-slate-500">Tap mic to speak</span>
          )}
        </div>

        <p className="text-[11px] font-medium text-slate-500 mb-2 truncate max-w-full">
          {statusMessage}
        </p>

        {/* Live Real-Time Editable Transcription Box */}
        <div className="w-full relative">
          <textarea
            rows={2}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={placeholder}
            className="w-full p-2.5 bg-slate-50 border-2 border-blue-200 focus:border-blue-500 rounded-xl text-center text-sm sm:text-base font-black text-slate-900 focus:outline-none resize-none transition shadow-inner placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal"
          />
          {isFinalized && transcript && (
            <div className="absolute right-2 bottom-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-0.5">
              <FaCheck className="text-[8px]" /> Captured
            </div>
          )}
        </div>

        {/* 1-Tap Quick Select Chips (Fastest Method: 1 Click Auto-Fills Everything) */}
        {Array.isArray(quickSuggestions) && quickSuggestions.length > 0 && (
          <div className="w-full mt-3 text-left">
            <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <FaInfoCircle className="text-blue-500 text-[10px]" /> Quick 1-Tap Select (No typing needed):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
              {quickSuggestions.slice(0, 6).map((item, idx) => {
                const label = item?.companyName || item?.name || (typeof item === "string" ? item : "");
                if (!label) return null;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApply(label)}
                    className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-[10px] font-bold text-slate-800 transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                    title={`Click to auto-fill: ${label}`}
                  >
                    {item?.companyName ? (
                      <FaBuilding className="text-blue-600 text-[9px] shrink-0" />
                    ) : (
                      <FaTools className="text-emerald-600 text-[9px] shrink-0" />
                    )}
                    <span className="truncate max-w-[170px]">{label}</span>
                    <span className="text-blue-600 ml-0.5">↵</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Helper Tip if no sound detected */}
        {isListening && !soundDetected && !transcript && (
          <div className="w-full mt-2.5 p-2.5 bg-amber-50 border border-amber-300 rounded-2xl text-[11px] text-amber-900 text-left flex items-start gap-2 shadow-xs">
            <FaExclamationTriangle className="text-amber-600 text-sm shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">Aawaz type nahi ho rahi?</div>
              <div className="text-[10px] text-amber-800 leading-relaxed">
                • <strong>Mic Volume:</strong> Windows Settings &gt; Sound &gt; Microphone volume 100% karein ya Mute switch check karein.<br />
                • <strong>Browser:</strong> Google Chrome ya Edge use karein (Brave browser me Google speech blocked rehti hai).<br />
                • <strong>Instant Solution:</strong> Upar ya neeche diye gaye Quick 1-Tap chips pe click karke 1 second me fill karein!
              </div>
            </div>
          </div>
        )}

        {/* Warning if error occurred */}
        {lastError && (
          <div className="w-full mt-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-800 flex items-start gap-1.5 text-left">
            <FaExclamationTriangle className="text-rose-500 shrink-0 mt-0.5" />
            <span>
              <strong>Notice:</strong> Browser speech notice: <code>{lastError}</code>. Agar Brave browser me hain to <code>brave://settings/system</code> me Google Speech ON karein ya Google Chrome use karein.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestart}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Clear and speak again"
          >
            <FaRedo className="text-[10px]" /> Re-Speak
          </button>

          <button
            type="button"
            onClick={() => handleApply()}
            disabled={!transcript.trim()}
            className="flex-[2] py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          >
            <FaCheck /> Apply &amp; Fill
          </button>
        </div>
      </div>
    </div>
  );
}

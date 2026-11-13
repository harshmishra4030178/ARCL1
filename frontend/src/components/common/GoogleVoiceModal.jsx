"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaMicrophone,
  FaTimes,
  FaCheck,
  FaRedo,
  FaVolumeUp,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";

/**
 * GoogleVoiceModal - YouTube & Google Style Floating Voice Dictation Dialog
 * Features:
 * - Real-time Audio Level VU Meter (detects if microphone is physically picking up sound)
 * - Pure continuous low-latency speech recognition (en-IN and hi-IN)
 * - Real-time word-by-word streaming into the display
 * - Editable fallback so users can refine words on the fly
 * - 1-Click Apply & Fill with smart client/item auto-matching
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
  const [statusMessage, setStatusMessage] = useState("Listening... Speak now");
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 volume meter

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameRef = useRef(null);

  // Sync initial text when modal opens
  useEffect(() => {
    if (isOpen) {
      setTranscript(initialText || "");
      setIsFinalized(false);
      startVoiceSession(lang);
      startAudioMeter();
    } else {
      stopVoiceSession();
      stopAudioMeter();
    }
    return () => {
      stopVoiceSession();
      stopAudioMeter();
    };
  }, [isOpen]);

  // Audio Level Meter (measures real physical sound from the microphone)
  const startAudioMeter = async () => {
    try {
      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia)
        return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const scaled = Math.min(100, Math.round((avg / 64) * 100));
        setAudioLevel(scaled);
        animFrameRef.current = requestAnimationFrame(checkLevel);
      };

      animFrameRef.current = requestAnimationFrame(checkLevel);
    } catch (err) {
      console.warn("Audio meter getUserMedia notice:", err);
    }
  };

  const stopAudioMeter = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  };

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
        recognition.continuous = true; // Keep listening so natural pauses don't cut off
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          isListeningRef.current = true;
          setIsListening(true);
          setIsFinalized(false);
          setStatusMessage(
            useLang.startsWith("hi")
              ? "🎙️ सुन रहे हैं... बोलना शुरू करें"
              : "🎙️ Listening... Speak clearly now"
          );
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

          const cleaned = fullLive.replace(/[.,!?;]+$/, "").trim();
          if (cleaned) {
            setTranscript(cleaned);
            if (finalFound) {
              setIsFinalized(true);
              setStatusMessage("✅ Suna gaya! 'Apply & Fill' click karein");
            } else {
              setStatusMessage("🎙️ Hearing you...");
            }
          }
        };

        recognition.onerror = (event) => {
          const err = event?.error || "unknown";
          if (err === "aborted") return;

          if (err === "no-speech") {
            // Keep listening in continuous mode
            return;
          }

          if (err === "not-allowed" || err === "service-not-allowed") {
            isListeningRef.current = false;
            setIsListening(false);
            setStatusMessage("❌ Microphone Blocked! Browser me lock icon se allow karein");
            toast.error(
              "🎙️ Microphone Blocked! Browser URL bar ke paas 🔒 Lock icon pe click karke 'Microphone: Allow' karein.",
              { autoClose: 7000 }
            );
          } else if (err === "network") {
            setStatusMessage("⚠️ Speech network reconnecting...");
          }
        };

        recognition.onend = () => {
          if (isListeningRef.current) {
            // Auto-restart if user still wants listening
            try {
              recognition.start();
            } catch {
              setIsListening(false);
              isListeningRef.current = false;
            }
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
      }
    },
    [stopVoiceSession]
  );

  const handleApply = () => {
    const clean = (transcript || "").trim().replace(/[.,!?;]+$/, "");
    if (clean) {
      onApply?.(clean);
      toast.success(`✅ "${clean}" filled successfully!`, { autoClose: 2000 });
    }
    stopVoiceSession();
    stopAudioMeter();
    onClose?.();
  };

  const handleRestart = () => {
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
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl p-5 sm:p-7 max-w-md w-full flex flex-col items-center text-center border border-slate-200 animate-scaleUp"
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
          Field: <span className="text-slate-900 font-extrabold">{fieldName}</span>
        </p>

        {/* Prominent Bilingual Language Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 border border-slate-200">
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

        {/* Central Pulsating YouTube / Google Microphone Circle with Dynamic Sound Wave Rings */}
        <div className="relative my-2 flex items-center justify-center">
          {/* Audio reactive pulsing ripple based on real volume */}
          {isListening && (
            <div
              className="absolute rounded-full bg-rose-500/25 transition-all duration-75"
              style={{
                width: `${100 + audioLevel * 0.8}px`,
                height: `${100 + audioLevel * 0.8}px`,
              }}
            />
          )}
          {isListening && audioLevel > 15 && (
            <div
              className="absolute rounded-full bg-blue-500/20 transition-all duration-75"
              style={{
                width: `${130 + audioLevel * 0.9}px`,
                height: `${130 + audioLevel * 0.9}px`,
              }}
            />
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
            title={isListening ? "Listening... Tap to stop" : "Tap to speak"}
          >
            <FaMicrophone />
          </button>
        </div>

        {/* Live Audio Level VU Meter (Confirms microphone is physically receiving sound) */}
        <div className="flex items-center gap-1 my-2 h-6 px-3 bg-slate-50 border border-slate-200 rounded-full">
          <FaVolumeUp className={`text-[10px] ${audioLevel > 5 ? "text-emerald-600" : "text-slate-400"}`} />
          <div className="flex items-center gap-1 h-3.5 px-1">
            {[1, 2, 3, 4, 5, 6, 7].map((barIdx) => {
              const active = audioLevel >= barIdx * 8;
              return (
                <span
                  key={barIdx}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    active ? "bg-emerald-500 h-3" : "bg-slate-300 h-1.5"
                  }`}
                />
              );
            })}
          </div>
          <span className="text-[10px] font-bold text-slate-500 ml-1">
            {audioLevel > 5 ? (
              <span className="text-emerald-600 font-bold">Sound Detected</span>
            ) : (
              <span>Speak into Mic</span>
            )}
          </span>
        </div>

        {/* Live Status Message */}
        <p className="text-xs font-bold text-slate-700 mt-1 mb-2 flex items-center gap-1.5">
          {isListening && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
          {statusMessage}
        </p>

        {/* Live Real-Time Editable Transcription Box */}
        <div className="w-full mt-1 relative">
          <textarea
            rows={3}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 bg-slate-50 border-2 border-blue-200 focus:border-blue-500 rounded-2xl text-center text-base sm:text-lg font-black text-slate-900 focus:outline-none resize-none transition shadow-inner placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal"
          />
          <div className="text-[9px] text-slate-400 text-right pr-2">
            Tip: You can also edit/refine text here directly
          </div>
        </div>

        {/* Warning if no sound after 4 seconds */}
        {isListening && audioLevel === 0 && !transcript && (
          <div className="w-full mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800 flex items-start gap-1.5 text-left">
            <FaExclamationTriangle className="text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Mic Notice:</strong> Agar aawaz capture nahi ho rahi, to Windows Settings me Default Microphone check karein ya URL bar ke paas Lock 🔒 icon se mic allow karein.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestart}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Clear and speak again"
          >
            <FaRedo className="text-[10px]" /> Re-Speak
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!transcript.trim()}
            className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          >
            <FaCheck /> Apply &amp; Fill
          </button>
        </div>
      </div>
    </div>
  );
}

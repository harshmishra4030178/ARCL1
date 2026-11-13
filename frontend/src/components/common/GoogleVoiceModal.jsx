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
  FaVolumeUp,
  FaSpinner,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { transcribeVoiceAudioApi } from "../../api/calibrationApi";

/**
 * GoogleVoiceModal - YouTube & Google Style Live Floating Voice Dictation Dialog
 * 
 * Features:
 * 1. Standard Single-Phrase Dictation (continuous=false, interimResults=true) - The exact YouTube Search model
 * 2. Hardware Web Audio API VU / Decibel Meter - Shows real-time volume (0% to 100%) so user knows if mic is receiving sound
 * 3. Zero-Volume Detection - Warns immediately if mic is muted in Windows
 * 4. Dual-Engine AI Fallback - If Web Speech API fails, records audio via MediaRecorder and transcribes with Gemini AI
 * 5. Bilingual Support - Indian English (en-IN) and Hindi (hi-IN)
 * 6. 1-Tap Quick Select Chips - 1 click auto-fills without waiting
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
  const [statusMessage, setStatusMessage] = useState("Microphone connecting...");
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [isAiTranscribing, setIsAiTranscribing] = useState(false);
  const [lastError, setLastError] = useState("");

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const committedTextRef = useRef(initialText || "");
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Setup hardware audio analyzer for live volume VU meter
  const startHardwareAudioMeter = async () => {
    try {
      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) return null;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(level);
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }

      // Also setup MediaRecorder for AI fallback
      try {
        const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(500); // 500ms slices
      } catch (recErr) {
        console.warn("MediaRecorder init notice:", recErr);
      }

      return stream;
    } catch (err) {
      console.warn("Hardware audio meter notice:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setLastError("Microphone permission blocked. Please allow mic in browser address bar.");
      }
      return null;
    }
  };

  const stopHardwareAudioMeter = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  const stopVoiceSession = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    stopHardwareAudioMeter();
    setIsListening(false);
  }, []);

  // AI Voice Transcription Fallback using backend Gemini
  const triggerAiTranscriptionFallback = async () => {
    if (audioChunksRef.current.length === 0) return;
    try {
      setIsAiTranscribing(true);
      setStatusMessage("🧠 AI Voice Engine analyzing audio...");
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result;
          const res = await transcribeVoiceAudioApi({
            audioBase64: base64Audio,
            mimeType: blob.type || "audio/webm",
            language: lang,
          });
          const aiText = res?.data?.data?.transcript || "";
          if (aiText) {
            const cleanAi = aiText.trim().replace(/[.,!?;]+$/, "");
            setTranscript(cleanAi);
            committedTextRef.current = cleanAi;
            setStatusMessage(`✅ AI Transcribed: "${cleanAi}"`);
            toast.success(`✅ Recognized by AI: "${cleanAi}"`, { autoClose: 2000 });
          }
        } catch (apiErr) {
          console.warn("AI transcription error:", apiErr);
        } finally {
          setIsAiTranscribing(false);
        }
      };
    } catch (err) {
      console.warn("AI fallback error:", err);
      setIsAiTranscribing(false);
    }
  };

  const startVoiceSession = useCallback(
    async (useLang = "en-IN") => {
      stopVoiceSession();

      if (typeof window === "undefined") return;

      if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        toast.error("🔒 Voice typing requires HTTPS or localhost.");
        setStatusMessage("Voice input requires HTTPS");
        return;
      }

      // Start live volume VU meter & recorder
      await startHardwareAudioMeter();

      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRec) {
        toast.warn("🎙️ Voice typing Google Chrome ya Microsoft Edge me chalti hai.");
        setStatusMessage("Browser Web Speech API not supported.");
        return;
      }

      try {
        const recognition = new SpeechRec();
        recognitionRef.current = recognition;
        recognition.lang = useLang;
        // EXACT YOUTUBE SEARCH MODEL: continuous = false for instant VAD & high sensitivity
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          isListeningRef.current = true;
          setIsListening(true);
          setLastError("");
          setStatusMessage(
            useLang.startsWith("hi")
              ? "🎙️ Mic On: हिन्दी में बोलें..."
              : "🎙️ Mic On: Speak clearly now..."
          );
        };

        recognition.onresult = (event) => {
          if (!event || !event.results) return;

          let interim = "";
          let finalChunk = "";

          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            if (result && result[0]) {
              const text = (result[0].transcript || "").trim();
              if (result.isFinal) {
                finalChunk += (finalChunk ? " " : "") + text;
              } else {
                interim += (interim ? " " : "") + text;
              }
            }
          }

          if (finalChunk) {
            const existing = committedTextRef.current ? committedTextRef.current + " " : "";
            const updated = (existing + finalChunk).replace(/[.,!?;]+$/, "").trim();
            committedTextRef.current = updated;
            setTranscript(updated);
            setStatusMessage(`✅ Suna gaya: "${updated}"`);
          } else if (interim) {
            const liveDisplay = committedTextRef.current
              ? `${committedTextRef.current} ${interim}`
              : interim;
            setTranscript(liveDisplay);
            setStatusMessage(`🎙️ Sun rahe hain: "${interim}"...`);
          }
        };

        recognition.onerror = (event) => {
          const err = event?.error || "unknown";
          if (err === "aborted") return;

          if (err === "no-speech") {
            // In single-phrase, check if AI fallback can transcribe
            if (!committedTextRef.current && audioChunksRef.current.length > 0) {
              triggerAiTranscriptionFallback();
            }
            return;
          }

          setLastError(err);

          if (err === "not-allowed" || err === "service-not-allowed") {
            isListeningRef.current = false;
            setIsListening(false);
            setStatusMessage("❌ Microphone Blocked! Browser me lock icon se allow karein");
            toast.error("🎙️ Mic blocked! Chrome URL bar me 🔒 Lock icon se allow karein.", { autoClose: 7000 });
          } else if (err === "network") {
            setStatusMessage("⚠️ Google Speech Network error. Switching to AI engine...");
            triggerAiTranscriptionFallback();
          } else if (err === "audio-capture") {
            setStatusMessage("❌ Koi microphone nahi mila. Check audio device.");
          } else {
            setStatusMessage(`Notice: ${err}`);
          }
        };

        recognition.onend = () => {
          // Seamless single-phrase loop: If still in listening mode, start next phrase immediately
          if (isListeningRef.current) {
            setTimeout(() => {
              if (isListeningRef.current) {
                try {
                  startVoiceSession(useLang);
                } catch {
                  // ignore
                }
              }
            }, 100);
          } else {
            setIsListening(false);
          }
        };

        isListeningRef.current = true;
        recognition.start();
      } catch (err) {
        console.error("Voice start error:", err);
        setIsListening(false);
        isListeningRef.current = false;
        setStatusMessage("Mic start failed. Check browser permissions.");
        setLastError(err.message || "Failed to start");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopVoiceSession]
  );

  // Sync initial text when modal opens
  useEffect(() => {
    if (isOpen) {
      committedTextRef.current = initialText || "";
      setTranscript(initialText || "");
      setLastError("");
      setIsAiTranscribing(false);
      startVoiceSession(lang);
    } else {
      stopVoiceSession();
    }
    return () => {
      stopVoiceSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
    committedTextRef.current = "";
    setTranscript("");
    audioChunksRef.current = [];
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
        <p className="text-[11px] font-bold text-blue-700 bg-blue-50 px-3 py-0.5 rounded-full border border-blue-200 mt-1 mb-2">
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

        {/* Real-time Hardware Web Audio API VU / Decibel Waveform */}
        <div className="w-full max-w-[280px] bg-slate-100 rounded-xl p-2 mb-2 border border-slate-200 flex flex-col items-center">
          <div className="flex items-center justify-between w-full text-[10px] font-black text-slate-600 mb-1 px-1">
            <span className="flex items-center gap-1">
              <FaVolumeUp className={audioLevel > 5 ? "text-emerald-500 animate-pulse" : "text-slate-400"} />
              Hardware Mic Volume:
            </span>
            <span className={audioLevel > 5 ? "text-emerald-700 font-black" : "text-slate-500"}>
              {audioLevel}%
            </span>
          </div>

          {/* 14-Bar Animated Graphic Equalizer */}
          <div className="flex items-end justify-center gap-1 h-7 w-full px-2">
            {[10, 25, 45, 70, 90, 100, 80, 60, 95, 75, 50, 30, 20, 15].map((scale, i) => {
              const active = audioLevel > 5;
              const barHeight = active
                ? Math.max(4, Math.min(28, Math.round((audioLevel / 100) * (scale / 100) * 28 + Math.random() * 4)))
                : 3;
              return (
                <div
                  key={i}
                  style={{ height: `${barHeight}px` }}
                  className={`w-2.5 rounded-t-sm transition-all duration-75 ${
                    active
                      ? barHeight > 18
                        ? "bg-rose-500"
                        : barHeight > 10
                        ? "bg-emerald-500"
                        : "bg-blue-500"
                      : "bg-slate-300"
                  }`}
                />
              );
            })}
          </div>

          {/* Mute Diagnostic Alert */}
          {isListening && audioLevel === 0 && (
            <div className="mt-1.5 text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 w-full text-center">
              ⚠️ Mic aawaz 0% hai. Mic ke paas bolein ya Windows Settings me un-mute check karein.
            </div>
          )}
          {isListening && audioLevel > 5 && (
            <div className="mt-1 text-[9.5px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 w-full text-center">
              🟢 Aawaz suni ja rahi hai ({audioLevel}%)! Bolte rahein...
            </div>
          )}
        </div>

        {/* Central Pulsating YouTube / Google Microphone Circle */}
        <div className="relative my-2 flex items-center justify-center">
          {isListening && (
            <div className="absolute w-24 h-24 rounded-full bg-rose-500/20 animate-ping" />
          )}
          {isListening && audioLevel > 5 && (
            <div
              className="absolute rounded-full bg-emerald-500/25 animate-pulse"
              style={{
                width: `${Math.min(140, 80 + audioLevel)}px`,
                height: `${Math.min(140, 80 + audioLevel)}px`,
              }}
            />
          )}

          {/* Core Mic Button */}
          <button
            type="button"
            onClick={isListening ? stopVoiceSession : handleRestart}
            className={`relative z-10 w-18 h-18 rounded-full flex items-center justify-center text-white text-2xl shadow-xl transition transform active:scale-95 cursor-pointer ${
              isListening
                ? audioLevel > 5
                  ? "bg-gradient-to-tr from-emerald-600 to-teal-500 ring-4 ring-emerald-200 animate-pulse"
                  : "bg-gradient-to-tr from-rose-600 to-red-500 ring-4 ring-rose-200 animate-pulse"
                : "bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 ring-4 ring-blue-100"
            }`}
            title={isListening ? "Listening... Tap to pause" : "Tap to speak"}
          >
            {isAiTranscribing ? <FaSpinner className="animate-spin text-xl" /> : <FaMicrophone />}
          </button>
        </div>

        {/* Status Message */}
        <p className="text-[11px] font-bold text-slate-700 mb-2 truncate max-w-full">
          {isAiTranscribing ? "🧠 Processing audio via AI..." : statusMessage}
        </p>

        {/* Live Real-Time Editable Transcription Box */}
        <div className="w-full relative">
          <textarea
            rows={2}
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              committedTextRef.current = e.target.value;
            }}
            placeholder={placeholder}
            className="w-full p-2.5 bg-slate-50 border-2 border-blue-300 focus:border-blue-600 rounded-xl text-center text-sm sm:text-base font-black text-slate-900 focus:outline-none resize-none transition shadow-inner placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal"
          />
          {transcript && (
            <div className="absolute right-2 bottom-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-0.5">
              <FaCheck className="text-[8px]" /> Captured
            </div>
          )}
        </div>

        {/* 1-Tap Quick Select Chips (Fastest Method: 1 Click Auto-Fills Everything) */}
        {Array.isArray(quickSuggestions) && quickSuggestions.length > 0 && (
          <div className="w-full mt-2.5 text-left">
            <div className="text-[10.5px] font-black text-slate-700 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <FaInfoCircle className="text-amber-600 text-[10px]" /> 1-Tap Quick Fill (Instant):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
              {quickSuggestions.slice(0, 8).map((item, idx) => {
                const label = item?.companyName || item?.name || (typeof item === "string" ? item : "");
                if (!label) return null;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApply(label)}
                    className="px-2 py-1 bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-400 rounded-lg text-[10px] font-bold text-blue-900 transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                    title={`Click to auto-fill: ${label}`}
                  >
                    {item?.companyName ? (
                      <FaBuilding className="text-blue-600 text-[9px] shrink-0" />
                    ) : (
                      <FaTools className="text-emerald-600 text-[9px] shrink-0" />
                    )}
                    <span className="truncate max-w-[150px]">{label}</span>
                    <span className="text-blue-600 font-black">↵</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Warning if error occurred */}
        {lastError && (
          <div className="w-full mt-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-800 flex items-start gap-1.5 text-left">
            <FaExclamationTriangle className="text-rose-500 shrink-0 mt-0.5" />
            <span>
              <strong>Notice:</strong> {lastError}
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

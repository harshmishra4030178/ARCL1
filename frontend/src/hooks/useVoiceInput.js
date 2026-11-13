"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

// Module-level pointer to guarantee ONLY one SpeechRecognition instance is active on the page at any time
let globalSpeechRecognition = null;

const abortGlobalRecognition = () => {
  if (globalSpeechRecognition) {
    try {
      globalSpeechRecognition.onend = null;
      globalSpeechRecognition.onerror = null;
      globalSpeechRecognition.abort();
    } catch {
      // ignore
    }
    globalSpeechRecognition = null;
  }
};

/**
 * useVoiceInput - Bulletproof Web Speech Recognition Hook
 * Supports real-time hands-free speech-to-text with auto-restart on pauses,
 * full transcript accumulation, singleton recognition protection, and clear user toasts.
 */
export default function useVoiceInput({
  lang = "en-IN",
  continuous = true,
  interimResults = true,
  onResult,
  onFinal,
  onError,
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [statusText, setStatusText] = useState("");

  const recognitionRef = useRef(null);
  const wantListeningRef = useRef(false);
  const restartTimerRef = useRef(null);
  const activeConfigRef = useRef({ lang, continuous, interimResults });

  const onResultRef = useRef(onResult);
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  onResultRef.current = onResult;
  onFinalRef.current = onFinal;
  onErrorRef.current = onError;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRec));
    }
  }, []);

  const clearRestartTimer = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const stopListening = useCallback(() => {
    wantListeningRef.current = false;
    clearRestartTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (globalSpeechRecognition) {
      abortGlobalRecognition();
    }

    setIsListening(false);
    setStatusText("");
  }, []);

  const launchRecognition = useCallback(
    (customOptions = {}) => {
      if (typeof window === "undefined") return false;
      const SpeechRec =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRec) {
        wantListeningRef.current = false;
        setIsSupported(false);
        const msg =
          "Voice input is supported in Google Chrome & Microsoft Edge. Please use Chrome or Edge browser.";
        setStatusText(msg);
        toast.warn("🎙️ Voice input Chrome ya Edge browser me chalta hai.", {
          toastId: "voice-unsupported",
          autoClose: 5000,
        });
        onErrorRef.current?.(new Error(msg));
        return false;
      }

      // Insecure context check (e.g. accessed via raw IP address without HTTPS)
      if (
        typeof window.isSecureContext === "boolean" &&
        !window.isSecureContext &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        toast.warn(
          "⚠️ Browser ne insecure IP connection ki wajah se mic disable kiya hai. Localhost ya HTTPS use karein.",
          { toastId: "voice-insecure", autoClose: 6000 }
        );
      }

      // Abort any existing recognition instance across the entire page
      abortGlobalRecognition();

      const useLang = customOptions.lang || activeConfigRef.current.lang || lang;
      const useContinuous =
        customOptions.continuous !== undefined
          ? customOptions.continuous
          : activeConfigRef.current.continuous !== undefined
          ? activeConfigRef.current.continuous
          : continuous;
      const useInterim =
        customOptions.interimResults !== undefined
          ? customOptions.interimResults
          : activeConfigRef.current.interimResults !== undefined
          ? activeConfigRef.current.interimResults
          : interimResults;

      activeConfigRef.current = {
        lang: useLang,
        continuous: useContinuous,
        interimResults: useInterim,
        onResult: customOptions.onResult,
        onFinal: customOptions.onFinal,
        onError: customOptions.onError,
      };

      try {
        const recognition = new SpeechRec();
        recognition.lang = useLang;
        recognition.continuous = useContinuous;
        recognition.interimResults = useInterim;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsListening(true);
          const langLabel = useLang.startsWith("hi") ? "Hindi" : "English";
          const msg = `🎙️ Mic On (${langLabel}): Bolna shuru karein...`;
          setStatusText(msg);
          toast.info(msg, {
            toastId: "voice-active-notice",
            autoClose: 2200,
          });
        };

        recognition.onresult = (event) => {
          if (!event || !event.results) return;

          // Full transcript accumulation from index 0 so words are NEVER dropped or sliced off
          let fullAccumulated = "";
          let hasFinalChunk = false;

          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            if (res && res[0]) {
              const chunk = (res[0].transcript || "").trim();
              if (chunk) {
                fullAccumulated += (fullAccumulated ? " " : "") + chunk;
              }
              if (res.isFinal) {
                hasFinalChunk = true;
              }
            }
          }

          const cleanedText = fullAccumulated.trim().replace(/[.,!?;]+$/, "");
          if (!cleanedText) return;

          setTranscript(cleanedText);
          setStatusText(
            hasFinalChunk
              ? `✅ Suna: "${cleanedText}"`
              : `🎙️ Sun rahe hain: "${cleanedText}"...`
          );

          // Deliver live text to the caller
          const resultHandler = customOptions.onResult || onResultRef.current;
          if (resultHandler) {
            resultHandler(cleanedText, {
              isFinal: hasFinalChunk,
              rawTranscript: fullAccumulated,
            });
          }

          if (hasFinalChunk) {
            const finalHandler = customOptions.onFinal || onFinalRef.current;
            if (finalHandler) {
              finalHandler(cleanedText);
            }
          }
        };

        recognition.onerror = (event) => {
          const errCode = event?.error || "unknown";
          if (errCode === "aborted") return;

          // Chrome emits "no-speech" during natural pauses. Keep listening alive!
          if (errCode === "no-speech") {
            if (wantListeningRef.current) {
              setStatusText("🎙️ Listening... Bolna shuru karein");
              return;
            }
          }

          let errMessage = "";
          let fatal = false;

          if (errCode === "not-allowed" || errCode === "service-not-allowed") {
            fatal = true;
            errMessage =
              "Microphone permission blocked! Browser URL bar ke paas 🔒 Lock icon pe click karke Mic Allow karein.";
            toast.error(
              "🎙️ Microphone Blocked! Browser URL bar ke paas 🔒 Lock icon pe click karke 'Microphone: Allow' karein.",
              { toastId: "voice-blocked", autoClose: 7000 }
            );
          } else if (errCode === "audio-capture") {
            fatal = true;
            errMessage = "Koi microphone detect nahi hua. Check your audio device.";
            toast.error("🎙️ Koi microphone nahi mila! Kripya mic check karein.", {
              toastId: "voice-no-mic",
              autoClose: 5000,
            });
          } else if (errCode === "network") {
            errMessage = "Speech network connection error. Reconnecting...";
            toast.warn("🎙️ Speech recognition network hiccup. Dobara bol sakte hain.", {
              toastId: "voice-network-warn",
              autoClose: 3000,
            });
          } else {
            errMessage = `Speech notice: ${errCode}`;
          }

          setStatusText(errMessage);

          if (fatal) {
            wantListeningRef.current = false;
            setIsListening(false);
            if (globalSpeechRecognition === recognition) {
              globalSpeechRecognition = null;
            }
            const errorHandler = customOptions.onError || onErrorRef.current;
            errorHandler?.(event);
          }
        };

        recognition.onend = () => {
          if (globalSpeechRecognition === recognition) {
            globalSpeechRecognition = null;
          }

          // In continuous mode or if user is still dictating, auto-restart so natural pauses don't abort
          if (wantListeningRef.current) {
            clearRestartTimer();
            restartTimerRef.current = setTimeout(() => {
              if (wantListeningRef.current) {
                launchRecognition(activeConfigRef.current);
              }
            }, 120);
            return;
          }

          setIsListening(false);
          setTimeout(() => {
            setStatusText((prev) => (prev.startsWith("🎙️") ? "" : prev));
          }, 2000);
        };

        globalSpeechRecognition = recognition;
        recognitionRef.current = recognition;
        recognition.start();
        return true;
      } catch (err) {
        console.error("Failed to start voice recognition:", err);
        wantListeningRef.current = false;
        setIsListening(false);
        abortGlobalRecognition();
        setStatusText("Could not start microphone.");
        toast.error("🎙️ Mic start nahi ho saka. Page refresh karke check karein.", {
          toastId: "voice-start-fail",
          autoClose: 4000,
        });
        onErrorRef.current?.(err);
        return false;
      }
    },
    [lang, continuous, interimResults]
  );

  const startListening = useCallback(
    async (customOptions = {}) => {
      // Pre-flight microphone permission check via getUserMedia
      if (
        typeof window !== "undefined" &&
        navigator?.mediaDevices?.getUserMedia
      ) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          // Immediately stop media stream tracks so SpeechRecognition has direct exclusive device access
          stream.getTracks().forEach((track) => track.stop());
        } catch (permErr) {
          console.warn("Microphone getUserMedia pre-check error:", permErr);
          if (
            permErr.name === "NotAllowedError" ||
            permErr.name === "PermissionDeniedError"
          ) {
            toast.error(
              "🎙️ Microphone Blocked! Browser URL bar ke paas 🔒 Lock icon pe click karke 'Microphone: Allow' karein.",
              { toastId: "voice-blocked-perm", autoClose: 7000 }
            );
            setIsListening(false);
            wantListeningRef.current = false;
            return false;
          } else if (
            permErr.name === "NotFoundError" ||
            permErr.name === "DevicesNotFoundError"
          ) {
            toast.error(
              "🎙️ Koi microphone nahi mila! Kripya apna mic connect karein.",
              { toastId: "voice-not-found", autoClose: 5000 }
            );
            setIsListening(false);
            wantListeningRef.current = false;
            return false;
          }
        }
      }

      activeConfigRef.current = {
        lang: customOptions.lang || lang,
        continuous:
          customOptions.continuous !== undefined
            ? customOptions.continuous
            : continuous,
        interimResults:
          customOptions.interimResults !== undefined
            ? customOptions.interimResults
            : interimResults,
      };
      wantListeningRef.current = true;
      return launchRecognition(customOptions);
    },
    [lang, continuous, interimResults, launchRecognition]
  );

  const toggleListening = useCallback(
    (customOptions = {}) => {
      if (isListening || wantListeningRef.current) {
        stopListening();
      } else {
        startListening(customOptions);
      }
    },
    [isListening, stopListening, startListening]
  );

  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      clearRestartTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (globalSpeechRecognition === recognitionRef.current) {
        globalSpeechRecognition = null;
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    statusText,
    startListening,
    stopListening,
    toggleListening,
    setStatusText,
  };
}

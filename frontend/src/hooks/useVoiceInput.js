"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/**
 * useVoiceInput - Custom hook for Web Speech Recognition API.
 * Uses stable callback refs and auto-restart when continuous listening is active
 * so Chrome/Edge pauses don't silently drop hands-free dictation.
 */
export default function useVoiceInput({
  lang = "en-IN",
  continuous = false,
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
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const launchRecognition = useCallback((customOptions = {}) => {
    if (typeof window === "undefined") return false;
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      wantListeningRef.current = false;
      setIsSupported(false);
      const msg =
        "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.";
      setStatusText(msg);
      onErrorRef.current?.(new Error(msg));
      return false;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    const useLang = customOptions.lang || activeConfigRef.current.lang || lang;
    const useContinuous =
      customOptions.continuous !== undefined
        ? customOptions.continuous
        : activeConfigRef.current.continuous;
    const useInterim =
      customOptions.interimResults !== undefined
        ? customOptions.interimResults
        : activeConfigRef.current.interimResults;

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
        setStatusText("🎙️ Listening... Speak numbers or commands clearly");
      };

      recognition.onresult = (event) => {
        let finalStr = "";
        let interimStr = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const textChunk = item?.[0]?.transcript || "";
          if (item.isFinal) {
            finalStr += (finalStr ? " " : "") + textChunk;
          } else {
            interimStr += (interimStr ? " " : "") + textChunk;
          }
        }

        const currentText = (finalStr || interimStr || "").trim();
        const cleanedText = currentText.replace(/[.,?!]+$/, "").trim();

        setTranscript(cleanedText);
        if (cleanedText) {
          setStatusText(
            finalStr ? `✅ Heard: "${cleanedText}"` : `🎙️ Hearing: "${cleanedText}"...`
          );
        }

        const resultHandler = customOptions.onResult || onResultRef.current;
        if (resultHandler && cleanedText) {
          resultHandler(cleanedText, {
            isFinal: Boolean(finalStr),
            rawTranscript: currentText,
          });
        }

        const cleanFinal = finalStr.replace(/[.,?!]+$/, "").trim();
        if (cleanFinal) {
          const finalHandler = customOptions.onFinal || onFinalRef.current;
          if (finalHandler) {
            finalHandler(cleanFinal);
          }
        }
      };

      recognition.onerror = (event) => {
        const errCode = event?.error || "unknown";
        if (errCode === "aborted") return;

        // Chrome emits "no-speech" during natural pauses; keep mic alive in continuous mode
        if (errCode === "no-speech" && wantListeningRef.current && useContinuous) {
          setStatusText("🎙️ Still listening... Speak whenever ready");
          return;
        }

        let errMessage = "";
        let fatal = false;
        if (errCode === "not-allowed" || errCode === "service-not-allowed") {
          fatal = true;
          errMessage =
            "Microphone permission denied. Please allow mic access in browser site settings.";
        } else if (errCode === "audio-capture") {
          fatal = true;
          errMessage = "No microphone detected. Check your audio input device.";
        } else if (errCode === "network") {
          errMessage = "Speech recognition network error — retrying...";
        } else {
          errMessage = `Speech notice: ${errCode}`;
        }

        setStatusText(errMessage);
        if (fatal) {
          wantListeningRef.current = false;
          setIsListening(false);
          const errorHandler = customOptions.onError || onErrorRef.current;
          errorHandler?.(event);
        }
      };

      recognition.onend = () => {
        if (wantListeningRef.current && useContinuous) {
          clearRestartTimer();
          restartTimerRef.current = setTimeout(() => {
            if (wantListeningRef.current) {
              launchRecognition(activeConfigRef.current);
            }
          }, 150);
          return;
        }
        setIsListening(false);
        setTimeout(() => {
          setStatusText((prev) =>
            prev.startsWith("🎙️") ? "" : prev
          );
        }, 2000);
      };

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (err) {
      console.error("Failed to start voice recognition:", err);
      wantListeningRef.current = false;
      setIsListening(false);
      setStatusText("Could not start microphone. Try refreshing or checking mic permission.");
      onErrorRef.current?.(err);
      return false;
    }
  }, [lang]);

  const startListening = useCallback(
    (customOptions = {}) => {
      activeConfigRef.current = {
        lang: customOptions.lang || lang,
        continuous:
          customOptions.continuous !== undefined ? customOptions.continuous : continuous,
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
        setStatusText("");
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
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
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

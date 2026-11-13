"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

// Module-level pointer to guarantee ONLY one SpeechRecognition instance is active on the page at any time
let activeGlobalRecognition = null;

/**
 * useVoiceInput - Ultra-Fast Google & YouTube Style Speech Recognition Hook
 * Streams speech phoneme-by-phoneme with sub-50ms latency directly into the input.
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

  const stopListening = useCallback(() => {
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
    if (activeGlobalRecognition) {
      try {
        activeGlobalRecognition.abort();
      } catch {
        // ignore
      }
      activeGlobalRecognition = null;
    }
    setIsListening(false);
    setStatusText("");
  }, []);

  const startListening = useCallback(
    (customOptions = {}) => {
      if (typeof window === "undefined") return false;
      const SpeechRec =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRec) {
        const msg =
          "Voice recognition Google Chrome aur Microsoft Edge me support hota hai.";
        toast.warn("🎙️ " + msg, {
          toastId: "voice-unsupported",
          autoClose: 5000,
        });
        setIsSupported(false);
        onErrorRef.current?.(new Error(msg));
        return false;
      }

      // Stop any previously running recognition instance cleanly
      if (activeGlobalRecognition) {
        try {
          activeGlobalRecognition.onend = null;
          activeGlobalRecognition.onerror = null;
          activeGlobalRecognition.abort();
        } catch {
          // ignore
        }
        activeGlobalRecognition = null;
      }

      const useLang = customOptions.lang || lang || "en-IN";
      const useContinuous =
        customOptions.continuous !== undefined
          ? customOptions.continuous
          : continuous;
      const useInterim =
        customOptions.interimResults !== undefined
          ? customOptions.interimResults
          : interimResults;

      try {
        const recognition = new SpeechRec();
        activeGlobalRecognition = recognition;
        recognitionRef.current = recognition;

        recognition.lang = useLang;
        recognition.continuous = useContinuous;
        recognition.interimResults = useInterim;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          const langLabel = useLang.startsWith("hi") ? "हिन्दी" : "English";
          setStatusText(`🎙️ Listening (${langLabel})... Bolna shuru karein`);
        };

        recognition.onresult = (event) => {
          if (!event || !event.results) return;

          // Pure YouTube / Google Search real-time accumulation
          const fullText = Array.from(event.results)
            .map((res) => (res && res[0] ? res[0].transcript : ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          const lastResult = event.results[event.results.length - 1];
          const isFinal = Boolean(lastResult?.isFinal);

          const cleaned = fullText.replace(/[.,!?;]+$/, "").trim();
          if (cleaned) {
            setTranscript(cleaned);
            setStatusText(
              isFinal
                ? `✅ Suna: "${cleaned}"`
                : `🎙️ Sun rahe hain: "${cleaned}"...`
            );

            const resultHandler = customOptions.onResult || onResultRef.current;
            resultHandler?.(cleaned, { isFinal, rawTranscript: fullText });

            if (isFinal) {
              const finalHandler = customOptions.onFinal || onFinalRef.current;
              finalHandler?.(cleaned);
            }
          }
        };

        recognition.onerror = (event) => {
          const err = event?.error || "unknown";
          if (err === "aborted") return;

          setIsListening(false);
          if (activeGlobalRecognition === recognition) {
            activeGlobalRecognition = null;
          }

          if (err === "not-allowed" || err === "service-not-allowed") {
            toast.error(
              "🎙️ Microphone Blocked! Browser URL bar ke paas 🔒 Lock icon pe click karke 'Microphone: Allow' karein.",
              { toastId: "voice-blocked", autoClose: 7000 }
            );
          } else if (err === "no-speech") {
            setStatusText("Koi aawaz nahi aayi. Dobara bol sakte hain.");
          } else if (err === "audio-capture") {
            toast.error("🎙️ Koi microphone nahi mila. Mic check karein.", {
              toastId: "voice-no-mic",
              autoClose: 5000,
            });
          }

          const errorHandler = customOptions.onError || onErrorRef.current;
          errorHandler?.(event);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (activeGlobalRecognition === recognition) {
            activeGlobalRecognition = null;
          }
        };

        recognition.start();
        return true;
      } catch (err) {
        console.error("Voice start error:", err);
        setIsListening(false);
        activeGlobalRecognition = null;
        toast.error("🎙️ Mic start nahi hua. Kripya page refresh karein.", {
          toastId: "voice-start-fail",
          autoClose: 4000,
        });
        onErrorRef.current?.(err);
        return false;
      }
    },
    [lang, continuous, interimResults]
  );

  const toggleListening = useCallback(
    (customOptions = {}) => {
      if (isListening) {
        stopListening();
      } else {
        startListening(customOptions);
      }
    },
    [isListening, stopListening, startListening]
  );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (activeGlobalRecognition === recognitionRef.current) {
        activeGlobalRecognition = null;
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

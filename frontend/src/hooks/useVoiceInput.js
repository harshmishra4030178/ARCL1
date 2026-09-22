"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/**
 * useVoiceInput - Lightweight and robust custom hook for Web Speech Recognition API
 * Allows speaking to search or auto-fill input fields with real-time transcript streaming.
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
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (customOptions = {}) => {
      if (typeof window === "undefined") return false;
      const SpeechRec =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRec) {
        setIsSupported(false);
        const msg =
          "Voice input is not supported in this browser. Please use Google Chrome, Microsoft Edge, or a Web Speech-compatible browser.";
        setStatusText(msg);
        if (onError) onError(new Error(msg));
        return false;
      }

      // Stop any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      try {
        const recognition = new SpeechRec();
        recognition.lang = customOptions.lang || lang;
        recognition.continuous =
          customOptions.continuous !== undefined
            ? customOptions.continuous
            : continuous;
        recognition.interimResults =
          customOptions.interimResults !== undefined
            ? customOptions.interimResults
            : interimResults;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsListening(true);
          setStatusText("🎙️ Listening... Speak clearly now");
        };

        recognition.onresult = (event) => {
          let finalStr = "";
          let interimStr = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item.isFinal) {
              finalStr += item[0].transcript;
            } else {
              interimStr += item[0].transcript;
            }
          }

          const currentText = (finalStr || interimStr || "").trim();
          // Clean trailing punctuation
          const cleanedText = currentText.replace(/[\.\,\?\!]+$/, "").trim();

          setTranscript(cleanedText);
          if (cleanedText) {
            setStatusText(`🎙️ Heard: "${cleanedText}"`);
          }

          const resultHandler = customOptions.onResult || onResult;
          if (resultHandler && cleanedText) {
            resultHandler(cleanedText, {
              isFinal: Boolean(finalStr),
              rawTranscript: currentText,
            });
          }

          if (finalStr) {
            const finalHandler = customOptions.onFinal || onFinal;
            if (finalHandler) {
              finalHandler(cleanedText);
            }
          }
        };

        recognition.onerror = (event) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
          let errMessage = "";
          if (event.error === "not-allowed") {
            errMessage =
              "Microphone permission denied. Please allow microphone access in your browser settings.";
          } else if (event.error === "no-speech") {
            errMessage = "No speech detected. Please speak clearly into your microphone.";
          } else if (event.error === "network") {
            errMessage = "Network error during speech recognition.";
          } else if (event.error === "audio-capture") {
            errMessage = "No microphone found. Please check your audio input device.";
          } else {
            errMessage = `Speech recognition error: ${event.error}`;
          }

          setStatusText(errMessage);
          const errorHandler = customOptions.onError || onError;
          if (errorHandler) {
            errorHandler(event);
          }

          setTimeout(() => {
            setStatusText("");
          }, 3500);
        };

        recognition.onend = () => {
          setIsListening(false);
          setTimeout(() => {
            setStatusText("");
          }, 2000);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return true;
      } catch (err) {
        console.error("Failed to start voice recognition:", err);
        setIsListening(false);
        setStatusText("Could not access microphone.");
        if (onError) onError(err);
        return false;
      }
    },
    [lang, continuous, interimResults, onResult, onFinal, onError]
  );

  const toggleListening = useCallback(
    (customOptions = {}) => {
      if (isListening) {
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
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
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

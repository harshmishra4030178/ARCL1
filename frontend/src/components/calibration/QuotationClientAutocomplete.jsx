"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FaBuilding,
  FaMicrophone,
  FaCheck,
  FaMapMarkerAlt,
  FaIdCard,
  FaTrashAlt,
  FaTimes,
  FaStar,
  FaExpand,
} from "react-icons/fa";
import { toast } from "react-toastify";
import GoogleVoiceModal from "../common/GoogleVoiceModal.jsx";
import {
  getSavedQuotationClients,
  deleteSavedQuotationClient,
} from "../../utils/quotationStorage.js";

export default function QuotationClientAutocomplete({
  value = "",
  onChange,
  onSelectClient,
  recordsClients = [],
  placeholder = "Search or type Client Company Name...",
  className = "",
  disabled = false,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [savedClients, setSavedClients] = useState([]);
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isDirectListening, setIsDirectListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle"); // idle | capturing | sound | speech
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const directRecRef = useRef(null);
  const isDirectListeningRef = useRef(false);
  const sessionPrefixRef = useRef("");
  const lastRecognizedRef = useRef("");

  // Load saved clients from localStorage on mount and when modal opens
  useEffect(() => {
    setSavedClients(getSavedQuotationClients());
  }, []);

  const stopDirectVoiceSession = () => {
    isDirectListeningRef.current = false;
    setIsDirectListening(false);
    setVoiceStatus("idle");
    if (directRecRef.current) {
      try {
        directRecRef.current.onstart = null;
        directRecRef.current.onaudiostart = null;
        directRecRef.current.onsoundstart = null;
        directRecRef.current.onspeechstart = null;
        directRecRef.current.onresult = null;
        directRecRef.current.onerror = null;
        directRecRef.current.onend = null;
        directRecRef.current.stop();
      } catch {
        // ignore
      }
      directRecRef.current = null;
    }
  };

  const startDirectVoiceSession = (useLang = null) => {
    if (typeof window === "undefined") return;

    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      toast.error(
        `🔒 Browser Security Error: Voice typing sirf 'http://localhost:3000' ya HTTPS pe chalti hai. Aap IP address (${window.location.hostname}) pe hain.`,
        { toastId: "insecure-origin", autoClose: 8000 }
      );
      return;
    }

    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      toast.warn("🎙️ Voice typing Google Chrome ya Microsoft Edge me chalti hai.");
      return;
    }

    const activeLang = useLang || voiceLang || "en-IN";

    // Clean up any existing session
    if (directRecRef.current) {
      try {
        directRecRef.current.onend = null;
        directRecRef.current.abort();
      } catch {
        // ignore
      }
      directRecRef.current = null;
    }

    try {
      const recognition = new SpeechRec();
      directRecRef.current = recognition;
      recognition.lang = activeLang;
      recognition.interimResults = true;
      recognition.continuous = false; // YouTube single-phrase model: maximum sensitivity & instant VAD
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isDirectListeningRef.current = true;
        setIsDirectListening(true);
        setVoiceStatus("capturing");
        setIsOpen(true);
        toast.info(
          activeLang.startsWith("hi")
            ? "🎙️ Mic On: हिन्दी में बोलें, शब्द तुरंत टाइप होंगे..."
            : "🎙️ Mic On: Speak now, words will type directly...",
          { toastId: "voice-live-direct", autoClose: 2000 }
        );
      };

      recognition.onaudiostart = () => {
        setVoiceStatus("capturing");
      };

      recognition.onsoundstart = () => {
        setVoiceStatus("sound");
      };

      recognition.onspeechstart = () => {
        setVoiceStatus("speech");
      };

      recognition.onresult = (event) => {
        if (!event || !event.results) return;
        setVoiceStatus("speech");

        let liveSessionText = "";

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res[0]) {
            const chunk = (res[0].transcript || "").trim();
            if (chunk) {
              liveSessionText += (liveSessionText ? " " : "") + chunk;
            }
          }
        }

        const prefix = sessionPrefixRef.current ? sessionPrefixRef.current + " " : "";
        const clean = (prefix + liveSessionText).trim().replace(/[.,!?;]+$/, "");

        if (clean) {
          lastRecognizedRef.current = clean;
          // PURE 100% UNRESTRICTED TYPING: Whatever the user says is typed directly!
          onChange?.(clean);
          setIsOpen(true);

          // Only auto-fill GST & address if it is an exact full match to a company name
          const cleanLower = clean.toLowerCase();
          const exactMatch = allClientsPool.find(
            (c) => (c.companyName || "").toLowerCase() === cleanLower
          );
          if (exactMatch) {
            onSelectClient?.(exactMatch);
            toast.success(`✅ Matched: ${exactMatch.companyName}`, {
              toastId: "client-match",
              autoClose: 2000,
            });
          }
        }
      };

      recognition.onerror = (event) => {
        const err = event?.error || "unknown";
        if (err === "no-speech") return; // Single phrase pause, auto-loops seamlessly
        if (err === "aborted") return;

        console.warn("Direct voice recognition error:", err);
        if (err === "not-allowed" || err === "service-not-allowed") {
          isDirectListeningRef.current = false;
          setIsDirectListening(false);
          setVoiceStatus("idle");
          toast.error("🎙️ Mic blocked! Browser URL bar ke paas 🔒 Lock icon se allow karein.", { autoClose: 7000 });
        } else if (err === "network") {
          toast.error("❌ Google Speech Server Network Error: Google speech server connect nahi ho pa raha. Internet ya DNS check karein.", {
            toastId: "voice-net-error",
            autoClose: 5000,
          });
        } else if (err === "audio-capture") {
          toast.error("🎙️ Koi microphone nahi mila. Check audio device.", { toastId: "voice-no-mic", autoClose: 4000 });
        } else {
          toast.warn(`🎙️ Speech notice: ${err}`, { toastId: "voice-err-notice", autoClose: 3000 });
        }
      };

      recognition.onend = () => {
        // Save current text into sessionPrefix so restarts don't erase previous words
        if (lastRecognizedRef.current) {
          sessionPrefixRef.current = lastRecognizedRef.current;
        }

        // Auto-restart with a FRESH INSTANCE so Chrome doesn't throw InvalidStateError
        if (isDirectListeningRef.current) {
          setTimeout(() => {
            if (isDirectListeningRef.current) {
              startDirectVoiceSession(activeLang);
            }
          }, 150);
        } else {
          setIsDirectListening(false);
          setVoiceStatus("idle");
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }
      };

      isDirectListeningRef.current = true;
      recognition.start();
    } catch (err) {
      console.error("Direct voice start error:", err);
      isDirectListeningRef.current = false;
      setIsDirectListening(false);
      setVoiceStatus("idle");
      toast.error("🎙️ Mic start nahi hua: " + (err.message || "Unknown"), {
        toastId: "voice-catch-err",
        autoClose: 4000,
      });
    }
  };

  // Direct Inline Voice Dictation (Google Search & YouTube Model)
  const toggleDirectVoice = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (isDirectListeningRef.current) {
      stopDirectVoiceSession();
      toast.info("🎙️ Mic stopped.", { toastId: "voice-stopped", autoClose: 1500 });
    } else {
      sessionPrefixRef.current = "";
      lastRecognizedRef.current = "";
      startDirectVoiceSession(voiceLang);
    }
  };

  const handleToggleLang = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const next = voiceLang === "en-IN" ? "hi-IN" : "en-IN";
    setVoiceLang(next);
    toast.info(
      next === "hi-IN"
        ? "🇮🇳 Voice set to हिन्दी (Hindi)"
        : "🌐 Voice set to English (India)",
      { toastId: "voice-lang-switch", autoClose: 1500 }
    );
    if (isDirectListeningRef.current) {
      if (lastRecognizedRef.current) {
        sessionPrefixRef.current = lastRecognizedRef.current;
      }
      stopDirectVoiceSession();
      setTimeout(() => {
        startDirectVoiceSession(next);
      }, 100);
    }
  };

  const handleVoiceModalApply = (spokenText) => {
    if (!spokenText) return;
    const clean = spokenText.trim().replace(/[.,!?;]+$/, "");
    onChange?.(clean);

    // Only auto-fill if exact match
    const cleanLower = clean.toLowerCase();
    const exactMatch = allClientsPool.find(
      (c) => (c.companyName || "").toLowerCase() === cleanLower
    );
    if (exactMatch) {
      onSelectClient?.(exactMatch);
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  // Combine savedClients + recordsClients + seed into a unified pool without duplicates
  const allClientsPool = useMemo(() => {
    const map = new Map();

    // 1. First add from savedClients (includes seeds and user saved)
    savedClients.forEach((c) => {
      if (c && c.companyName) {
        map.set(c.companyName.trim().toLowerCase(), {
          ...c,
          badge: c.source === "saved" ? "⭐ Saved" : "📁 ARCL Client",
        });
      }
    });

    // 2. Add from recordsClients passed from DB records
    if (Array.isArray(recordsClients)) {
      recordsClients.forEach((rc) => {
        if (!rc) return;
        const name = typeof rc === "string" ? rc : rc.companyName || rc.clientCompany;
        if (!name) return;
        const key = name.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            companyName: name.trim(),
            gstin: rc.gstin || rc.clientGstin || "",
            address: rc.address || rc.clientAddress || "",
            cityStatePin: rc.cityStatePin || rc.placeOfSupply || "",
            phone: rc.phone || rc.clientPhone || "",
            email: rc.email || rc.clientEmail || "",
            badge: "📋 Past Record",
          });
        }
      });
    }

    return Array.from(map.values());
  }, [savedClients, recordsClients]);

  // Filter suggestions based on typed query (even 1 letter)
  const filteredSuggestions = useMemo(() => {
    const q = String(value || "").trim().toLowerCase();
    if (!q) {
      // If empty but open, return recent top 6 clients
      return allClientsPool.slice(0, 6);
    }

    const exact = [];
    const startsWith = [];
    const wordStarts = [];
    const contains = [];

    allClientsPool.forEach((item) => {
      const name = item.companyName.toLowerCase();
      if (name === q) {
        exact.push(item);
      } else if (name.startsWith(q)) {
        startsWith.push(item);
      } else if (name.split(/\s+/).some((w) => w.startsWith(q))) {
        wordStarts.push(item);
      } else if (name.includes(q)) {
        contains.push(item);
      }
    });

    return [...exact, ...startsWith, ...wordStarts, ...contains].slice(0, 10);
  }, [value, allClientsPool]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (client) => {
    onChange?.(client.companyName);
    onSelectClient?.(client);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleDeleteSaved = (e, companyName) => {
    e.stopPropagation();
    deleteSavedQuotationClient(companyName);
    setSavedClients((prev) =>
      prev.filter((c) => c.companyName.toLowerCase() !== companyName.toLowerCase())
    );
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSelect(filteredSuggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange?.(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={`w-full pr-24 pl-3 py-1.5 text-xs font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
            isDirectListening ? "ring-2 ring-rose-400 border-rose-500" : ""
          } ${className}`}
          style={{
            backgroundColor: "#eff6ff",
            color: "#1e3a8a",
            borderColor: isDirectListening ? "#ef4444" : isOpen ? "#3b82f6" : "#bfdbfe",
          }}
        />

        {/* Action Buttons: Clear & Voice Dictation */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange?.("");
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              title="Clear input"
            >
              <FaTimes className="text-[10px]" />
            </button>
          )}

          {/* Voice Language Toggle */}
          <button
            type="button"
            onClick={handleToggleLang}
            className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer flex items-center gap-0.5 border border-slate-300"
            title="Switch voice language: English (en-IN) / Hindi (hi-IN)"
          >
            {voiceLang === "hi-IN" ? "🇮🇳 हिन्दी" : "🌐 EN"}
          </button>

          {/* Direct Voice Speech-to-Text Button (YouTube & Google Search Model) */}
          <button
            type="button"
            onClick={toggleDirectVoice}
            disabled={disabled}
            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-xs active:scale-95 ${
              isDirectListening
                ? "bg-rose-600 text-white animate-pulse ring-2 ring-rose-300"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            }`}
            title={
              isDirectListening
                ? "Listening... Tap to stop"
                : "Speak to type directly (YouTube/Google Model)"
            }
          >
            <FaMicrophone className="text-xs" />
          </button>

          {/* Open Google Voice Dialog Modal */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsVoiceModalOpen(true);
            }}
            disabled={disabled}
            className="p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700"
            title="Open Google/YouTube Voice Assistant Dialog"
          >
            <FaExpand className="text-[10px]" />
          </button>
        </div>
      </div>

      {/* 1-Tap Quick Fill Client Pills */}
      {allClientsPool.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
          <span className="text-[10px] font-black text-slate-700 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <FaStar className="text-amber-500 text-[11px]" /> 1-Tap Quick Fill:
          </span>
          {allClientsPool.slice(0, 8).map((c, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange?.(c.companyName);
                onSelectClient?.(c);
                setIsOpen(false);
                toast.success(`✅ Filled: ${c.companyName}`, { autoClose: 2000 });
              }}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 hover:border-blue-600 cursor-pointer transition shadow-2xs active:scale-95 flex items-center gap-1"
              title={`1-Click auto-fill ${c.companyName} (${c.gstin || "No GST"})`}
            >
              <FaBuilding className="text-blue-600 text-[8.5px] shrink-0" />
              <span className="max-w-[150px] truncate">
                {c.companyName}
              </span>
              <span className="text-blue-500 font-black">↵</span>
            </button>
          ))}
        </div>
      )}

      {/* Voice Status Pill */}
      {isDirectListening && (
        <div className="absolute z-30 left-0 -top-7 px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full shadow-md flex items-center gap-1.5 animate-pulse max-w-full">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
          <span className="shrink-0">
            {voiceStatus === "speech"
              ? "🗣️ Bolte rahein, type ho raha hai..."
              : voiceStatus === "sound"
              ? "🔊 Aawaz detect ho rahi hai..."
              : `🎙️ Mic On (${voiceLang === "hi-IN" ? "हिन्दी" : "English"}): Bolna shuru karein...`}
          </span>
          <button
            type="button"
            onClick={handleToggleLang}
            className="ml-1 px-1.5 py-0.2 bg-white/20 hover:bg-white/30 rounded text-[9px] font-bold cursor-pointer"
            title="Switch Language"
          >
            {voiceLang === "hi-IN" ? "EN" : "हिन्दी"}
          </button>
        </div>
      )}

      {/* Auto Suggestions Dropdown (Shows on 1 letter typed or focus) */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-blue-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-fadeIn"
          style={{ minWidth: "280px" }}
        >
          <div className="p-1.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FaBuilding className="text-blue-600" /> Auto Suggestions ({filteredSuggestions.length})
            </span>
            <span className="text-[9px] text-slate-400">Click to auto-fill address &amp; GSTIN</span>
          </div>

          {filteredSuggestions.map((client, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={idx}
                onMouseDown={() => handleSelect(client)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`p-2.5 transition cursor-pointer flex items-start justify-between gap-2 ${
                  isHighlighted ? "bg-blue-50 text-blue-900" : "hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-slate-900">
                      {client.companyName}
                    </span>
                    {client.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        {client.badge}
                      </span>
                    )}
                  </div>

                  {/* GSTIN & Address preview */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                    {client.gstin && (
                      <span className="font-mono text-emerald-700 font-bold flex items-center gap-0.5">
                        <FaIdCard className="text-[9px]" /> {client.gstin}
                      </span>
                    )}
                    {client.cityStatePin && (
                      <span className="truncate flex items-center gap-0.5">
                        <FaMapMarkerAlt className="text-[9px] text-rose-500" /> {client.cityStatePin}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  {client.source === "saved" && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSaved(e, client.companyName)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Remove from saved suggestions"
                    >
                      <FaTrashAlt className="text-[10px]" />
                    </button>
                  )}
                  <span className="p-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                    Select ↵
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Google / YouTube Style Voice Dictation Modal */}
      <GoogleVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApply={handleVoiceModalApply}
        title="Google / YouTube Voice Dictation"
        fieldName="Client Company Name"
        initialText={value}
        placeholder="Bolna shuru karein (e.g. Ahluwalia Contracts, Larsen & Toubro)..."
        defaultLang={voiceLang}
        quickSuggestions={allClientsPool}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FaBuilding,
  FaMicrophone,
  FaMicrophoneSlash,
  FaCheck,
  FaMapMarkerAlt,
  FaIdCard,
  FaTrashAlt,
  FaTimes,
  FaStar,
} from "react-icons/fa";
import useVoiceInput from "../../hooks/useVoiceInput.js";
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
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const directRecRef = useRef(null);
  const isDirectListeningRef = useRef(false);

  // Load saved clients from localStorage on mount and when modal opens
  useEffect(() => {
    setSavedClients(getSavedQuotationClients());
  }, []);

  // Direct Inline Voice Dictation (Google Search & YouTube Model)
  const toggleDirectVoice = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (isDirectListeningRef.current) {
      isDirectListeningRef.current = false;
      setIsDirectListening(false);
      if (directRecRef.current) {
        try {
          directRecRef.current.onend = null;
          directRecRef.current.onerror = null;
          directRecRef.current.stop();
        } catch {
          // ignore
        }
        directRecRef.current = null;
      }
      toast.info("🎙️ Mic stopped.", { toastId: "voice-stopped", autoClose: 1500 });
      return;
    }

    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      toast.warn("🎙️ Voice typing Google Chrome ya Microsoft Edge me chalti hai.");
      return;
    }

    try {
      if (directRecRef.current) {
        try {
          directRecRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRec();
      directRecRef.current = recognition;
      recognition.lang = voiceLang || "en-IN";
      recognition.interimResults = true;
      recognition.continuous = false; // Fast single-session streaming with auto-restart on pause

      recognition.onstart = () => {
        isDirectListeningRef.current = true;
        setIsDirectListening(true);
        setIsOpen(true);
        toast.info("🎙️ Mic On: Bolna shuru karein...", {
          toastId: "voice-live-direct",
          autoClose: 2000,
        });
      };

      recognition.onresult = (event) => {
        if (!event || !event.results) return;

        const liveText = Array.from(event.results)
          .map((r) => (r && r[0] ? r[0].transcript : ""))
          .join("");

        const clean = liveText.trim().replace(/[.,!?;]+$/, "");
        if (clean) {
          onChange?.(clean);
          setIsOpen(true);
          toast.success(`🗣️ Suna: "${clean}"`, { toastId: "live-heard", autoClose: 1500 });

          const last = event.results[event.results.length - 1];
          if (last?.isFinal) {
            const cleanLower = clean.toLowerCase();
            const cleanWords = cleanLower.split(/\s+/).filter(Boolean);
            const match = allClientsPool.find((c) => {
              const compLower = c.companyName.toLowerCase();
              if (
                compLower === cleanLower ||
                compLower.includes(cleanLower) ||
                cleanLower.includes(compLower)
              ) {
                return true;
              }
              return cleanWords.some((w) => w.length >= 3 && compLower.includes(w));
            });
            if (match) {
              onSelectClient?.(match);
              setIsOpen(false);
              toast.success(`✅ Selected: ${match.companyName}`, {
                toastId: "client-match",
                autoClose: 2500,
              });
            }
          }
        }
      };

      recognition.onerror = (event) => {
        const err = event?.error || "unknown";
        if (err === "no-speech") {
          // Normal pause, keep listening alive
          return;
        }
        if (err === "aborted") return;

        console.warn("Direct voice recognition error:", err);
        if (err === "not-allowed" || err === "service-not-allowed") {
          isDirectListeningRef.current = false;
          setIsDirectListening(false);
          toast.error("🎙️ Mic blocked! Browser URL bar ke paas 🔒 Lock icon se allow karein.", { autoClose: 7000 });
        } else if (err === "network") {
          toast.warn("🎙️ Network notice: Google speech servers reconnecting...", { toastId: "voice-net-retry", autoClose: 2500 });
        } else {
          toast.warn(`🎙️ Speech notice: ${err}`, { toastId: "voice-err-notice", autoClose: 3000 });
        }
      };

      recognition.onend = () => {
        // Auto-restart if user is still dictating so pauses don't abort
        if (isDirectListeningRef.current) {
          try {
            recognition.start();
          } catch {
            setTimeout(() => {
              if (isDirectListeningRef.current) {
                try {
                  recognition.start();
                } catch {
                  // ignore
                }
              }
            }, 100);
          }
        } else {
          setIsDirectListening(false);
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
    }
  };

  // Voice Input Hook
  const voice = useVoiceInput({
    lang: voiceLang,
    continuous: true,
    interimResults: true,
    onResult: (spokenText) => {
      if (!spokenText) return;
      const clean = spokenText.trim().replace(/[.,!?;]+$/, "");
      onChange?.(clean);
      setIsOpen(true);
    },
    onFinal: (finalText) => {
      if (!finalText) return;
      const clean = finalText.trim().replace(/[.,!?;]+$/, "");
      onChange?.(clean);

      // Check if the spoken text matches an existing client
      const cleanLower = clean.toLowerCase();
      const match = allClientsPool.find(
        (c) =>
          c.companyName.toLowerCase() === cleanLower ||
          c.companyName.toLowerCase().includes(cleanLower) ||
          cleanLower.includes(c.companyName.toLowerCase())
      );
      if (match) {
        onSelectClient?.(match);
        setIsOpen(false);
      }
    },
  });

  const handleVoiceModalApply = (spokenText) => {
    if (!spokenText) return;
    const clean = spokenText.trim().replace(/[.,!?;]+$/, "");
    onChange?.(clean);

    // Check if the spoken text matches an existing client
    const cleanLower = clean.toLowerCase();
    const cleanWords = cleanLower.split(/\s+/).filter(Boolean);
    const match = allClientsPool.find((c) => {
      const compLower = c.companyName.toLowerCase();
      if (
        compLower === cleanLower ||
        compLower.includes(cleanLower) ||
        cleanLower.includes(compLower)
      ) {
        return true;
      }
      return cleanWords.some((w) => w.length >= 3 && compLower.includes(w));
    });
    if (match) {
      onSelectClient?.(match);
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const next = voiceLang === "en-IN" ? "hi-IN" : "en-IN";
              setVoiceLang(next);
            }}
            className="px-1 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            title="Switch voice language: English (en-IN) / Hindi (hi-IN)"
          >
            {voiceLang === "hi-IN" ? "🇮🇳 HI" : "🇮🇳 EN"}
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
        </div>
      </div>

      {/* 1-Tap Quick Fill Client Pills */}
      {allClientsPool.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[9px] font-bold text-slate-500">Quick 1-Tap:</span>
          {allClientsPool.slice(0, 4).map((c, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange?.(c.companyName);
                onSelectClient?.(c);
                setIsOpen(false);
                toast.success(`✅ Filled: ${c.companyName}`);
              }}
              className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer transition shadow-2xs active:scale-95 flex items-center gap-1"
              title={`1-Click auto-fill ${c.companyName}`}
            >
              <span>⭐</span>
              <span className="max-w-[130px] truncate">
                {c.companyName.split(" ")[0]} {c.companyName.split(" ")[1] || ""}
              </span>
              <span className="text-blue-500 font-bold">↵</span>
            </button>
          ))}
        </div>
      )}

      {/* Voice Status Pill */}
      {isDirectListening && (
        <div className="absolute z-30 left-0 -top-7 px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full shadow-md flex items-center gap-1.5 animate-pulse max-w-full truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
          <span className="shrink-0">
            🎙️ Listening ({voiceLang === "hi-IN" ? "Hindi" : "English"}): Bolna shuru karein...
          </span>
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

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FaTools,
  FaMicrophone,
  FaTimes,
  FaTag,
} from "react-icons/fa";
import useVoiceInput from "../../hooks/useVoiceInput.js";
import GoogleVoiceModal from "../common/GoogleVoiceModal.jsx";
import { getSavedQuotationItems } from "../../utils/quotationStorage.js";

export default function QuotationItemAutocomplete({
  value = "",
  onChange,
  onSelectItem,
  suggestions = [],
  placeholder = "e.g. Compression Testing Machine 2000kN - Calibration",
  className = "",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [savedCustomItems, setSavedCustomItems] = useState([]);
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isDirectListening, setIsDirectListening] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const directRecRef = useRef(null);
  const isDirectListeningRef = useRef(false);

  useEffect(() => {
    setSavedCustomItems(getSavedQuotationItems());
  }, []);

  // Direct Inline Speech Recognition (YouTube / Google Search Model)
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
      toast.info("🎙️ Mic stopped.", { toastId: "voice-stopped-item", autoClose: 1500 });
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
          toastId: "voice-item-direct",
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
          toast.success(`🗣️ Suna: "${clean}"`, { toastId: "live-heard-item", autoClose: 1500 });

          const last = event.results[event.results.length - 1];
          if (last?.isFinal) {
            const cleanLower = clean.toLowerCase();
            const cleanWords = cleanLower.split(/\s+/).filter(Boolean);
            const match = allItemsPool.find((it) => {
              const itLower = it.name.toLowerCase();
              if (
                itLower === cleanLower ||
                itLower.includes(cleanLower) ||
                cleanLower.includes(itLower)
              ) {
                return true;
              }
              return cleanWords.some((w) => w.length >= 4 && itLower.includes(w));
            });
            if (match) {
              onSelectItem?.(match);
              setIsOpen(false);
              toast.success(`✅ Item selected: ${match.name}`, {
                toastId: "item-match",
                autoClose: 2500,
              });
            }
          }
        }
      };

      recognition.onerror = (event) => {
        const err = event?.error || "unknown";
        if (err === "no-speech") return;
        if (err === "aborted") return;

        console.warn("Direct voice item error:", err);
        if (err === "not-allowed" || err === "service-not-allowed") {
          isDirectListeningRef.current = false;
          setIsDirectListening(false);
          toast.error("🎙️ Mic blocked! Browser URL bar ke paas 🔒 Lock icon se allow karein.", { autoClose: 7000 });
        } else if (err === "network") {
          toast.warn("🎙️ Network notice: Google speech servers reconnecting...", { toastId: "item-net-retry", autoClose: 2500 });
        } else {
          toast.warn(`🎙️ Speech notice: ${err}`, { toastId: "item-err-notice", autoClose: 3000 });
        }
      };

      recognition.onend = () => {
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
      console.error("Direct voice item start error:", err);
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

      const cleanLower = clean.toLowerCase();
      const match = allItemsPool.find(
        (it) =>
          it.name.toLowerCase() === cleanLower ||
          it.name.toLowerCase().includes(cleanLower) ||
          cleanLower.includes(it.name.toLowerCase())
      );
      if (match) {
        onSelectItem?.(match);
        setIsOpen(false);
      }
    },
  });

  const handleVoiceModalApply = (spokenText) => {
    if (!spokenText) return;
    const clean = spokenText.trim().replace(/[.,!?;]+$/, "");
    onChange?.(clean);

    const cleanLower = clean.toLowerCase();
    const cleanWords = cleanLower.split(/\s+/).filter(Boolean);
    const match = allItemsPool.find((it) => {
      const itLower = it.name.toLowerCase();
      if (
        itLower === cleanLower ||
        itLower.includes(cleanLower) ||
        cleanLower.includes(itLower)
      ) {
        return true;
      }
      return cleanWords.some((w) => w.length >= 4 && itLower.includes(w));
    });
    if (match) {
      onSelectItem?.(match);
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  // Combine suggestions pool
  const allItemsPool = useMemo(() => {
    const map = new Map();

    // 1. Saved custom items
    savedCustomItems.forEach((it) => {
      if (it && it.name) {
        map.set(it.name.trim().toLowerCase(), {
          name: it.name.trim(),
          subText: it.subText || "NABL Certificate",
          rate: Number(it.rate) || 500,
          hsnSac: it.hsnSac || "998346",
          badge: "⭐ Saved",
        });
      }
    });

    // 2. Passed suggestions (from unifiedEquipmentSuggestions or defaultStandard37Items)
    if (Array.isArray(suggestions)) {
      suggestions.forEach((it) => {
        if (!it) return;
        const name = typeof it === "string" ? it : it.name || it.instrument;
        if (!name) return;
        const key = name.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            name: name.trim(),
            subText: it.subText || "NABL Certificate",
            rate: Number(it.rate) || 500,
            hsnSac: it.hsnSac || "998346",
            badge: it.badge || "Standard",
          });
        }
      });
    }

    return Array.from(map.values());
  }, [savedCustomItems, suggestions]);

  // Filter suggestions on 1+ characters
  const filtered = useMemo(() => {
    const q = String(value || "").trim().toLowerCase();
    if (!q) return allItemsPool.slice(0, 8);

    const exact = [];
    const startsWith = [];
    const wordStarts = [];
    const contains = [];

    allItemsPool.forEach((item) => {
      const name = item.name.toLowerCase();
      if (name === q) exact.push(item);
      else if (name.startsWith(q)) startsWith.push(item);
      else if (name.split(/\s+/).some((w) => w.startsWith(q))) wordStarts.push(item);
      else if (name.includes(q)) contains.push(item);
    });

    return [...exact, ...startsWith, ...wordStarts, ...contains].slice(0, 10);
  }, [value, allItemsPool]);

  // Click outside to close
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

  const handleSelect = (item) => {
    onChange?.(item.name);
    onSelectItem?.(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") setIsOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        e.preventDefault();
        handleSelect(filtered[highlightedIndex]);
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
          placeholder={placeholder}
          className={`w-full pr-20 pl-2 py-1 text-[11px] font-bold border rounded focus:outline-none focus:border-blue-500 transition ${
            isDirectListening ? "ring-2 ring-rose-400 border-rose-500" : ""
          } ${className}`}
          style={{
            backgroundColor: "#ffffff",
            color: "#0f172a",
            borderColor: isDirectListening ? "#ef4444" : isOpen ? "#3b82f6" : "#e2e8f0",
          }}
        />

        {/* Action Buttons: Clear & Voice */}
        <div className="absolute right-1 flex items-center gap-0.5">
          {value && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange?.("");
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              title="Clear"
            >
              <FaTimes className="text-[9px]" />
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
            className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            title="Switch voice language: English (en-IN) / Hindi (hi-IN)"
          >
            {voiceLang === "hi-IN" ? "HI" : "EN"}
          </button>

          {/* Direct Speech-to-Text Button (YouTube & Google Search Model) */}
          <button
            type="button"
            onClick={toggleDirectVoice}
            disabled={disabled}
            className={`p-1 rounded text-[10px] font-bold transition flex items-center justify-center cursor-pointer shadow-xs active:scale-95 ${
              isDirectListening
                ? "bg-rose-600 text-white animate-pulse ring-2 ring-rose-300"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            }`}
            title={
              isDirectListening
                ? "Listening... Tap to stop"
                : "Speak to type directly into field"
            }
          >
            <FaMicrophone className="text-[10px]" />
          </button>
        </div>
      </div>

      {/* Voice Status Pill */}
      {isDirectListening && (
        <div className="absolute z-30 left-0 -top-6 px-2 py-0.5 bg-rose-600 text-white text-[9px] font-bold rounded shadow-md animate-pulse flex items-center gap-1 max-w-full truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
          <span className="shrink-0">
            🎙️ Listening ({voiceLang === "hi-IN" ? "Hindi" : "English"}): Bolna shuru karein...
          </span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-blue-200 rounded-lg shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100 animate-fadeIn min-w-[240px]">
          <div className="p-1 bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FaTools className="text-blue-600" /> Equipment Suggestions ({filtered.length})
            </span>
          </div>

          {filtered.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={idx}
                onMouseDown={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`p-2 transition cursor-pointer flex items-center justify-between gap-2 text-left ${
                  isHighlighted ? "bg-blue-50 text-blue-900" : "hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[11px] text-slate-900 truncate">
                    {item.name}
                  </div>
                  {item.subText && (
                    <div className="text-[9.5px] text-slate-500 truncate">
                      {item.subText}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.rate && (
                    <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ₹{item.rate}
                    </span>
                  )}
                  <span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-blue-100 text-blue-700">
                    ↵
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
        fieldName="Equipment / Item Name"
        initialText={value}
        placeholder="Bolna shuru karein (e.g. Compression Testing Machine 2000kN, Digital Micrometer)..."
        defaultLang={voiceLang}
        quickSuggestions={allItemsPool}
      />
    </div>
  );
}

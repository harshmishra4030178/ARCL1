"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FaSearch,
  FaTimes,
  FaCheck,
  FaTools,
  FaHistory,
  FaCube,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVolumeUp,
  FaKeyboard,
} from "react-icons/fa";
import useVoiceInput from "../../../hooks/useVoiceInput.js";

export default function EquipmentAutocompleteInput({
  value = "",
  onChange,
  onSelectEquipment,
  suggestions = [],
  placeholder = "e.g. Compression Testing Machine 2000 kN / Vernier Caliper",
  required = false,
  className = "",
  disabled = false,
  id,
  name,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter & rank suggestions based on current value
  const filteredSuggestions = useMemo(() => {
    const query = String(value || "").trim().toLowerCase();
    if (!suggestions || suggestions.length === 0) return [];

    if (!query) {
      // Return ALL suggestions so user can freely scroll through the entire equipment catalog
      return suggestions;
    }

    const exactMatches = [];
    const startsWithMatches = [];
    const wordStartsMatches = [];
    const substringMatches = [];

    suggestions.forEach((item) => {
      const nameLower = (item.name || "").toLowerCase();
      if (nameLower === query) {
        exactMatches.push(item);
      } else if (nameLower.startsWith(query)) {
        startsWithMatches.push(item);
      } else if (nameLower.split(/\s+/).some((w) => w.startsWith(query))) {
        wordStartsMatches.push(item);
      } else if (nameLower.includes(query)) {
        substringMatches.push(item);
      }
    });

    const combined = [
      ...exactMatches,
      ...startsWithMatches,
      ...wordStartsMatches,
      ...substringMatches,
    ];

    // If typed query is not an exact match, offer it as a 1st-class Custom item
    if (query.length >= 2 && !exactMatches.length && !suggestions.some((s) => (s.name || "").toLowerCase() === query)) {
      combined.unshift({
        id: `custom_${query.replace(/[^a-z0-9]/g, "_")}`,
        name: String(value).trim(),
        category: "Custom Input",
        discipline: "User Defined",
        defaultMake: "ARCL",
        defaultModel: "",
        defaultRange: "",
        source: "recent",
        sourceLabel: "⭐ Custom (New)",
        badgeColor: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
      });
    }

    return combined;
  }, [value, suggestions]);

  // Voice Recognition Hook Setup
  const {
    isListening,
    isSupported,
    statusText,
    toggleListening,
    stopListening,
  } = useVoiceInput({
    lang: "en-IN",
    interimResults: true,
    continuous: false,
    onResult: (spokenText) => {
      if (spokenText) {
        if (onChange) onChange(spokenText);
        setIsOpen(true);
        setHighlightedIndex(0);
      }
    },
    onFinal: (finalSpokenText) => {
      if (finalSpokenText && suggestions && suggestions.length > 0) {
        const lower = finalSpokenText.toLowerCase().trim();
        // Check if there is an exact or starting match to auto-highlight
        const exactMatch = suggestions.find(
          (s) => (s.name || "").toLowerCase().trim() === lower
        );
        if (exactMatch && onSelectEquipment) {
          // Keep highlighted on top match
          setHighlightedIndex(0);
        }
      }
    },
  });

  // Scroll active item into view
  useEffect(() => {
    if (
      isOpen &&
      highlightedIndex >= 0 &&
      dropdownRef.current &&
      dropdownRef.current.children[highlightedIndex]
    ) {
      dropdownRef.current.children[highlightedIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex, isOpen]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (onChange) onChange(val);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleSelect = (item) => {
    if (!item) return;
    if (onChange) onChange(item.name);
    if (onSelectEquipment) onSelectEquipment(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (isListening) stopListening();
    if (inputRef.current) inputRef.current.focus();
  };

  const handleClear = () => {
    if (onChange) onChange("");
    setIsOpen(true);
    setHighlightedIndex(-1);
    if (isListening) stopListening();
    if (inputRef.current) inputRef.current.focus();
  };

  const handleVoiceButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    toggleListening();
    if (!isListening) {
      setIsOpen(true);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        e.preventDefault();
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
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        e.preventDefault();
        e.stopPropagation();
        handleSelect(filteredSuggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === "Tab") {
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        handleSelect(filteredSuggestions[highlightedIndex]);
      } else {
        setIsOpen(false);
      }
    }
  };

  // Helper to highlight matched query letters
  const renderHighlightedName = (name) => {
    const query = String(value || "").trim();
    if (!query) return <span>{name}</span>;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = name.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-amber-200 text-amber-950 font-black px-0.5 rounded">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field Container */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value || ""}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={
            className ||
            "w-full p-2 bg-gray-50/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900 pr-16"
          }
        />

        {/* Right Adornment Action Buttons */}
        <div className="absolute right-2 flex items-center gap-1">
          {/* Clear Button */}
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition cursor-pointer text-xs"
              title="Clear text"
            >
              <FaTimes />
            </button>
          ) : null}

          {/* Voice Search / Fill Button */}
          <button
            type="button"
            onClick={handleVoiceButtonClick}
            disabled={disabled}
            className={`p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
              isListening
                ? "bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/50 ring-2 ring-rose-300 scale-105"
                : "text-blue-600 hover:text-blue-800 hover:bg-blue-100/70 bg-blue-50/60 active:scale-95 border border-blue-200/60"
            }`}
            title={
              isListening
                ? "🎙️ Active listening... Click to stop"
                : isSupported
                ? "🎙️ Click to Speak & Search / Fill Equipment Name by Voice"
                : "Voice recognition not supported in this browser"
            }
          >
            {isListening ? (
              <FaMicrophone className="text-xs animate-bounce" />
            ) : isSupported ? (
              <FaMicrophone className="text-xs" />
            ) : (
              <FaMicrophoneSlash className="text-xs text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Voice Status Alert / Live Listening Banner */}
      {statusText && (
        <div
          className={`mt-1 text-[11px] px-2.5 py-1 rounded-xl flex items-center justify-between gap-1.5 transition-all duration-300 animate-fadeIn ${
            isListening
              ? "bg-rose-50 text-rose-800 border border-rose-300 shadow-xs font-semibold"
              : "bg-blue-50 text-blue-800 border border-blue-200 font-medium"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {isListening ? (
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
            ) : (
              <FaVolumeUp className="text-[11px] text-blue-600 shrink-0" />
            )}
            <span className="truncate">{statusText}</span>
          </div>
          {isListening && (
            <button
              type="button"
              onClick={() => stopListening()}
              className="text-[10px] px-2 py-0.5 bg-rose-200/80 hover:bg-rose-300 text-rose-950 font-bold rounded-lg cursor-pointer transition shrink-0"
            >
              Done / Stop
            </button>
          )}
        </div>
      )}

      {/* Auto-Suggestion Dropdown Popup */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn backdrop-blur-xs max-h-96 flex flex-col">
          {/* Header Bar */}
          <div className="px-3 py-2 bg-gradient-to-r from-slate-100 via-blue-50/80 to-indigo-50/60 border-b border-gray-200 flex items-center justify-between text-[11px] text-gray-700 font-bold select-none">
            <div className="flex items-center gap-1.5">
              <FaTools className="text-blue-600 text-xs" />
              <span>
                {filteredSuggestions.length} Equipment{filteredSuggestions.length !== 1 ? "s" : ""} Available
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-blue-700 font-bold">
              <FaMicrophone className="text-[10px] text-rose-500 animate-pulse" />
              <span>Voice &amp; Keyboard Enabled</span>
            </div>
          </div>

          {/* List of Suggestions */}
          <div
            ref={dropdownRef}
            className="overflow-y-auto max-h-80 p-1 space-y-0.5 divide-y divide-gray-100/60"
          >
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((item, idx) => {
                const isSelected = item.name.toLowerCase() === String(value || "").trim().toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={item.id || item.name + idx}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur
                      handleSelect(item);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 rounded-xl cursor-pointer transition flex items-center justify-between gap-2 text-xs ${
                      isHighlighted
                        ? "bg-blue-600 text-white shadow-xs"
                        : isSelected
                        ? "bg-blue-50 text-blue-900 font-bold"
                        : "text-gray-800 hover:bg-blue-50/70"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      {/* Name with matched highlights */}
                      <div className="flex items-center gap-1.5 font-bold truncate">
                        {item.source === "recent" ? (
                          <FaHistory className={`text-[11px] shrink-0 ${isHighlighted ? "text-amber-300" : "text-amber-500"}`} />
                        ) : item.source === "product" ? (
                          <FaCube className={`text-[11px] shrink-0 ${isHighlighted ? "text-purple-300" : "text-purple-500"}`} />
                        ) : (
                          <FaTools className={`text-[11px] shrink-0 ${isHighlighted ? "text-emerald-300" : "text-emerald-600"}`} />
                        )}
                        <span className="truncate">{renderHighlightedName(item.name)}</span>
                      </div>

                      {/* Subtitle / Defaults */}
                      <div
                        className={`text-[10px] mt-0.5 flex flex-wrap items-center gap-2 ${
                          isHighlighted ? "text-blue-100" : "text-gray-600"
                        }`}
                      >
                        {item.defaultRange && (
                          <span>Range: <strong className={isHighlighted ? "text-white font-mono" : "text-gray-800 font-mono"}>{item.defaultRange}</strong></span>
                        )}
                        {item.defaultMake && (
                          <span>Make: <strong>{item.defaultMake}</strong></span>
                        )}
                        {item.discipline && (
                          <span className="truncate max-w-[120px]">{item.discipline}</span>
                        )}
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black border font-mono ${
                          isHighlighted
                            ? "bg-white/20 text-white border-white/30"
                            : item.badgeColor || "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {item.sourceLabel || "Catalog"}
                      </span>
                      {isSelected && (
                        <FaCheck className={isHighlighted ? "text-white text-xs" : "text-blue-600 text-xs"} />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-gray-500">
                <p className="font-semibold text-gray-700">No exact equipment matched &quot;{value}&quot;</p>
                <p className="text-[11px] text-gray-600 mt-1">
                  You can still use this custom name! It will be automatically saved in SRF for future auto-suggestions.
                </p>
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="p-1.5 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-600 flex items-center justify-between px-3">
            <span>Use ↑ ↓ arrows to navigate, Enter to select</span>
            <span className="font-mono text-blue-600 font-bold">ARCL Calibration Portal</span>
          </div>
        </div>
      )}
    </div>
  );
}

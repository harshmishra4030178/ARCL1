"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  X,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Package,
  Layers,
  Mic,
  MicOff,
  Volume2,
  TrendingUp,
} from "lucide-react";
import { Link, useNavigate } from "../../utils/navigation.jsx";
import { useCategoryStore } from "../../store/useCategoryStore.js";
import { useProductStore } from "../../store/useProductStore.js";
import { useEquipmentTypeStore } from "../../store/useEquipmentTypeStore.js";
import { fuzzyMatch } from "../../utils/fuzzySearch.js";
import { formatTitleCase } from "../../utils/stringUtils.js";
import { toast } from "react-toastify";

const POPULAR_SEARCHES = [
  "Compression Testing Machine",
  "Soil Testing",
  "Concrete Testing",
  "Aggregate Testing",
  "Vicat Apparatus",
  "Direct Shear Apparatus",
  "Core Cutting Machine",
  "Marshall Stability",
  "Liquid Limit Device",
  "Hot Air Oven",
];

const AmazonSearchBar = ({ isMobile = false }) => {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const { categories = [], fetchCategories } = useCategoryStore();
  const { products = [], fetchProducts } = useProductStore();
  const { equipmentTypes = [], fetchEquipmentTypes } = useEquipmentTypeStore();

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!categories.length) fetchCategories();
    if (!products.length) fetchProducts();
    if (!equipmentTypes.length) fetchEquipmentTypes();
  }, []);

  // Handle outside clicks to close suggestion box
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Voice Search via Web Speech API
  const toggleVoiceSearch = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.info("Voice search is supported in Google Chrome, Edge, and Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = "en-IN";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setIsOpen(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setQuery(transcript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start voice recognition:", err);
      setIsListening(false);
    }
  };

  // Typo-tolerant Filtered Data (Equipment Types, Categories, Products)
  const filteredData = useMemo(() => {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) {
      return { matchingEquipmentTypes: [], matchingCategories: [], matchingProducts: [] };
    }

    // 1. Matching equipment types (supports typos e.g. "soyl testing" -> "Soil Testing Equipments")
    const matchingEquipmentTypes = equipmentTypes
      .filter((eq) => {
        const name = eq.name || "";
        return name.toLowerCase().includes(cleanQ) || fuzzyMatch(cleanQ, name);
      })
      .slice(0, 3);

    const matchedEqIds = new Set(matchingEquipmentTypes.map((e) => String(e._id)));

    // 2. Matching categories (supports typos & parent equipment types)
    const matchingCategories = categories
      .filter((c) => {
        const catEqId = String(c.equipmentType?._id || c.equipmentType || "");
        const name = c.name || "";
        const eqName = c.equipmentType?.name || "";

        return (
          name.toLowerCase().includes(cleanQ) ||
          eqName.toLowerCase().includes(cleanQ) ||
          matchedEqIds.has(catEqId) ||
          fuzzyMatch(cleanQ, `${name} ${eqName}`)
        );
      })
      .slice(0, 3);

    const matchedCatIds = new Set(matchingCategories.map((c) => String(c._id)));

    // 3. Matching products (supports typos e.g. "compresion" -> "Compression", "sokkiya" -> "Sokkia")
    let prodList = products;
    if (selectedCategory !== "all") {
      prodList = prodList.filter(
        (p) =>
          p.category?._id === selectedCategory ||
          p.category?.slug === selectedCategory ||
          p.category === selectedCategory
      );
    }

    const matchingProducts = prodList
      .filter((p) => {
        const pCatId = String(p.category?._id || p.category || "");
        const pEqName = p.category?.equipmentType?.name || p.equipmentTypeName || "";
        const pCatName = p.category?.name || "";
        const pName = p.name || "";
        const pCode = p.productCode || "";
        const pModel = p.modelNumber || "";

        const searchableText = `${pName} ${pCode} ${pModel} ${pCatName} ${pEqName}`;
        const searchLower = searchableText.toLowerCase();

        return (
          searchLower.includes(cleanQ) ||
          matchedCatIds.has(pCatId) ||
          (p.category?.equipmentType?._id && matchedEqIds.has(String(p.category.equipmentType._id))) ||
          fuzzyMatch(cleanQ, searchableText)
        );
      })
      .slice(0, 6);

    return { matchingEquipmentTypes, matchingCategories, matchingProducts };
  }, [query, selectedCategory, equipmentTypes, categories, products]);

  const allSuggestions = useMemo(() => {
    const list = [];
    filteredData.matchingEquipmentTypes.forEach((eq) => {
      list.push({ type: "equipmentType", data: eq, url: `/products?search=${encodeURIComponent(eq.name)}` });
    });
    filteredData.matchingProducts.forEach((prod) => {
      list.push({ type: "product", data: prod, url: `/products/${prod.slug}` });
    });
    filteredData.matchingCategories.forEach((cat) => {
      list.push({ type: "category", data: cat, url: `/categories/${cat.slug}` });
    });
    return list;
  }, [filteredData]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
      navigate(allSuggestions[selectedIndex].url);
      setIsOpen(false);
      return;
    }

    const trimmed = query.trim();
    setIsOpen(false);
    if (trimmed) {
      const catParam = selectedCategory !== "all" ? `&category=${selectedCategory}` : "";
      navigate(`/products?search=${encodeURIComponent(trimmed)}${catParam}`);
    } else if (selectedCategory !== "all") {
      navigate(`/products?category=${selectedCategory}`);
    } else {
      navigate("/products");
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allSuggestions.length - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={searchRef}
      className={`relative w-full ${isMobile ? "max-w-full" : "max-w-2xl"}`}
    >
      {/* AMAZON SEARCH BAR CONTAINER */}
      <form
        onSubmit={handleSubmit}
        className={`flex items-center w-full h-10 md:h-11 bg-white rounded-xl border ${
          isListening
            ? "border-red-500 ring-3 ring-red-400/30"
            : "border-gray-300 focus-within:border-[#021C57] focus-within:ring-2 focus-within:ring-[#021C57]/20"
        } shadow-xs transition-all overflow-hidden`}
      >
        {/* LEFT: CATEGORY SCOPE SELECTOR */}
        <div className="relative h-full flex items-center bg-gray-100 hover:bg-gray-200 border-r border-gray-300 transition shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              inputRef.current?.focus();
            }}
            className="h-full pl-3 pr-7 bg-transparent text-xs font-semibold text-gray-700 appearance-none cursor-pointer focus:outline-hidden max-w-[110px] sm:max-w-[140px] truncate"
            title="Search Category Scope"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2 text-gray-500 pointer-events-none"
          />
        </div>

        {/* MIDDLE: SEARCH INPUT */}
        <div className="relative flex-1 h-full flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "🎙️ Listening... Speak equipment name now"
                : isMobile
                ? "Search machines (e.g. soil, compression)..."
                : "Search ARCL machines, lab instruments, cement, soil, concrete..."
            }
            className="w-full h-full px-3 text-xs sm:text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-hidden"
            autoComplete="off"
            spellCheck="false"
          />

          {/* CLEAR QUERY BUTTON */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition mr-1 cursor-pointer"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}

          {/* VOICE SEARCH (MIC) BUTTON */}
          <button
            type="button"
            onClick={toggleVoiceSearch}
            className={`p-2 rounded-lg transition mr-1.5 cursor-pointer flex items-center justify-center ${
              isListening
                ? "bg-red-500 text-white animate-pulse shadow-md"
                : "text-gray-500 hover:text-[#021C57] hover:bg-gray-100"
            }`}
            title={isListening ? "Stop listening" : "Search by voice"}
          >
            {isListening ? (
              <MicOff size={16} className="animate-spin" />
            ) : (
              <Mic size={16} />
            )}
          </button>
        </div>

        {/* RIGHT: SEARCH SUBMIT BUTTON */}
        <button
          type="submit"
          className="h-full px-4 sm:px-5 bg-[#021C57] hover:bg-blue-900 text-white transition flex items-center justify-center shrink-0 cursor-pointer"
          title="Search Instruments"
        >
          <Search size={16} className="text-white" />
        </button>
      </form>

      {/* VOICE LISTENING BANNER */}
      {isListening && (
        <div className="absolute top-12 left-0 right-0 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg z-50 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span>Listening to your voice... Speak equipment name (e.g. &ldquo;Compression Machine&rdquo; or &ldquo;Soil Testing&rdquo;)</span>
          </div>
          <button
            type="button"
            onClick={toggleVoiceSearch}
            className="text-xs font-bold underline hover:text-red-900 cursor-pointer"
          >
            Done
          </button>
        </div>
      )}

      {/* AUTOCOMPLETE SUGGESTION DROPDOWN */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[480px] overflow-y-auto">
          {/* 1. DEFAULT POPULAR SUGGESTIONS (WHEN QUERY IS EMPTY) */}
          {!query.trim() && (
            <div className="p-3 sm:p-4 space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <TrendingUp size={14} className="text-blue-600" />
                  <span>Popular Equipment Searches</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCHES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setQuery(item);
                        navigate(`/products?search=${encodeURIComponent(item)}`);
                        setIsOpen(false);
                      }}
                      className="inline-flex items-center gap-1 text-xs bg-gray-50 hover:bg-blue-50 hover:text-[#021C57] text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition font-medium cursor-pointer"
                    >
                      <Sparkles size={12} className="text-amber-500" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* TOP CATEGORIES SHORTCUTS */}
              {categories.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                    <Layers size={14} className="text-blue-600" />
                    <span>Top Categories</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categories.slice(0, 6).map((cat) => (
                      <Link
                        key={cat._id}
                        to={`/categories/${cat.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="text-xs text-gray-700 hover:text-[#021C57] hover:bg-gray-50 p-2 rounded-md transition font-medium truncate flex items-center justify-between group"
                      >
                        <span className="truncate">{cat.name}</span>
                        <ArrowRight
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#021C57] shrink-0"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. MATCHED RESULTS (EQUIPMENT TYPES + PRODUCTS + CATEGORIES) */}
          {query.trim() && (
            <div className="py-2">
              {/* MATCHING EQUIPMENT TYPES */}
              {filteredData.matchingEquipmentTypes?.length > 0 && (
                <div className="px-3 py-2 border-b border-gray-100 bg-blue-50/40">
                  <p className="text-[11px] font-bold text-[#021C57] uppercase tracking-wider mb-1.5 px-2 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-blue-600" /> Equipment Classifications
                  </p>
                  {filteredData.matchingEquipmentTypes.map((eq, eqIdx) => {
                    const isSelected = selectedIndex === eqIdx;
                    return (
                      <Link
                        key={eq._id}
                        to={`/products?search=${encodeURIComponent(eq.name)}`}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                          isSelected
                            ? "bg-blue-100 text-[#021C57] font-semibold"
                            : "text-gray-900 hover:bg-blue-100/60 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers size={15} className="text-[#021C57] shrink-0" />
                          <span>{eq.name}</span>
                        </div>
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Equipment Type
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* MATCHING CATEGORIES */}
              {filteredData.matchingCategories.length > 0 && (
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
                    Categories
                  </p>
                  {filteredData.matchingCategories.map((cat, idx) => {
                    const globalIdx = (filteredData.matchingEquipmentTypes?.length || 0) + idx;
                    const isSelected = selectedIndex === globalIdx;
                    return (
                      <Link
                        key={cat._id}
                        to={`/categories/${cat.slug}`}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                          isSelected
                            ? "bg-blue-50 text-[#021C57] font-semibold"
                            : "text-gray-800 hover:bg-gray-50 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers size={15} className="text-blue-600 shrink-0" />
                          <span>in {cat.name}</span>
                        </div>
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          Category
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* MATCHING PRODUCTS */}
              {filteredData.matchingProducts.length > 0 && (
                <div className="px-3 py-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
                    Testing Instruments & Machines
                  </p>
                  {filteredData.matchingProducts.map((prod, pIdx) => {
                    const globalIdx =
                      (filteredData.matchingEquipmentTypes?.length || 0) +
                      (filteredData.matchingCategories?.length || 0) +
                      pIdx;
                    const isSelected = selectedIndex === globalIdx;
                    const thumb =
                      Array.isArray(prod.images) && prod.images[0]
                        ? prod.images[0]
                        : "/assets/LOGO.png";

                    return (
                      <Link
                        key={prod._id}
                        to={`/products/${prod.slug}`}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition border-b border-gray-50 last:border-0 ${
                          isSelected
                            ? "bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <img
                          src={thumb}
                          alt={prod.name}
                          className="w-10 h-10 object-contain bg-white rounded-md border border-gray-100 p-0.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                            {prod.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                            {prod.category?.name && (
                              <span className="text-blue-700 font-medium truncate">
                                {prod.category.name}
                              </span>
                            )}
                            {prod.productCode && (
                              <span className="font-mono bg-gray-100 px-1.5 py-0.2 rounded text-[10px]">
                                {prod.productCode}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-gray-400 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* NO RESULTS FOUND STATE */}
              {filteredData.matchingEquipmentTypes.length === 0 &&
                filteredData.matchingCategories.length === 0 &&
                filteredData.matchingProducts.length === 0 && (
                  <div className="py-8 px-4 text-center">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      No matching equipment found for &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Try searching with keywords like &ldquo;Compression&rdquo;, &ldquo;Soil&rdquo;, or &ldquo;Concrete&rdquo;.
                    </p>
                  </div>
                )}

              {/* BOTTOM ACTION: SEE ALL RESULTS FOR SEARCH */}
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full mt-2 py-3 px-4 bg-gray-50 hover:bg-[#021C57] hover:text-white text-gray-800 text-xs sm:text-sm font-bold transition flex items-center justify-between border-t border-gray-200 cursor-pointer"
              >
                <span>See all results for &ldquo;{query}&rdquo;</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AmazonSearchBar;

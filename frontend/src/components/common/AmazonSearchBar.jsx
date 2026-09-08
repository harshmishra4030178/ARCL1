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
  TrendingUp,
  ShieldCheck,
  Award,
  Ruler,
  Gauge,
  Scale,
  Thermometer,
  Zap,
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
  "Calibration Services",
  "Concrete Testing",
  "Aggregate Testing",
  "Vernier Caliper Calibration",
  "UTM Calibration",
  "Pressure Gauge Calibration",
  "Vicat Apparatus",
  "Direct Shear Apparatus",
];

const CALIBRATION_DOMAINS = [
  {
    id: "dimensional",
    title: "Dimensional Calibration",
    icon: Ruler,
    instruments: [
      "Vernier Caliper",
      "Digital Caliper",
      "Outside Micrometer",
      "Dial Indicator",
      "Height Gauge",
      "Feeler Gauge",
      "Bore Gauge",
      "Radius Gauge",
      "Protractor",
      "Test Sieves",
      "Steel Scale",
      "Measuring Tape",
      "Cube Mould",
      "Beam Mould",
      "Cylindrical Mould",
    ],
  },
  {
    id: "force",
    title: "Force & Testing Machine Calibration",
    icon: Zap,
    instruments: [
      "Universal Testing Machine (UTM)",
      "Compression Testing Machine (CTM)",
      "CBR Testing Machine",
      "Marshall Testing Machine",
      "Point Load Machine",
      "Direct Shear Machine",
      "Tensile Testing Machine",
      "Load Cell",
      "Force Gauge",
      "Proving Ring",
      "Pull-out Tester",
    ],
  },
  {
    id: "temperature",
    title: "Temperature & Environmental Calibration",
    icon: Thermometer,
    instruments: [
      "Thermometer Calibration",
      "Thermocouple Calibration",
      "RTD Calibration",
      "Temperature Data Logger",
      "Humidity Meter",
      "Environmental Chamber",
      "Oven & Furnace Calibration",
    ],
  },
  {
    id: "pressure",
    title: "Pressure & Vacuum Calibration",
    icon: Gauge,
    instruments: [
      "Pressure Gauge Calibration",
      "Digital Pressure Gauge",
      "Pressure Transmitter",
      "Vacuum Gauge Calibration",
      "Pressure Sensor",
      "Manometer Calibration",
    ],
  },
  {
    id: "mass",
    title: "Mass, Weight & Balance Calibration",
    icon: Scale,
    instruments: [
      "Weighing Balance Calibration",
      "Analytical Balance",
      "Precision Balance",
      "Platform Scale Calibration",
      "Standard Weights",
      "Mass Verification",
    ],
  },
  {
    id: "laboratory",
    title: "Laboratory Analytical Instruments",
    icon: ShieldCheck,
    instruments: [
      "pH Meter Calibration",
      "Conductivity Meter",
      "TDS Meter",
      "Dissolved Oxygen Meter",
      "Laboratory Meters",
    ],
  },
  {
    id: "rpm",
    title: "RPM & Speed Calibration",
    icon: Award,
    instruments: [
      "Digital Tachometer Calibration",
      "Contact Tachometer",
      "Laser Tachometer",
      "RPM Meter",
      "Speed Indicator",
    ],
  },
];

const AmazonSearchBar = ({ isMobile = false }) => {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const { categories = [], fetchCategories } = useCategoryStore();
  const { products = [], fetchProducts } = useProductStore();
  const { equipmentTypes = [], fetchEquipmentTypes } = useEquipmentTypeStore();

  const [query, setQuery] = useState("");
  const [selectedEquipmentType, setSelectedEquipmentType] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [mounted, setMounted] = useState(false);
  const recognitionRef = useRef(null);

  const sortedEquipmentTypes = useMemo(() => {
    return [...equipmentTypes].sort((a, b) => {
      const orderA = typeof a.displayOrder === "number" ? a.displayOrder : 999;
      const orderB = typeof b.displayOrder === "number" ? b.displayOrder : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [equipmentTypes]);

  useEffect(() => {
    setMounted(true);
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

  const isTypeMatch = (eqObjOrId, selected) => {
    if (!selected || selected === "all" || !eqObjOrId) return false;
    const selStr = String(selected).toLowerCase().trim();
    if (typeof eqObjOrId === "object") {
      const id = String(eqObjOrId._id || "").toLowerCase().trim();
      const name = String(eqObjOrId.name || "").toLowerCase().trim();
      const slug = String(eqObjOrId.slug || "").toLowerCase().trim();
      return selStr === id || selStr === name || selStr === slug;
    }
    const strId = String(eqObjOrId).toLowerCase().trim();
    return selStr === strId;
  };

  const selectedTypeObj = useMemo(() => {
    if (!selectedEquipmentType || selectedEquipmentType === "all") return null;
    return equipmentTypes.find((eq) => isTypeMatch(eq, selectedEquipmentType)) || null;
  }, [equipmentTypes, selectedEquipmentType]);

  const scopedEquipmentProducts = useMemo(() => {
    if (!selectedEquipmentType || selectedEquipmentType === "all") return products;
    return products.filter((p) => {
      const catEq = p.category?.equipmentType;
      const directEqId = p.equipmentTypeId || p.category?.equipmentType;
      const directEqName = p.equipmentTypeName;
      return (
        isTypeMatch(catEq, selectedEquipmentType) ||
        isTypeMatch(directEqId, selectedEquipmentType) ||
        (directEqName && isTypeMatch({ name: directEqName }, selectedEquipmentType))
      );
    });
  }, [products, selectedEquipmentType]);

  const scopedEquipmentCategories = useMemo(() => {
    if (!selectedEquipmentType || selectedEquipmentType === "all") return categories;
    return categories.filter((c) => {
      const catEq = c.equipmentType;
      return isTypeMatch(catEq, selectedEquipmentType);
    });
  }, [categories, selectedEquipmentType]);

  // Typo-tolerant Filtered Data (Equipment Types, Categories, Products, Calibration)
  const filteredData = useMemo(() => {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) {
      return {
        matchingEquipmentTypes: [],
        matchingCategories: [],
        matchingProducts: [],
        matchingCalibration: [],
      };
    }

    // 1. Matching equipment types (only when "all" is active)
    const matchingEquipmentTypes =
      selectedEquipmentType === "all"
        ? equipmentTypes
            .filter((eq) => {
              const name = eq.name || "";
              return name.toLowerCase().includes(cleanQ) || fuzzyMatch(cleanQ, name);
            })
            .slice(0, 3)
        : [];

    const matchedEqIds = new Set(matchingEquipmentTypes.map((e) => String(e._id)));

    // 2. Matching categories (strictly scoped to selected equipment type)
    const catPool = selectedEquipmentType !== "all" ? scopedEquipmentCategories : categories;
    const matchingCategories = catPool
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
      .slice(0, 4);

    const matchedCatIds = new Set(matchingCategories.map((c) => String(c._id)));

    // 3. Matching products (strictly scoped to selected equipment type)
    const prodPool = selectedEquipmentType !== "all" ? scopedEquipmentProducts : products;
    const matchingProducts = prodPool
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
      .slice(0, 8);

    // 4. Matching Calibration Services & Instruments
    const isGeneralCalibration =
      cleanQ.includes("calib") ||
      cleanQ.includes("kalib") ||
      cleanQ.includes("service") ||
      fuzzyMatch(cleanQ, "calibration services");

    const matchingCalibration = [];

    // If typing "calibration" and general mode is on
    if (selectedEquipmentType === "all") {
      if (isGeneralCalibration) {
        matchingCalibration.push({
          id: "main-hub",
          title: "ARCL Calibration Services (NABL Traceable All 7 Domains)",
          url: "/calibration-services",
          badge: "Specialist Calibration",
          sampleList: ["Force & UTM", "Dimensional", "Pressure", "Mass & Balance", "Temperature"],
        });
      }

      // Match individual calibration domains & instruments
      CALIBRATION_DOMAINS.forEach((domain) => {
        const isDomainMatch =
          domain.title.toLowerCase().includes(cleanQ) ||
          fuzzyMatch(cleanQ, domain.title);

        const matchedInstruments = domain.instruments.filter((inst) => {
          const instLower = inst.toLowerCase();
          return (
            instLower.includes(cleanQ) ||
            fuzzyMatch(cleanQ, instLower) ||
            (isGeneralCalibration && true)
          );
        });

        if (isDomainMatch || matchedInstruments.length > 0) {
          matchingCalibration.push({
            id: domain.id,
            title: domain.title,
            url: `/calibration-services#${domain.id}`,
            badge: "Calibration Service",
            icon: domain.icon,
            sampleList: matchedInstruments.slice(0, 4),
          });
        }
      });
    }

    return {
      matchingEquipmentTypes,
      matchingCategories,
      matchingProducts,
      matchingCalibration: matchingCalibration.slice(0, 3),
    };
  }, [
    query,
    selectedEquipmentType,
    equipmentTypes,
    categories,
    products,
    scopedEquipmentProducts,
    scopedEquipmentCategories,
  ]);

  const allSuggestions = useMemo(() => {
    const list = [];
    if (!query.trim()) {
      if (selectedEquipmentType !== "all") {
        scopedEquipmentProducts.forEach((prod) => {
          list.push({
            type: "product",
            data: prod,
            url: `/products/${prod.slug || prod._id}`,
          });
        });
        scopedEquipmentCategories.forEach((cat) => {
          list.push({
            type: "category",
            data: cat,
            url: `/categories/${cat.slug || cat._id}`,
          });
        });
      }
      return list;
    }

    filteredData.matchingProducts.forEach((prod) => {
      list.push({
        type: "product",
        data: prod,
        url: `/products/${prod.slug || prod._id}`,
      });
    });
    filteredData.matchingCategories.forEach((cat) => {
      list.push({
        type: "category",
        data: cat,
        url: `/categories/${cat.slug || cat._id}`,
      });
    });
    filteredData.matchingEquipmentTypes.forEach((eq) => {
      list.push({
        type: "equipmentType",
        data: eq,
        url: `/products?equipmentType=${encodeURIComponent(eq.name)}`,
      });
    });
    filteredData.matchingCalibration.forEach((cal) => {
      list.push({
        type: "calibration",
        data: cal,
        url: cal.url,
      });
    });
    return list;
  }, [
    filteredData,
    query,
    selectedEquipmentType,
    scopedEquipmentProducts,
    scopedEquipmentCategories,
  ]);

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
      const lower = trimmed.toLowerCase();
      // If user typed calibration or kalibration, navigate directly to calibration services page
      if (lower.includes("calib") || lower.includes("kalib") || fuzzyMatch(lower, "calibration")) {
        navigate("/calibration-services");
        return;
      }

      const eqParam = selectedEquipmentType !== "all" ? `&equipmentType=${encodeURIComponent(selectedEquipmentType)}` : "";
      navigate(`/products?search=${encodeURIComponent(trimmed)}${eqParam}`);
    } else if (selectedEquipmentType !== "all") {
      navigate(`/products?equipmentType=${encodeURIComponent(selectedEquipmentType)}`);
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
        suppressHydrationWarning={true}
        className={`flex items-center w-full h-10 md:h-11 bg-white rounded-xl border ${
          isListening
            ? "border-red-500 ring-3 ring-red-400/30"
            : "border-gray-300 focus-within:border-[#021C57] focus-within:ring-2 focus-within:ring-[#021C57]/20"
        } shadow-xs transition-all overflow-hidden`}
      >
        {/* LEFT: EQUIPMENT TYPE SCOPE SELECTOR */}
        <div className="relative h-full flex items-center bg-gray-100 hover:bg-gray-200 border-r border-gray-300 transition shrink-0">
          <select
            value={selectedEquipmentType}
            onChange={(e) => {
              setSelectedEquipmentType(e.target.value);
              inputRef.current?.focus();
            }}
            suppressHydrationWarning={true}
            className="h-full pl-3 pr-7 bg-transparent text-xs font-semibold text-gray-700 appearance-none cursor-pointer focus:outline-hidden max-w-[115px] sm:max-w-[155px] truncate"
            title="Filter by Equipment Type"
          >
            <option value="all">All Equipment</option>
            {sortedEquipmentTypes.map((eqType) => (
              <option key={eqType._id} value={eqType.name}>
                {formatTitleCase(eqType.name)}
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
            suppressHydrationWarning={true}
            placeholder={
              isListening
                ? "🎙️ Listening... Speak equipment or calibration name..."
                : isMobile
                ? "Search machines or calibration services..."
                : "Search machines, calibration services, soil, cement, concrete..."
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
              suppressHydrationWarning={true}
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
            suppressHydrationWarning={true}
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
          suppressHydrationWarning={true}
          className="h-full px-4 sm:px-5 bg-[#021C57] hover:bg-blue-900 text-white transition flex items-center justify-center shrink-0 cursor-pointer"
          title="Search Instruments & Calibration"
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
            <span>Listening... Speak instrument or calibration (e.g. &ldquo;Calibration Services&rdquo;, &ldquo;UTM Calibration&rdquo;, &ldquo;Caliper&rdquo;)</span>
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
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[520px] overflow-y-auto">
          {/* 1A. EMPTY QUERY BUT SPECIFIC EQUIPMENT TYPE SELECTED -> SHOW ALL PRODUCTS & CATEGORIES IN THIS TYPE */}
          {!query.trim() && selectedEquipmentType !== "all" && (
            <div className="p-3 sm:p-4 space-y-3">
              {/* HEADER BANNER FOR SELECTED TYPE */}
              <div className="flex items-center justify-between bg-blue-50/70 border border-blue-100 p-2.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#021C57] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <Package size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#021C57]">
                      {formatTitleCase(selectedTypeObj?.name || selectedEquipmentType)}
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      {scopedEquipmentProducts.length} Instruments & Testing Machines
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/products?equipmentType=${encodeURIComponent(selectedEquipmentType)}`);
                    setIsOpen(false);
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  View All <ArrowRight size={12} />
                </button>
              </div>

              {/* PRODUCTS IN THIS TYPE */}
              {scopedEquipmentProducts.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                    Available Instruments & Machines ({scopedEquipmentProducts.length})
                  </p>
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {scopedEquipmentProducts.map((prod, pIdx) => {
                      const thumb =
                        Array.isArray(prod.images) && prod.images[0]
                          ? prod.images[0]
                          : typeof prod.images === "string" && prod.images
                          ? prod.images
                          : "/assets/LOGO.png";
                      const prodUrl = `/products/${prod.slug || prod._id}`;
                      const isSelected = selectedIndex === pIdx;

                      return (
                        <Link
                          key={prod._id}
                          to={prodUrl}
                          onClick={() => {
                            setIsOpen(false);
                            setQuery("");
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition border cursor-pointer group ${
                            isSelected
                              ? "bg-blue-100/80 border-blue-200"
                              : "border-transparent hover:border-blue-100 hover:bg-blue-50/60"
                          }`}
                        >
                          <img
                            src={thumb}
                            alt={prod.name}
                            className="w-10 h-10 object-contain bg-white rounded-lg border border-gray-100 p-1 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#021C57] truncate">
                              {formatTitleCase(prod.name)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                              {prod.category?.name && (
                                <span className="text-blue-700 font-medium truncate">
                                  {formatTitleCase(prod.category.name)}
                                </span>
                              )}
                              {prod.productCode && (
                                <span className="font-mono bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                                  {prod.productCode}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight
                            size={13}
                            className="text-gray-300 group-hover:text-[#021C57] transition shrink-0"
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
                  Explore full range in catalogue
                </div>
              )}

              {/* CATEGORIES UNDER THIS TYPE */}
              {scopedEquipmentCategories.length > 0 && (
                <div className="pt-2 border-t border-gray-100 space-y-1.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                    Categories ({scopedEquipmentCategories.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {scopedEquipmentCategories.map((cat, cIdx) => {
                      const globalIdx = scopedEquipmentProducts.length + cIdx;
                      const isSelected = selectedIndex === globalIdx;

                      return (
                        <Link
                          key={cat._id}
                          to={`/categories/${cat.slug}`}
                          onClick={() => setIsOpen(false)}
                          className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition font-medium truncate ${
                            isSelected
                              ? "bg-blue-100 text-[#021C57] border-blue-300 font-semibold"
                              : "bg-gray-50 hover:bg-blue-50 hover:text-[#021C57] text-gray-700 border-gray-200"
                          }`}
                        >
                          <Layers size={12} className="text-blue-600 shrink-0" />
                          <span className="truncate">{formatTitleCase(cat.name)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 1B. DEFAULT POPULAR SUGGESTIONS (WHEN QUERY IS EMPTY AND "ALL EQUIPMENT" SELECTED) */}
          {!query.trim() && selectedEquipmentType === "all" && (
            <div className="p-3 sm:p-4 space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <TrendingUp size={14} className="text-blue-600" />
                  <span>Popular Searches & Services</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCHES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setQuery(item);
                        if (item.toLowerCase().includes("calib")) {
                          navigate("/calibration-services");
                        } else {
                          navigate(`/products?search=${encodeURIComponent(item)}`);
                        }
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

              {/* CALIBRATION SERVICES SHORTCUT */}
              <div className="pt-3 border-t border-gray-100">
                <Link
                  to="/calibration-services"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200/60 hover:border-cyan-300 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-black text-xs">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-cyan-800">
                        ARCL Specialist Calibration Services
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Force, UTM, Calipers, Gauges, Mass, Temperature, RPM
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-700 flex items-center gap-1">
                    Explore <ArrowRight size={13} />
                  </span>
                </Link>
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

          {/* 2. MATCHED RESULTS (PRODUCTS FIRST, THEN CATEGORIES, THEN EQUIPMENT TYPES, THEN CALIBRATION) */}
          {query.trim() && (
            <div className="py-2">
              {/* 1. MATCHING PRODUCTS (DIRECT INSTRUMENTS & MACHINES - MOST IMPORTANT) */}
              {filteredData.matchingProducts.length > 0 && (
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2 flex items-center justify-between">
                    <span>Testing Instruments & Machines</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{filteredData.matchingProducts.length} Results</span>
                  </p>
                  {filteredData.matchingProducts.map((prod, pIdx) => {
                    const globalIdx = pIdx;
                    const isSelected = selectedIndex === globalIdx;
                    const thumb =
                      Array.isArray(prod.images) && prod.images[0]
                        ? prod.images[0]
                        : typeof prod.images === "string" && prod.images
                        ? prod.images
                        : "/assets/LOGO.png";

                    const prodUrl = `/products/${prod.slug || prod._id}`;

                    return (
                      <Link
                        key={prod._id}
                        to={prodUrl}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition border-b border-gray-50 last:border-0 cursor-pointer ${
                          isSelected
                            ? "bg-blue-100/70 shadow-2xs"
                            : "hover:bg-blue-50/60"
                        }`}
                      >
                        <img
                          src={thumb}
                          alt={prod.name}
                          className="w-11 h-11 object-contain bg-white rounded-lg border border-gray-100 p-1 shrink-0 shadow-2xs"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            {formatTitleCase(prod.name)}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                            {prod.category?.name && (
                              <span className="text-blue-700 font-medium truncate">
                                {formatTitleCase(prod.category.name)}
                              </span>
                            )}
                            {prod.productCode && (
                              <span className="font-mono bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded text-[10px] font-semibold">
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

              {/* 2. MATCHING CATEGORIES */}
              {filteredData.matchingCategories.length > 0 && (
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
                    Categories
                  </p>
                  {filteredData.matchingCategories.map((cat, idx) => {
                    const globalIdx = (filteredData.matchingProducts?.length || 0) + idx;
                    const isSelected = selectedIndex === globalIdx;
                    const catUrl = `/categories/${cat.slug || cat._id}`;

                    return (
                      <Link
                        key={cat._id}
                        to={catUrl}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 text-[#021C57] font-semibold"
                            : "text-gray-800 hover:bg-gray-50 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers size={15} className="text-blue-600 shrink-0" />
                          <span>in {formatTitleCase(cat.name)}</span>
                        </div>
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          Category
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* 3. MATCHING EQUIPMENT TYPES */}
              {filteredData.matchingEquipmentTypes?.length > 0 && (
                <div className="px-3 py-2 border-b border-gray-100 bg-blue-50/40">
                  <p className="text-[11px] font-bold text-[#021C57] uppercase tracking-wider mb-1.5 px-2 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-blue-600" /> Equipment Classifications
                  </p>
                  {filteredData.matchingEquipmentTypes.map((eq, eqIdx) => {
                    const globalIdx =
                      (filteredData.matchingProducts?.length || 0) +
                      (filteredData.matchingCategories?.length || 0) +
                      eqIdx;
                    const isSelected = selectedIndex === globalIdx;
                    const eqUrl = `/products?equipmentType=${encodeURIComponent(eq.name)}`;

                    return (
                      <Link
                        key={eq._id}
                        to={eqUrl}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-100 text-[#021C57] font-semibold"
                            : "text-gray-900 hover:bg-blue-100/60 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers size={15} className="text-[#021C57] shrink-0" />
                          <span>{formatTitleCase(eq.name)}</span>
                        </div>
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Equipment Type
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* 4. MATCHING CALIBRATION SERVICES */}
              {filteredData.matchingCalibration?.length > 0 && (
                <div className="px-3 py-2 bg-cyan-50/50">
                  <p className="text-[11px] font-bold text-cyan-900 uppercase tracking-wider mb-1.5 px-2 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-cyan-700" /> Calibration Services & Instruments
                  </p>
                  {filteredData.matchingCalibration.map((cal, calIdx) => {
                    const globalIdx =
                      (filteredData.matchingProducts?.length || 0) +
                      (filteredData.matchingCategories?.length || 0) +
                      (filteredData.matchingEquipmentTypes?.length || 0) +
                      calIdx;
                    const isSelected = selectedIndex === globalIdx;

                    return (
                      <Link
                        key={cal.id || calIdx}
                        to={cal.url}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className={`block px-3 py-2.5 rounded-xl transition mb-1 last:mb-0 cursor-pointer ${
                          isSelected
                            ? "bg-cyan-100 text-cyan-950 font-semibold"
                            : "text-slate-900 hover:bg-cyan-100/70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award size={15} className="text-cyan-700 shrink-0" />
                            <span className="text-xs sm:text-sm font-bold text-cyan-950">
                              {cal.title}
                            </span>
                          </div>
                          <span className="text-[10px] bg-cyan-700 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                            {cal.badge}
                          </span>
                        </div>

                        {cal.sampleList && cal.sampleList.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5 pl-6">
                            {cal.sampleList.map((item) => (
                              <span
                                key={item}
                                className="text-[10px] bg-white border border-cyan-200 text-cyan-800 px-1.5 py-0.5 rounded-md font-medium"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* NO RESULTS FOUND STATE */}
              {filteredData.matchingCalibration.length === 0 &&
                filteredData.matchingEquipmentTypes.length === 0 &&
                filteredData.matchingCategories.length === 0 &&
                filteredData.matchingProducts.length === 0 && (
                  <div className="py-8 px-4 text-center">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      No matching equipment or calibration service found for &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Try searching &ldquo;Calibration Services&rdquo;, &ldquo;UTM Calibration&rdquo;, &ldquo;Soil&rdquo;, or &ldquo;Compression&rdquo;.
                    </p>
                  </div>
                )}

              {/* BOTTOM ACTION: SEE ALL RESULTS FOR SEARCH */}
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full mt-2 py-3 px-4 bg-gray-50 hover:bg-[#021C57] hover:text-white text-gray-800 text-xs sm:text-sm font-bold transition flex items-center justify-between border-t border-gray-200 cursor-pointer"
              >
                <span>
                  {query.toLowerCase().includes("calib")
                    ? `Open Calibration Services for "${query}"`
                    : `See all product results for "${query}"`}
                </span>
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

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Link } from "../utils/navigation.jsx";
import {
  Search,
  BookOpen,
  CheckCircle2,
  Download,
  MessageCircle,
  ShoppingBag,
  ArrowRight,
  Layers,
  Sparkles,
  FileText,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  Filter,
  Info,
  HelpCircle,
  Database,
  Check,
  Award,
} from "lucide-react";
import { useProductStore } from "../store/useProductStore.js";
import { useQuoteCartStore } from "../store/useQuoteCartStore.js";
import { generateQuotationPdf } from "../utils/quotationPdfGenerator.js";
import { sendCartToWhatsApp } from "../utils/whatsappQuote.js";
import { formatTitleCase } from "../utils/stringUtils.js";
import { toast } from "react-toastify";

// Strict, Precise Civil Engineering Standards Mapping
const CORE_CIVIL_STANDARDS = [
  // 1. CONCRETE COMPRESSION TEST
  {
    id: "is-516-concrete-compressive-strength",
    code: "IS 516 : 2021",
    astmEquivalent: "ASTM C39 / BS 1881 / EN 12390-3",
    title: "Method of Tests for Strength of Concrete (Compressive & Flexural Strength)",
    category: "Concrete Testing",
    description:
      "Determines the compressive load-bearing crushing capacity of cubic and cylindrical concrete specimens to ensure structural safety for high-rise buildings, bridges, and RMC plants.",
    specimen: "150mm x 150mm x 150mm Cubes or 150mm Dia x 300mm Height Cylinders",
    paceRate: "140 kg/sq.cm/min (approx. 5.2 kN/sec for 150mm cubes)",
    significance: "Mandatory quality assurance test for all RMC batching plants, NHAI highway structures, and commercial building columns.",
    assignedCodes: ["ARCL-DCTM2000", "ARCL-FACTM2000", "ARCL-CMP", "ARCL-DACT"],
    searchKeywords: ["ctm", "compression", "crushing", "concrete cube", "channel frame", "servo ctm", "2000kn", "516"],
  },

  // 2. CONCRETE SLUMP / WORKABILITY
  {
    id: "is-1199-concrete-slump-workability",
    code: "IS 1199 (Part 2) : 2018",
    astmEquivalent: "ASTM C143 / BS EN 12350-2",
    title: "Methods of Sampling & Analysis of Concrete - Workability by Slump Test",
    category: "Concrete Testing",
    description:
      "Determines the consistency, fluidity, and workability of freshly mixed concrete at batching plants and construction job sites to avoid segregation and ensure pumpability.",
    specimen: "Freshly mixed concrete sampled as per IS 1199 guidelines",
    paceRate: "Mould lifted vertically in 2 to 5 seconds",
    significance: "Essential field quality check for every transit mixer delivery before pouring concrete at site.",
    assignedCodes: ["ARCL-SCA"],
    searchKeywords: ["slump", "workability", "slump cone", "tamping rod", "fresh concrete", "1199"],
  },

  // 3. ACCELERATED CURING
  {
    id: "is-9013-accelerated-curing",
    code: "IS 9013 : 1978",
    astmEquivalent: "ASTM C684",
    title: "Method of Making, Curing and Determining Compressive Strength of Accelerated-Cured Concrete",
    category: "Concrete Testing",
    description:
      "Predicts the 28-day compressive strength of concrete within 28.5 hours using the warm water / boiling water method for fast-track construction projects.",
    specimen: "150mm concrete cubes in sealed moulds",
    paceRate: "Controlled thermal water bath heating cycle (warm water / boiling water)",
    significance: "Enables urgent QA acceptance and structural de-shuttering without waiting 28 days for standard curing.",
    assignedCodes: ["ARCL-DACT", "ARCL-CMP"],
    searchKeywords: ["accelerated curing", "curing tank", "boiling water", "curing bath", "9013"],
  },

  // 4. NON-DESTRUCTIVE TESTING - REBOUND HAMMER
  {
    id: "is-13311-part-2-rebound-hammer",
    code: "IS 13311 (Part 2) : 1992",
    astmEquivalent: "ASTM C805 / BS 1881-202",
    title: "Non-Destructive Testing of Concrete - Rebound Hammer Method",
    category: "NDT & Field Testing",
    description:
      "Assesses the in-situ compressive strength, surface hardness, and concrete uniformity of existing structures without damaging the structural elements.",
    specimen: "Smooth in-situ concrete surface (columns, beams, slabs, bridge piers)",
    paceRate: "Impact energy 2.207 Nm",
    significance: "Standard non-destructive structural audit and condition assessment of old buildings and precast units.",
    assignedCodes: ["ARCL-RHD", "ARCL-RHM"],
    searchKeywords: ["rebound", "rebound hammer", "schmidt hammer", "ndt hammer", "langry", "13311", "surface hardness"],
  },

  // 5. NON-DESTRUCTIVE TESTING - UPV & PILE
  {
    id: "is-13311-part-1-ultrasonic-pulse-velocity",
    code: "IS 13311 (Part 1) : 1992",
    astmEquivalent: "ASTM C597 / ASTM D5882 / BS 1881-203",
    title: "Non-Destructive Testing - Ultrasonic Pulse Velocity (UPV) & Pile Integrity",
    category: "NDT & Field Testing",
    description:
      "Measures ultrasonic wave velocity through concrete to detect internal voids, honeycombing, cracks, and assess deep pile foundation continuity.",
    specimen: "Direct/indirect concrete transmission and drilled deep concrete piles",
    paceRate: "Pulse transmission 54 kHz transducers / Low-strain pile shock",
    significance: "Deep internal structural integrity assessment for dams, bridge foundations, and multi-storey pillars.",
    assignedCodes: ["ARCL-UPVC369N", "ARCL-PIT8000"],
    searchKeywords: ["upv", "ultrasonic", "pulse velocity", "pile integrity", "pit", "crack detection", "13311"],
  },

  // 6. SOIL - CALIFORNIA BEARING RATIO (CBR)
  {
    id: "is-2720-part-16-cbr-testing",
    code: "IS 2720 (Part 16) : 1987",
    astmEquivalent: "ASTM D1883 / AASHTO T193 / BS 1377-4",
    title: "Methods of Test for Soils - Determination of California Bearing Ratio (CBR)",
    category: "Soil & Geotechnical",
    description:
      "Determines the bearing resistance and penetration capacity of subgrade and highway base courses in unsoaked and soaked conditions.",
    specimen: "Compacted soil in 150mm dia x 175mm height CBR mould",
    paceRate: "1.25 mm/minute standard penetration speed",
    significance: "The foundational calculation parameter for all IRC flexible pavement thickness designs (NHAI / MoRTH).",
    assignedCodes: ["ARCL-DCBR"],
    searchKeywords: ["cbr", "california bearing ratio", "subgrade", "soil penetration", "2720 part 16"],
  },

  // 7. SOIL - DIRECT SHEAR TEST
  {
    id: "is-2720-part-13-direct-shear",
    code: "IS 2720 (Part 13) : 1986",
    astmEquivalent: "ASTM D3080 / BS 1377-7",
    title: "Methods of Test for Soils - Direct Shear Test",
    category: "Soil & Geotechnical",
    description:
      "Determines the shear strength parameters of soil: cohesion (c) and internal friction angle (φ) under normal consolidation loads.",
    specimen: "60mm x 60mm x 25mm undisturbed or remoulded soil sample",
    paceRate: "12 selectable speeds from 1.25 mm/min to 0.002 mm/min",
    significance: "Crucial for slope stability analysis, retaining wall design, and foundation bearing capacity.",
    assignedCodes: ["ARCL-DSA"],
    searchKeywords: ["direct shear", "shear strength", "shear box", "cohesion", "internal friction", "2720 part 13"],
  },

  // 8. SOIL - PLATE LOAD TEST & STATIC EV2
  {
    id: "is-1888-plate-load-test",
    code: "IS 1888 : 1982",
    astmEquivalent: "ASTM D1194 / DIN 18134",
    title: "Method of Load Test on Soils (Bearing Capacity & Static Deformation Modulus EV2)",
    category: "Soil & Geotechnical",
    description:
      "Measures the ultimate bearing capacity and settlement of soil at foundation level under incremental static vertical loading.",
    specimen: "In-situ ground tested with 300mm, 450mm, 600mm, and 750mm circular bearing plates",
    paceRate: "Incremental hydraulic loading with dial gauge settlement monitoring",
    significance: "Determines allowable soil bearing pressure for high-rise building foundations and railway subgrades.",
    assignedCodes: ["ARCL-PLA", "ARCL-EV2"],
    searchKeywords: ["plate load", "bearing capacity", "ev2", "static deformation", "settlement", "1888"],
  },

  // 9. SOIL - FIELD DENSITY BY SAND REPLACEMENT
  {
    id: "is-2720-part-28-sand-pouring",
    code: "IS 2720 (Part 28) : 1974",
    astmEquivalent: "ASTM D1556 / AASHTO T191",
    title: "Determination of Dry Density of Soil in Place by the Sand Replacement Method",
    category: "Soil & Geotechnical",
    description:
      "Measures the in-situ dry density and compaction percentage of compacted earth embankments and subgrade layers.",
    specimen: "100mm or 150mm excavated soil hole with standard Ottawa/Ennore sand",
    paceRate: "Field gravimetric density calculation",
    significance: "Daily quality verification for road embankments, canal linings, and earthen dams.",
    assignedCodes: ["ARCL-SPC"],
    searchKeywords: ["sand pouring", "field density", "soil density", "compaction", "2720 part 28"],
  },

  // 10. BITUMEN - DUCTILITY TEST
  {
    id: "is-1208-bitumen-ductility",
    code: "IS 1208 : 1978",
    astmEquivalent: "ASTM D113 / AASHTO T51 / IP 32",
    title: "Methods for Testing Tar and Bituminous Materials - Determination of Ductility",
    category: "Bitumen & Highway",
    description:
      "Measures the elongation distance in centimeters that a briquette of bitumen can stretch before breaking under controlled water bath conditions (27°C).",
    specimen: "Standard brass briquette mould (10mm x 10mm throat)",
    paceRate: "Pull rate 50 mm/minute ± 2.5 mm/min",
    significance: "Determines bitumen's resistance to cracking under repetitive traffic loads and temperature variations.",
    assignedCodes: ["ARCL-DTA"],
    searchKeywords: ["ductility", "bitumen ductility", "asphalt elongation", "briquette mould", "1208"],
  },

  // 11. BITUMEN - PENETRATION TEST
  {
    id: "is-1203-bitumen-penetration",
    code: "IS 1203 : 1978",
    astmEquivalent: "ASTM D5 / AASHTO T49 / IP 49",
    title: "Methods for Testing Tar and Bituminous Materials - Determination of Penetration",
    category: "Bitumen & Highway",
    description:
      "Determines the hardness or consistency of bitumen grades (e.g. VG-10, VG-30, VG-40) by measuring the depth in 1/10th of a mm that a standard 100g needle penetrates in 5 seconds at 25°C.",
    specimen: "Molten bitumen cooled in sample container at 25°C water bath",
    paceRate: "100g load for exactly 5 seconds",
    significance: "Primary criterion used in refinery certification and asphalt mix plant viscosity grading.",
    assignedCodes: ["ARCL-SP"],
    searchKeywords: ["penetrometer", "penetration", "bitumen grade", "vg30", "vg40", "1203"],
  },

  // 12. BITUMEN - MARSHALL STABILITY & FLOW
  {
    id: "astm-d6927-marshall-stability",
    code: "ASTM D6927 / AASHTO T245",
    astmEquivalent: "BS 598-107 / MoRTH Section 500",
    title: "Marshall Stability and Flow of Asphalt Paving Mixtures",
    category: "Bitumen & Highway",
    description:
      "Measures the resistance to plastic flow (stability in kN) and flow value (deformation in mm) of cylindrical bituminous pavement mixture specimens.",
    specimen: "101.6mm dia x 63.5mm height compacted asphalt specimen",
    paceRate: "50.8 mm/min (2 inches/min) constant rate of strain",
    significance: "Determines the optimum bitumen binder content (OBC) for all highway and airport runway asphalt mixes.",
    assignedCodes: ["ARCL-MSA", "ARCL-BE"],
    searchKeywords: ["marshall", "stability", "asphalt mix", "bitumen extractor", "flow value", "6927"],
  },

  // 13. CEMENT - VICAT CONSISTENCY & SETTING TIME
  {
    id: "is-4031-part-4-5-vicat-apparatus",
    code: "IS 4031 (Part 4 & 5) : 1988",
    astmEquivalent: "IS 5513 / ASTM C187 / ASTM C191 / EN 196-3",
    title: "Determination of Normal Consistency, Initial and Final Setting Times of Hydraulic Cement",
    category: "Cement & Mortar",
    description:
      "Determines the standard water percentage required for normal consistency, and the initial and final setting times of OPC, PPC, and rapid-hardening cements.",
    specimen: "Standard neat cement paste in Vicat conical mould (80mm dia x 40mm height)",
    paceRate: "Drop under 300g plunger weight",
    significance: "Mandatory factory and site acceptance test for all cement manufacturers and concrete batching operations.",
    assignedCodes: ["ARCL-VA", "ARCL-FTC"],
    searchKeywords: ["vicat", "setting time", "initial setting", "final setting", "cement flow", "4031", "consistency"],
  },

  // 14. CEMENT - COMPRESSIVE STRENGTH BY MORTAR VIBRATOR
  {
    id: "is-4031-part-6-mortar-vibrating",
    code: "IS 4031 (Part 6) : 1988",
    astmEquivalent: "IS 10080 / ASTM C109 / EN 196-1",
    title: "Determination of Compressive Strength of Hydraulic Cement (70.6mm Mortar Cubes)",
    category: "Cement & Mortar",
    description:
      "Determines the 3-day, 7-day, and 28-day compressive strength of cement using 1:3 standard Ennore sand mortar cubes compacted on a vibrating machine.",
    specimen: "70.6mm x 70.6mm x 70.6mm (50 sq.cm area) mortar cubes",
    paceRate: "12,000 ± 400 vibrations per minute for 2 minutes",
    significance: "Defines whether cement grade meets Grade 33, Grade 43, or Grade 53 IS standards.",
    assignedCodes: ["ARCL-MVM", "ARCL-CM70.6"],
    searchKeywords: ["mortar vibrator", "mortar mould", "70.6mm", "cement strength", "4031 part 6", "10080"],
  },

  // 15. AGGREGATE - SIEVE ANALYSIS & GRADATION
  {
    id: "is-2386-part-1-sieve-analysis",
    code: "IS 2386 (Part 1) : 1963",
    astmEquivalent: "IS 460 / ASTM C136 / AASHTO T27",
    title: "Methods of Test for Aggregates for Concrete - Particle Size and Shape (Sieve Analysis)",
    category: "Aggregates Testing",
    description:
      "Determines the particle size distribution (gradation) of coarse and fine aggregates to calculate Fineness Modulus (FM) and verify compliance with Zone I to IV.",
    specimen: "Dry coarse aggregate (4.75mm to 80mm) or fine sand (75 micron to 4.75mm)",
    paceRate: "15 minutes standard mechanical shaking",
    significance: "Ensures optimal packing density in concrete and asphalt mix designs to reduce voids and cement cost.",
    assignedCodes: ["ARCL-SS", "ARCL-TSGI"],
    searchKeywords: ["sieve shaker", "sieve", "gi test sieve", "gradation", "fineness modulus", "2386 part 1", "460"],
  },

  // 16. AGGREGATE - CRUSHING VALUE & IMPACT VALUE
  {
    id: "is-2386-part-4-crushing-impact-value",
    code: "IS 2386 (Part 4) : 1963",
    astmEquivalent: "BS 812 : Part 110 & 112",
    title: "Methods of Test for Aggregates for Concrete - Mechanical Properties (Crushing & Impact Value)",
    category: "Aggregates Testing",
    description:
      "Assesses the resistance of aggregates to progressive compressive crushing (Aggregate Crushing Value) and sudden shock/impact (Aggregate Impact Value).",
    specimen: "Aggregates passing 12.5mm and retained on 10mm IS sieve",
    paceRate: "Crushing: 400 kN over 10 mins; Impact: 15 blows of 14 kg hammer from 380mm height",
    significance: "Key criterion for selecting stone aggregates for heavy traffic wearing courses and airport pavements.",
    assignedCodes: ["ARCL-CVA", "ARCL-IVA"],
    searchKeywords: ["crushing value", "impact value", "aggregate crushing", "aggregate impact", "2386 part 4"],
  },

  // 17. THERMAL OVENS & HIGH TEMPERATURE FURNACES
  {
    id: "is-heating-lab-ovens-furnace",
    code: "IS Standards / ISO Grade",
    astmEquivalent: "High Temperature Thermal Standards",
    title: "Thermal Curing, Moisture Loss & Ash Content Testing",
    category: "Lab Heating & General",
    description:
      "Standard moisture evaporation, sample drying at 105-110°C, high-temperature ash content analysis at 1200°C, and laboratory sample heating.",
    specimen: "Soil, aggregate, cement, chemical, and bituminous samples",
    paceRate: "Thermostatic PID digital temperature control up to 1200°C",
    significance: "Fundamental thermal testing requirement across all civil, environmental, and material testing labs.",
    assignedCodes: ["ARCL-HAO", "ARCL-MF", "ARCL-HP", "ARCL-PHMT", "ARCL-GMC"],
    searchKeywords: ["hot air oven", "muffle furnace", "hot plate", "oven", "furnace", "drying", "moisture", "ph meter"],
  },

  // 18. SURVEYING & FIELD LEVELING
  {
    id: "is-survey-precision-leveling",
    code: "Survey Precision Standards",
    astmEquivalent: "Optical & Electronic Distance Measurement",
    title: "Topographical Leveling, Alignment & Geodetic Surveying",
    category: "Surveying Equipment",
    description:
      "High-precision optical and digital leveling, elevation difference measurement, structural deformation monitoring, and coordinate geodetic layout.",
    specimen: "Field ground leveling staff and geodetic prisms",
    paceRate: "Magnification 24x to 32x, Accuracy ±1.0mm/km",
    significance: "Required for road gradient profiling, bridge alignment, and building foundation pegging.",
    assignedCodes: ["ARCL-ALL", "ARCL-ALS", "ARCL-ALB32", "ARCL-ALB26", "ARCL-TSIM101"],
    searchKeywords: ["auto level", "total station", "sokkia", "leica", "bosch", "leveling", "survey", "tripod"],
  },
];

const CATEGORIES_LIST = [
  "All Standards",
  "Concrete Testing",
  "Soil & Geotechnical",
  "Bitumen & Highway",
  "Cement & Mortar",
  "Aggregates Testing",
  "NDT & Field Testing",
  "Lab Heating & General",
  "Surveying Equipment",
];

export default function StandardsDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Standards");

  const { products, fetchProducts, loading: productsLoading } = useProductStore();
  const { addItem, openCart } = useQuoteCartStore();

  useEffect(() => {
    fetchProducts().catch((err) => console.error("Error fetching live products:", err));
  }, [fetchProducts]);

  // Product Map for Fast & Accurate O(1) Lookup by ProductCode and Slug
  const productLookup = useMemo(() => {
    const codeMap = new Map();
    const slugMap = new Map();

    if (Array.isArray(products) && products.length > 0) {
      products.forEach((p) => {
        if (p.productCode) {
          codeMap.set(p.productCode.toUpperCase().trim(), p);
        }
        if (p.slug) {
          slugMap.set(p.slug.toLowerCase().trim(), p);
        }
      });
    }

    return { codeMap, slugMap };
  }, [products]);

  // Dynamically assign Real Live Database Products to each Standard (Precise 1-to-1 without duplicates)
  const standardsWithProducts = useMemo(() => {
    const { codeMap, slugMap } = productLookup;
    const liveProductsList = Array.isArray(products) ? products : [];

    return CORE_CIVIL_STANDARDS.map((std) => {
      // 1. Fetch exact matching products by SKU code
      const matchedProducts = [];
      const seenIds = new Set();

      std.assignedCodes.forEach((code) => {
        const liveProd = codeMap.get(code.toUpperCase().trim());
        if (liveProd && !seenIds.has(String(liveProd._id))) {
          matchedProducts.push(liveProd);
          seenIds.add(String(liveProd._id));
        }
      });

      // 2. Check if any newly created Admin product specifically specifies this standard code
      const stdCodeClean = std.code.toLowerCase().replace(/[^a-z0-9]/g, "");
      liveProductsList.forEach((p) => {
        if (seenIds.has(String(p._id))) return;

        const specStandard = String(
          p.specifications?.Standard ||
          p.specifications?.["Conforming Standard"] ||
          p.specifications?.["IS Code"] ||
          ""
        ).toLowerCase().replace(/[^a-z0-9]/g, "");

        if (specStandard && (specStandard.includes(stdCodeClean) || stdCodeClean.includes(specStandard))) {
          matchedProducts.push(p);
          seenIds.add(String(p._id));
        }
      });

      return {
        ...std,
        liveProducts: matchedProducts,
        itemCount: matchedProducts.length,
      };
    });
  }, [productLookup, products]);

  // Filter based on Search Query & Selected Category
  const filteredStandards = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();
    if (!rawQ && selectedCategory === "All Standards") {
      return standardsWithProducts;
    }

    // Split search into individual tokens (e.g. ["is", "516"] or ["ctm"] or ["cbr"])
    const tokens = rawQ.split(/\s+/).filter(Boolean);

    return standardsWithProducts.filter((std) => {
      // Category filter
      if (selectedCategory !== "All Standards" && std.category !== selectedCategory) {
        return false;
      }

      // If no search query, category match is enough
      if (tokens.length === 0) return true;

      // Construct a clean searchable text string for this standard
      const allProductNames = std.liveProducts.map((p) => `${p.name} ${p.productCode || ""}`).join(" ");
      const combinedSearchText = [
        std.code,
        std.astmEquivalent,
        std.title,
        std.category,
        std.description,
        std.specimen,
        ...std.searchKeywords,
        allProductNames,
      ]
        .join(" ")
        .toLowerCase();

      // ALL search tokens must match
      return tokens.every((token) => combinedSearchText.includes(token));
    });
  }, [standardsWithProducts, searchQuery, selectedCategory]);

  // Add All Equipment in a Standard to Cart
  const handleAddAllToCart = (standard) => {
    if (!standard.liveProducts || standard.liveProducts.length === 0) {
      toast.info("No live equipment found for this standard.");
      return;
    }

    standard.liveProducts.forEach((p) => {
      addItem(p, 1);
    });

    toast.success(`Added all ${standard.liveProducts.length} certified instruments for ${standard.code} to Quote Basket!`);
    openCart();
  };

  // 1-Click BOQ PDF Download for Standard
  const handleDownloadStandardPdf = (standard) => {
    if (!standard.liveProducts || standard.liveProducts.length === 0) {
      toast.info("No live equipment to generate BOQ.");
      return;
    }

    const items = standard.liveProducts.map((p) => ({
      product: p,
      quantity: 1,
    }));

    generateQuotationPdf({
      items,
      customer: {
        company: `${standard.category} Laboratory Setup (${standard.code})`,
      },
    });
  };

  // 1-Click WhatsApp Package Inquiry
  const handleWhatsAppPackage = (standard) => {
    if (!standard.liveProducts || standard.liveProducts.length === 0) return;

    const items = standard.liveProducts.map((p) => ({
      product: p,
      quantity: 1,
    }));

    sendCartToWhatsApp(items, {
      company: `Package Requirement for ${standard.code}: ${standard.title}`,
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 text-slate-900">
      
      {/* 1. HERO HEADER WITH EDUCATIONAL EXPLAINER */}
      <section className="bg-gradient-to-br from-[#021C57] via-[#052b7b] to-[#021C57] text-white pt-10 pb-14 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          
          {/* Top Pill Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-xs font-bold">
              <BookOpen size={13} className="text-amber-400" />
              <span>Civil Engineering Testing Code Hub</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Database Synchronized ({products?.length || 0} Products)</span>
            </div>
          </div>

          {/* Title & Introduction */}
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Indian Standards (IS Codes) & <br />
                <span className="text-amber-400">Testing Equipment Directory</span>
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
                In civil engineering, high-rise buildings, NHAI highways, and government tenders, quality tests must strictly comply with <strong>Indian Standards (IS Codes / BIS)</strong> and <strong>ASTM specifications</strong>. This directory maps each test code directly to its certified ARCL machinery and accessories.
              </p>
            </div>

            {/* 3-Step Guide Card */}
            <div className="lg:col-span-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle size={14} /> How To Use This Directory
              </div>
              <div className="space-y-2 text-xs text-blue-100">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <span><strong>Select or Search Standard:</strong> Type e.g. <em>IS 516</em>, <em>IS 2720</em>, or <em>CBR</em>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <span><strong>View Required Machines:</strong> See all apparatus, moulds & tools needed for that test.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <span><strong>1-Click BOQ Quotation:</strong> Download official estimate PDF or request on WhatsApp.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="pt-2 max-w-3xl">
            <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden bg-white">
              <Search className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Code (e.g. IS 516, IS 2720, IS 1208) or Machine (e.g. CTM, CBR, Ductility, Vicat)..."
                className="w-full pl-12 pr-10 py-3.5 sm:py-4 text-xs sm:text-sm text-slate-900 outline-none placeholder:text-gray-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 px-2 py-1 text-xs text-gray-400 hover:text-gray-700 bg-gray-100 rounded-lg cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Popular Quick Search Tags */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-3 text-xs text-blue-200">
              <span className="font-semibold text-white/80">Quick Codes:</span>
              {[
                { label: "IS 516 (Concrete CTM)", query: "IS 516" },
                { label: "IS 2720 (Soil & CBR)", query: "IS 2720" },
                { label: "IS 1208 (Bitumen Ductility)", query: "IS 1208" },
                { label: "IS 1199 (Slump Cone)", query: "IS 1199" },
                { label: "IS 4031 (Cement Vicat)", query: "IS 4031" },
                { label: "IS 13311 (NDT Hammer)", query: "IS 13311" },
                { label: "IS 2386 (Sieve Analysis)", query: "IS 2386" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(item.query)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] transition cursor-pointer border border-white/10"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 2. CATEGORY FILTER BAR */}
      <div className="sticky top-28 sm:top-30 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs py-3 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 pr-2">
            <Filter size={13} /> Discipline:
          </span>
          {CATEGORIES_LIST.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#021C57] text-white shadow-md scale-95"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN STANDARDS LIST */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8 sm:pt-10 space-y-8">
        
        {/* Results Count & Reset Filter */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>
            Showing <strong>{filteredStandards.length}</strong> Testing Standards & Specifications
          </span>
          {(selectedCategory !== "All Standards" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory("All Standards");
                setSearchQuery("");
              }}
              className="text-blue-600 hover:underline cursor-pointer font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* EMPTY SEARCH STATE */}
        {filteredStandards.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#021C57] flex items-center justify-center mx-auto text-2xl font-bold">
              🔍
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Standards Found for "{searchQuery}"</h3>
            <p className="text-xs text-slate-500">
              Try searching with standard numbers like <strong>IS 516</strong>, <strong>IS 2720</strong>, <strong>ASTM C39</strong>, or reset filters to browse all equipment.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Standards");
              }}
              className="px-5 py-2.5 bg-[#021C57] text-white text-xs font-bold rounded-xl hover:bg-blue-900 transition cursor-pointer"
            >
              Show All Standards
            </button>
          </div>
        )}

        {/* STANDARDS CARDS */}
        <div className="space-y-8">
          {filteredStandards.map((std) => (
            <article
              key={std.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition duration-300 overflow-hidden"
            >
              
              {/* TOP HEADER BAR */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-[#021C57] to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-amber-400 text-slate-950 font-mono font-black text-xs sm:text-sm rounded-lg shadow-sm">
                      {std.code}
                    </span>
                    {std.astmEquivalent && (
                      <span className="px-2.5 py-1 bg-white/10 text-blue-200 font-mono text-[11px] rounded-lg border border-white/10">
                        Eq: {std.astmEquivalent}
                      </span>
                    )}
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {std.category}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-xl font-extrabold text-white leading-snug">
                    {std.title}
                  </h2>
                </div>

                {/* 1-CLICK TEST PACKAGE ACTIONS */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownloadStandardPdf(std)}
                    className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
                    title="Download Complete Test Setup BOQ PDF Estimate"
                  >
                    <Download size={13} />
                    <span>Download Test BOQ</span>
                  </button>

                  <button
                    onClick={() => handleWhatsAppPackage(std)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
                    title="Inquire Complete Setup on WhatsApp"
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp Package</span>
                  </button>
                </div>
              </div>

              {/* CARD DETAILS BODY */}
              <div className="p-5 sm:p-6 space-y-6">
                
                {/* 1. ENGINEERING SPECIFICATIONS & PURPOSE */}
                <div className="grid md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-7 space-y-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Info size={12} className="text-blue-600" />
                      Test Purpose & Scope
                    </h3>
                    <p className="text-slate-700 leading-relaxed font-normal">
                      {std.description}
                    </p>
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-slate-700 space-y-1">
                      <strong className="text-[#021C57] block font-bold">Quality & Engineering Significance:</strong>
                      <span>{std.significance}</span>
                    </div>
                  </div>

                  <div className="md:col-span-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Standard Test Specifications
                    </h3>
                    
                    {std.specimen && (
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">
                          Standard Specimen Size
                        </span>
                        <span className="font-semibold text-slate-800">{std.specimen}</span>
                      </div>
                    )}

                    {std.paceRate && (
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">
                          Testing Speed / Loading Rate
                        </span>
                        <span className="font-semibold text-slate-800">{std.paceRate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. REQUIRED ARCL APPARATUS & EQUIPMENT (LIVE FROM DATABASE) */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#021C57] flex items-center gap-1.5">
                      <Layers size={14} className="text-blue-600" />
                      Required Testing Machinery & Equipment ({std.liveProducts.length} Items Live in Database)
                    </h3>

                    <button
                      onClick={() => handleAddAllToCart(std)}
                      className="text-xs font-bold text-blue-800 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl border border-blue-200 transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <ShoppingBag size={12} />
                      <span>Add All to Quote Basket</span>
                    </button>
                  </div>

                  {/* EQUIPMENT TILES GRID */}
                  {std.liveProducts && std.liveProducts.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {std.liveProducts.map((p) => {
                        const imgUrl =
                          p.images && p.images.length > 0
                            ? p.images[0]
                            : "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=300";

                        return (
                          <div
                            key={p._id || p.slug}
                            className="bg-slate-50 border border-slate-200/80 hover:border-blue-300 rounded-2xl p-3.5 flex flex-col justify-between space-y-3 transition group"
                          >
                            <div className="space-y-2">
                              {/* PRODUCT IMAGE */}
                              <div className="relative bg-white rounded-xl p-2 border border-slate-100 flex items-center justify-center h-32 overflow-hidden">
                                <img
                                  src={imgUrl}
                                  alt={p.name}
                                  className="max-h-28 w-auto object-contain transition duration-300 group-hover:scale-105"
                                />
                                {p.isFeatured && (
                                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-md">
                                    Featured
                                  </span>
                                )}
                              </div>

                              {/* PRODUCT TITLE & SKU */}
                              <div>
                                {p.productCode && (
                                  <div className="text-[10px] font-mono font-bold text-blue-900 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100 inline-block mb-1">
                                    {p.productCode.toUpperCase()}
                                  </div>
                                )}
                                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#021C57] transition">
                                  {formatTitleCase(p.name)}
                                </h4>
                                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                                  {p.category?.name || std.category}
                                </p>
                              </div>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                              <Link
                                to={`/products/${p.slug}`}
                                className="flex-1 py-1.5 px-2 bg-[#021C57] hover:bg-blue-900 text-white text-[11px] font-bold rounded-lg transition text-center flex items-center justify-center gap-1"
                              >
                                <span>View Specs</span>
                                <ArrowRight size={10} />
                              </Link>

                              <button
                                onClick={() => {
                                  addItem(p, 1);
                                  openCart();
                                }}
                                title="Add item to Quote Basket"
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#021C57] rounded-lg transition cursor-pointer active:scale-95"
                              >
                                <ShoppingBag size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-slate-200/70">
                      No matching machines currently in inventory for this standard.
                    </div>
                  )}

                </div>

              </div>

            </article>
          ))}
        </div>

      </main>

    </div>
  );
}

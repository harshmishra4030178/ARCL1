"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FaSearch,
  FaTimes,
  FaBox,
  FaCheck,
  FaSpinner,
  FaExchangeAlt,
  FaPlusCircle,
  FaGlobe,
  FaWarehouse,
} from "react-icons/fa";
import { fuzzyMatch } from "../../../utils/fuzzySearch.js";
import { getAdminProducts } from "../../../api/productApi.js";

/**
 * ProductAutoSuggest
 * Dynamic product search and auto-suggestion component for ARCL Admin & Inventory.
 *
 * Requirements:
 * 1. Shows all products present on the website catalog.
 * 2. If a non-catalog product was previously saved into Inventory, it automatically appears in suggestions!
 * 3. If a product does not exist, allows typing and 1-click selecting "+ Add & Onboard New Product".
 *    Once saved into inventory, it is permanently remembered and auto-suggested everywhere!
 */
export default function ProductAutoSuggest({
  products = [], // Website Catalog Products
  inventoryProducts = [], // Items currently in Inventory (Stock items)
  selectedProductId = "",
  selectedProduct = null,
  onSelect = () => {},
  onClear = () => {},
  placeholder = "Search product by name, model or SKU (e.g. DFTM, Compression)...",
  disabled = false,
  autoFocus = false,
  size = "md",
  showSelectedCard = true,
  allowCreate = true,
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [serverResults, setServerResults] = useState([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceTimer = useRef(null);

  // 1. Consolidate Catalog Products & Inventory Products into a unified master list
  const consolidatedProducts = useMemo(() => {
    const map = new Map();

    // Add Website Catalog products
    products.forEach((p) => {
      if (!p || !p._id) return;
      map.set(String(p._id), {
        _id: String(p._id),
        name: p.name || "",
        productCode: p.productCode || p.sku || p.slug || "",
        sku: p.productCode || p.sku || p.slug || "",
        categoryName: p.category?.name || p.categoryName || "Catalog Machine",
        equipmentTypeName: p.equipmentTypeName || p.category?.equipmentType?.name || "",
        slug: p.slug || "",
        images: p.images || [],
        source: "CATALOG",
        isCatalog: true,
        inInventory: false,
      });
    });

    // Add / Enrich with Inventory records (saved products from inventory)
    inventoryProducts.forEach((inv) => {
      if (!inv) return;
      const prodId = String(inv.product?._id || inv.product || inv._id);
      const existing = map.get(prodId);

      if (existing) {
        existing.inInventory = true;
        existing.onHand = inv.onHand || 0;
        existing.warehouseCode = inv.warehouseCode || "";
      } else {
        // Product was saved in inventory but may not be in current catalog list
        map.set(prodId, {
          _id: prodId,
          name: inv.productName || "Inventory Item",
          productCode: inv.sku || "",
          sku: inv.sku || "",
          categoryName: inv.categoryName || inv.category?.name || "Inventory Product",
          equipmentTypeName: "",
          slug: "",
          images: [],
          source: "INVENTORY",
          isCatalog: false,
          inInventory: true,
          onHand: inv.onHand || 0,
          warehouseCode: inv.warehouseCode || "",
        });
      }
    });

    return Array.from(map.values());
  }, [products, inventoryProducts]);

  // Derive currently selected product from prop or consolidated list
  const currentSelected = useMemo(() => {
    if (selectedProduct) return selectedProduct;
    if (!selectedProductId) return null;
    return (
      consolidatedProducts.find((p) => String(p._id) === String(selectedProductId)) || null
    );
  }, [selectedProduct, selectedProductId, consolidatedProducts]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter local consolidated products using fuzzy matching
  const localFiltered = useMemo(() => {
    if (!query || !query.trim()) {
      return consolidatedProducts.slice(0, 15);
    }
    const cleanQ = query.trim().toLowerCase();

    return consolidatedProducts
      .filter((p) => {
        const name = p.name || "";
        const code = p.productCode || p.sku || "";
        const catName = p.categoryName || "";
        const eqType = p.equipmentTypeName || "";
        const slug = p.slug || "";

        // Direct substring check
        if (
          name.toLowerCase().includes(cleanQ) ||
          code.toLowerCase().includes(cleanQ) ||
          catName.toLowerCase().includes(cleanQ) ||
          eqType.toLowerCase().includes(cleanQ) ||
          slug.toLowerCase().includes(cleanQ)
        ) {
          return true;
        }

        // Fuzzy typo-tolerant check
        return (
          fuzzyMatch(cleanQ, name) ||
          fuzzyMatch(cleanQ, code) ||
          fuzzyMatch(cleanQ, catName)
        );
      })
      .slice(0, 20);
  }, [query, consolidatedProducts]);

  // Server debounced search fallback to query database directly
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setServerResults([]);
      setIsSearchingServer(false);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        setIsSearchingServer(true);
        const res = await getAdminProducts({ search: query.trim(), limit: 15 });
        if (res?.data) {
          const prods = Array.isArray(res.data) ? res.data : res.data.products || [];
          setServerResults(
            prods.map((p) => ({
              _id: String(p._id),
              name: p.name || "",
              productCode: p.productCode || p.sku || p.slug || "",
              sku: p.productCode || p.sku || p.slug || "",
              categoryName: p.category?.name || p.categoryName || "Catalog Machine",
              equipmentTypeName: p.equipmentTypeName || "",
              slug: p.slug || "",
              images: p.images || [],
              source: "CATALOG",
              isCatalog: true,
              inInventory: false,
            }))
          );
        }
      } catch (err) {
        console.warn("Server product suggestion fetch error:", err.message);
      } finally {
        setIsSearchingServer(false);
      }
    }, 280);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  // Combine and deduplicate suggestions
  const suggestions = useMemo(() => {
    const map = new Map();
    localFiltered.forEach((p) => map.set(String(p._id), p));
    serverResults.forEach((p) => {
      if (!map.has(String(p._id))) {
        map.set(String(p._id), p);
      }
    });
    return Array.from(map.values()).slice(0, 25);
  }, [localFiltered, serverResults]);

  // Check if query has an exact match
  const hasExactMatch = useMemo(() => {
    if (!query || !query.trim()) return false;
    const cleanQ = query.trim().toLowerCase();
    return suggestions.some(
      (p) =>
        (p.name && p.name.toLowerCase() === cleanQ) ||
        (p.productCode && p.productCode.toLowerCase() === cleanQ)
    );
  }, [query, suggestions]);

  // Handle item selection
  const handleSelectProduct = (product) => {
    onSelect(product);
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
  };

  // Handle creating a new non-catalog product on the fly
  const handleCreateCustom = (customName) => {
    const cleanName = customName.trim();
    if (!cleanName) return;

    // Generate smart collision-resistant SKU
    const prefix =
      cleanName
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 6)
        .toUpperCase() || "SKU";
    const autoSku = `ARCL-${prefix}-${Date.now().toString().slice(-4)}`;

    const newProd = {
      _id: null,
      isNewProduct: true,
      name: cleanName,
      productCode: autoSku,
      sku: autoSku,
      categoryName: "General Lab Equipment",
      source: "NEW_CUSTOM",
    };

    onSelect(newProd);
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
  };

  // Handle clearing
  const handleClear = () => {
    onClear();
    setQuery("");
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    const totalItems = suggestions.length + (allowCreate && query.trim() && !hasExactMatch ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelectProduct(suggestions[activeIndex]);
      } else if (activeIndex === suggestions.length && allowCreate && query.trim()) {
        handleCreateCustom(query.trim());
      } else if (suggestions.length === 1) {
        handleSelectProduct(suggestions[0]);
      } else if (allowCreate && query.trim() && suggestions.length === 0) {
        handleCreateCustom(query.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Auto-scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  const sizeClasses = {
    sm: "py-1.5 px-3 text-xs",
    md: "py-2 px-3.5 text-xs sm:text-sm",
    lg: "py-2.5 px-4 text-sm sm:text-base",
  };

  // 1. If product is already selected and showSelectedCard is active, render selected card
  if (currentSelected && showSelectedCard && !isOpen) {
    const isNew = currentSelected.isNewProduct || !currentSelected._id;
    const imgUrl =
      currentSelected.images && currentSelected.images[0]
        ? currentSelected.images[0]
        : null;
    const skuCode =
      currentSelected.productCode || currentSelected.sku || currentSelected.slug || "NO-SKU";
    const catName =
      currentSelected.categoryName || currentSelected.category?.name || "ARCL Instrument";

    return (
      <div
        className={`relative flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all shadow-xs ${
          isNew
            ? "bg-amber-50/70 border border-amber-300"
            : "bg-blue-50/70 border border-blue-200"
        } ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-xs border ${
              isNew ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white border-blue-100"
            }`}
          >
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={currentSelected.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML =
                    '<span class="text-blue-500 font-bold text-xs">ARCL</span>';
                }}
              />
            ) : isNew ? (
              <FaPlusCircle className="text-amber-600 text-lg" />
            ) : (
              <FaBox className="text-blue-500 text-base" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-xs truncate leading-tight flex items-center gap-2">
              <span>{currentSelected.name}</span>
              {isNew && (
                <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded-full uppercase">
                  New Custom
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                {skuCode}
              </span>
              <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                {catName}
              </span>
            </div>
          </div>
        </div>

        {!disabled && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium"
              title="Change Product"
            >
              <FaExchangeAlt />
              <span className="hidden sm:inline">Change</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs"
              title="Remove Selection"
            >
              <FaTimes />
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Otherwise render the dynamic Auto-Suggest Input
  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input Field */}
      <div className="relative flex items-center">
        <FaSearch className="absolute left-3 text-slate-400 text-xs pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-8.5 pr-8 bg-white border border-slate-300 rounded-xl font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs ${
            sizeClasses[size] || sizeClasses.md
          } ${disabled ? "bg-slate-100 cursor-not-allowed text-slate-400" : ""}`}
        />

        {/* Status / Clear icons */}
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {isSearchingServer && (
            <FaSpinner className="animate-spin text-blue-500 text-xs" />
          )}
          {query && !disabled && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <FaTimes className="text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl max-h-76 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header indicator */}
          <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between text-[11px] font-semibold text-slate-500 border-b border-slate-100">
            <span>
              {query
                ? `Matching Products (${suggestions.length})`
                : `Catalog & Inventory Suggestions (${suggestions.length})`}
            </span>
            <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
              Use ↑↓ to navigate, Enter to pick
            </span>
          </div>

          {/* List items */}
          <div ref={listRef} className="py-1">
            {suggestions.length === 0 && !query.trim() && (
              <div className="px-4 py-6 text-center text-slate-400 text-xs">
                Start typing product name, model, or SKU code...
              </div>
            )}

            {suggestions.map((p, idx) => {
              const isSelected =
                currentSelected && String(currentSelected._id) === String(p._id);
              const isHighlighted = idx === activeIndex;
              const imgUrl = p.images && p.images[0] ? p.images[0] : null;
              const skuCode = p.productCode || p.sku || p.slug || "NO-SKU";
              const catName = p.categoryName || "ARCL Instrument";

              return (
                <div
                  key={p._id || idx}
                  onClick={() => handleSelectProduct(p)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`px-3 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isHighlighted
                      ? "bg-blue-50/80"
                      : isSelected
                      ? "bg-slate-50"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail */}
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML =
                              '<span class="text-blue-500 font-bold text-[10px]">ARCL</span>';
                          }}
                        />
                      ) : (
                        <FaBox className="text-slate-400 text-sm" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                          {skuCode}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                          {catName}
                        </span>

                        {/* Origin Badges */}
                        {p.inInventory ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded flex items-center gap-1">
                            <FaWarehouse className="text-[8px]" />
                            <span>In Inventory {p.onHand !== undefined ? `(${p.onHand} units)` : ""}</span>
                          </span>
                        ) : (
                          <span className="text-[9px] bg-blue-50 text-blue-700 font-medium px-1.5 py-0.2 rounded flex items-center gap-1 border border-blue-200">
                            <FaGlobe className="text-[8px]" />
                            <span>Website Catalog</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right indicator */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <FaCheck className="text-[10px]" /> Selected
                      </span>
                    ) : (
                      <span className="text-[11px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Select →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 3. OPTION TO ADD CUSTOM / NON-CATALOG PRODUCT ON THE FLY */}
            {allowCreate && query.trim().length >= 2 && !hasExactMatch && (
              <div
                onClick={() => handleCreateCustom(query.trim())}
                onMouseEnter={() => setActiveIndex(suggestions.length)}
                className={`p-3 border-t border-blue-100 flex items-center justify-between cursor-pointer transition-colors ${
                  activeIndex === suggestions.length
                    ? "bg-blue-100"
                    : "bg-blue-50/70 hover:bg-blue-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    +
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Add "{query.trim()}" as New Product
                    </div>
                    <span className="text-[10px] text-blue-700 block">
                      Not in catalog yet • Will be registered in Inventory & auto-suggested permanently
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-xs shrink-0">
                  + Onboard
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

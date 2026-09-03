"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, ChevronDown, Sparkles, ArrowRight, Package, Layers, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "../../utils/navigation.jsx";
import { useCategoryStore } from "../../store/useCategoryStore.js";
import { useProductStore } from "../../store/useProductStore.js";
import { formatTitleCase } from "../../utils/stringUtils.js";

const POPULAR_SEARCHES = [
  "Compression Testing Machine",
  "Vicat Apparatus",
  "Direct Shear Apparatus",
  "Core Cutting Machine",
  "Universal Testing Machine",
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

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (!categories.length) fetchCategories();
    if (!products.length) fetchProducts();
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

  // Filtered categories & products based on query & selected scope
  const filteredData = useMemo(() => {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) {
      return { matchingCategories: [], matchingProducts: [] };
    }

    // 1. Matching categories
    const matchingCategories = categories
      .filter((c) => c.name?.toLowerCase().includes(cleanQ))
      .slice(0, 3);

    // 2. Matching products
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
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(cleanQ) ||
          p.productCode?.toLowerCase().includes(cleanQ) ||
          p.modelNumber?.toLowerCase().includes(cleanQ) ||
          p.category?.name?.toLowerCase().includes(cleanQ)
      )
      .slice(0, 6);

    return { matchingCategories, matchingProducts };
  }, [query, selectedCategory, categories, products]);

  const allSuggestions = useMemo(() => {
    const list = [];
    filteredData.matchingCategories.forEach((cat) => {
      list.push({ type: "category", data: cat, url: `/categories/${cat.slug}` });
    });
    filteredData.matchingProducts.forEach((prod) => {
      list.push({ type: "product", data: prod, url: `/products/${prod.slug}` });
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
        className="flex items-center w-full h-10 md:h-11 bg-white rounded-lg border border-gray-300 focus-within:border-[#021C57] focus-within:ring-2 focus-within:ring-[#021C57]/20 shadow-xs transition-all overflow-hidden"
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
              isMobile
                ? "Search ARCL instruments..."
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
                inputRef.current?.focus();
              }}
              className="mr-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* RIGHT: SIGNATURE AMAZON-STYLE SEARCH BUTTON */}
        <button
          type="submit"
          className="h-full px-4 sm:px-6 bg-[#021C57] hover:bg-[#FFA500] hover:text-gray-950 text-white font-semibold transition-colors flex items-center justify-center shrink-0 cursor-pointer group"
          title="Search"
        >
          <Search
            size={18}
            className="transition-transform group-hover:scale-110"
          />
        </button>
      </form>

      {/* AUTO-SUGGEST DROPDOWN MODAL */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 overflow-hidden max-h-[75vh] sm:max-h-[500px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
          {/* 1. EMPTY QUERY STATE: POPULAR / TRENDING SEARCHES */}
          {!query.trim() && (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  <TrendingUp size={14} className="text-amber-500" />
                  <span>Popular Laboratory Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setQuery(item);
                        setIsOpen(false);
                        navigate(`/products?search=${encodeURIComponent(item)}`);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-[#021C57] hover:border-blue-200 px-3 py-1.5 rounded-lg border border-gray-200 transition cursor-pointer"
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

          {/* 2. MATCHED RESULTS (CATEGORIES + PRODUCTS) */}
          {query.trim() && (
            <div className="py-2">
              {/* MATCHING CATEGORIES */}
              {filteredData.matchingCategories.length > 0 && (
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
                    Categories
                  </p>
                  {filteredData.matchingCategories.map((cat, idx) => {
                    const isSelected = selectedIndex === idx;
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
                    const globalIdx = filteredData.matchingCategories.length + pIdx;
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
                              <span className="text-blue-700 font-medium">
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
              {filteredData.matchingCategories.length === 0 &&
                filteredData.matchingProducts.length === 0 && (
                  <div className="py-8 px-4 text-center">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      No matching equipment found for &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Try searching with different keywords like &ldquo;Compression&rdquo;, &ldquo;Soil&rdquo;, or &ldquo;Concrete&rdquo;.
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
                  See all matching results for &ldquo;{query}&rdquo;
                </span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AmazonSearchBar;

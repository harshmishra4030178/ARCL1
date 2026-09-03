"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "../utils/navigation.jsx";
import { useProductStore } from "../store/useProductStore.js";
import ProductCard from "../components/products/ProductCard.jsx";
import ProductToolbar from "../components/products/ProductToolbar.jsx";
import { Filter, X, RotateCcw, ChevronRight, Layers, SlidersHorizontal, Cog, CheckCircle2 } from "lucide-react";
import { formatTitleCase } from "../utils/stringUtils.js";

/**
 * Helper to normalize key strings for robust matching
 */
const normalizeKey = (k) => String(k || "").toLowerCase().replace(/[\s_-]+/g, "").trim();

const CategoryProductPage = ({ initialSlug }) => {
  const routeParams = useParams();
  const slug = initialSlug || routeParams.slug;
  const { categoryProducts, categoryData, fetchProductsByCategory, categoryProductsLoading, loading: globalLoading } =
    useProductStore();

  const loading = categoryProductsLoading || globalLoading;

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [selectedFilters, setSelectedFilters] = useState({});
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProductsByCategory(slug);
      setSelectedFilters({});
      setSearch("");
      setSort("latest");
    }
  }, [slug]);

  // Handle filter checkbox toggle
  const handleFilterToggle = (filterKey, value) => {
    setSelectedFilters((prev) => {
      const currentValues = prev[filterKey] || [];
      const updatedValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      if (updatedValues.length === 0) {
        const copy = { ...prev };
        delete copy[filterKey];
        return copy;
      }

      return {
        ...prev,
        [filterKey]: updatedValues,
      };
    });
  };

  const handleResetFilters = () => {
    setSelectedFilters({});
    setSearch("");
    setSort("latest");
  };

  const activeFilterCount = Object.values(selectedFilters).reduce(
    (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...categoryProducts];

    // 1. Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q)
      );
    }

    // 2. Dynamic Specification filters
    const filterKeys = Object.keys(selectedFilters);
    if (filterKeys.length > 0) {
      result = result.filter((product) => {
        const rawSpecs = product.specifications;
        
        let specsObj = {};
        if (rawSpecs instanceof Map) {
          specsObj = Object.fromEntries(rawSpecs);
        } else if (rawSpecs && typeof rawSpecs === "object") {
          specsObj = rawSpecs;
        }

        // Each filter category must match
        return filterKeys.every((filterKey) => {
          const selectedValues = selectedFilters[filterKey];
          if (!selectedValues || selectedValues.length === 0) return true;

          const targetNormalizedKey = normalizeKey(filterKey);

          // Find matching key in product specifications
          const matchedSpecKey = Object.keys(specsObj).find(
            (k) => normalizeKey(k) === targetNormalizedKey
          );

          if (!matchedSpecKey) return false;

          const productSpecVal = String(specsObj[matchedSpecKey]).toLowerCase().trim();

          // Check if any of selected values match the product's spec
          return selectedValues.some((val) => {
            const v = String(val).toLowerCase().trim();
            return (
              productSpecVal === v ||
              productSpecVal.includes(v) ||
              v.includes(productSpecVal)
            );
          });
        });
      });
    }

    // 3. Sorting
    if (sort === "a-z") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sort === "z-a") {
      result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else if (sort === "popular") {
      result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [categoryProducts, search, selectedFilters, sort]);

  return (
    <div className="bg-gray-50 min-h-screen">
      
      {/* BREADCRUMB & HEADER */}
      {/* ================= CATEGORY HERO BANNER ================= */}
      <section className="max-w-[1600px] mx-auto px-4 md:px-10 pt-6 pb-2">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#021C57] via-[#072d80] to-slate-900 text-white p-6 sm:p-8 md:p-12 shadow-2xl border border-blue-900/40">
          
          {/* Subtle Ambient Background Highlights */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-blue-200/80 font-medium flex-wrap">
              <Link to="/" className="hover:text-white transition">Home</Link>
              <ChevronRight size={12} className="text-blue-300/60" />
              <Link to="/products" className="hover:text-white transition">Catalogue</Link>
              <ChevronRight size={12} className="text-blue-300/60" />
              <span className="text-amber-300 font-semibold">
                {formatTitleCase(categoryData?.name || slug)}
              </span>
            </nav>

            {/* Title & Description Header */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30 backdrop-blur-sm">
                <Layers className="w-3.5 h-3.5 text-blue-300" />
                {formatTitleCase(categoryData?.equipmentType?.name || "Laboratory Category")}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight">
                {formatTitleCase(categoryData?.name || "Category Products")}
              </h1>

              {categoryData?.description && (
                <p className="text-blue-100/90 text-sm sm:text-base max-w-4xl leading-relaxed font-normal">
                  {categoryData.description}
                </p>
              )}
            </div>

            {/* How It Works & Operating Mechanism Section (If Available) */}
            {(categoryData?.howItWorks || (categoryData?.howItWorksSteps && categoryData.howItWorksSteps.length > 0)) && (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 md:p-6 rounded-2xl max-w-5xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <Cog size={15} className="text-amber-400" /> Working Principle & Operating Steps
                </h4>

                {categoryData.howItWorks && (
                  <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                    {categoryData.howItWorks}
                  </p>
                )}

                {categoryData.howItWorksSteps && categoryData.howItWorksSteps.length > 0 && (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {categoryData.howItWorksSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900/60 p-4 rounded-xl border border-white/10 space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center shrink-0">
                            {step.stepNumber || idx + 1}
                          </span>
                          <span className="font-bold text-xs text-white truncate">
                            {step.title || `Step ${idx + 1}`}
                          </span>
                        </div>
                        {step.description && (
                          <p className="text-[11px] text-blue-200/80 leading-relaxed pl-7">
                            {step.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* General Technical Specifications (Category Master Specs) */}
            {categoryData?.generalSpecifications && categoryData.generalSpecifications.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 md:p-6 rounded-2xl max-w-5xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-blue-300" /> General Technical Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  {categoryData.generalSpecifications.map((spec, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10 flex flex-col justify-between text-xs"
                    >
                      <span className="font-medium text-blue-300 text-[11px]">{spec.key}</span>
                      <span className="font-bold text-white mt-1 text-sm">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Features & Applications Cards */}
            {((categoryData?.features && categoryData.features.length > 0) ||
              (categoryData?.applications && categoryData.applications.length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl pt-1">
                {categoryData.features && categoryData.features.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-extrabold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-blue-400" /> Key Features
                    </h4>
                    <ul className="space-y-2 text-xs text-blue-100">
                      {categoryData.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {categoryData.applications && categoryData.applications.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-400" /> Industrial & Lab Applications
                    </h4>
                    <ul className="space-y-2 text-xs text-emerald-100">
                      {categoryData.applications.map((app, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                          <span className="leading-snug">{app}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <section className="max-w-[1600px] mx-auto px-4 md:px-10 py-8">
        
        {/* MOBILE FILTER TOGGLE */}
        {categoryData?.filters?.length > 0 && (
          <div className="lg:hidden mb-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 py-3 px-4 rounded-2xl text-sm font-semibold text-[#021C57] shadow-xs cursor-pointer"
            >
              <Filter size={16} />
              {mobileDrawerOpen ? "Close Filters" : `Specifications (${activeFilterCount})`}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 bg-gray-100 text-gray-700 py-3 px-4 rounded-2xl text-xs font-semibold hover:bg-gray-200 transition cursor-pointer"
              >
                <RotateCcw size={14} /> Reset
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SIDEBAR: DYNAMIC SPECIFICATION FILTERS */}
          {categoryData?.filters?.length > 0 && (
            <aside
              className={`w-full lg:w-72 shrink-0 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6 lg:sticky lg:top-36 ${
                mobileDrawerOpen ? "block" : "hidden lg:block"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-[#021C57] text-sm flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Technical Filters
                </h3>

                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <X size={12} /> Clear ({activeFilterCount})
                  </button>
                )}
              </div>

              {categoryData.filters.map((filter) => {
                const fKey = filter.key || filter.name;
                return (
                  <div key={fKey} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {formatTitleCase(filter.name)}
                      </h4>
                      {selectedFilters[fKey]?.length > 0 && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {selectedFilters[fKey].length} selected
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {filter.values?.map((val, idx) => {
                        const isChecked =
                          selectedFilters[fKey]?.includes(val) || false;

                        return (
                          <label
                            key={idx}
                            className={`flex items-center gap-2.5 text-xs px-2.5 py-1.5 rounded-xl cursor-pointer select-none transition ${
                              isChecked
                                ? "bg-blue-50/80 text-[#021C57] font-bold"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                handleFilterToggle(fKey, val)
                              }
                              className="w-4 h-4 rounded-md accent-[#021C57] cursor-pointer"
                            />
                            <span className="truncate">{val}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </aside>
          )}

          {/* MAIN PRODUCTS COLUMN */}
          <div className="flex-1 w-full space-y-6">
            
            {/* TOOLBAR */}
            <ProductToolbar
              search={search}
              setSearch={setSearch}
              sort={sort}
              setSort={setSort}
              totalProducts={filteredProducts.length}
              onReset={handleResetFilters}
              hasActiveFilters={Boolean(search || activeFilterCount > 0 || sort !== "latest")}
            />

            {/* APPLIED FILTERS PILLS */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Active Filters:
                </span>
                {Object.entries(selectedFilters).map(([k, vals]) =>
                  vals.map((v) => (
                    <span
                      key={`${k}-${v}`}
                      className="inline-flex items-center gap-1.5 bg-blue-50 text-[#021C57] border border-blue-200 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs"
                    >
                      <span>{v}</span>
                      <button
                        onClick={() => handleFilterToggle(k, v)}
                        className="hover:text-red-500 cursor-pointer"
                        title="Remove filter"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-red-500 hover:underline font-semibold ml-auto cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-80 bg-white rounded-3xl border border-gray-100 p-4 animate-pulse space-y-4"
                  >
                    <div className="h-44 bg-gray-100 rounded-2xl"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            )}

            {/* EMPTY */}
            {!loading && filteredProducts.length === 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center space-y-3 shadow-xs">
                <h3 className="text-xl font-bold text-gray-700">
                  No Instruments Found
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  No products matched the selected technical attributes or search keywords.
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 bg-[#021C57] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#03308f] transition cursor-pointer mt-2"
                  >
                    <RotateCcw size={12} /> Clear Applied Filters
                  </button>
                )}
              </div>
            )}

            {/* PRODUCT GRID */}
            {!loading && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 items-stretch">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

          </div>

        </div>
      </section>
    </div>
  );
};

export default CategoryProductPage;

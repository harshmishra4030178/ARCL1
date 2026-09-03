"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "../utils/navigation.jsx";
import { useProductStore } from "../store/useProductStore.js";
import ProductCard from "../components/products/ProductCard.jsx";
import ProductToolbar from "../components/products/ProductToolbar.jsx";
import {
  Filter,
  X,
  RotateCcw,
  ChevronRight,
  Layers,
  SlidersHorizontal,
  Cog,
  CheckCircle2,
  Sparkles,
  Building2,
  FileCheck2,
  ShieldCheck,
  Award,
} from "lucide-react";
import { formatTitleCase } from "../utils/stringUtils.js";

/**
 * Helper to normalize key strings for robust matching
 */
const normalizeKey = (k) => String(k || "").toLowerCase().replace(/[\s_-]+/g, "").trim();

const CategoryProductPage = ({ initialSlug }) => {
  const routeParams = useParams();
  const slug = initialSlug || routeParams.slug;
  const navigate = useNavigate();
  const {
    categoryProducts,
    categoryData,
    fetchProductsByCategory,
    categoryProductsLoading,
    loading: globalLoading,
  } = useProductStore();

  const loading = categoryProductsLoading || globalLoading;

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [selectedFilters, setSelectedFilters] = useState({});
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("features"); // 'features' | 'applications' | 'howItWorks' | 'specs'

  // If a category contains 1 single product, immediately redirect to that product's full details page
  useEffect(() => {
    if (!loading && categoryProducts && categoryProducts.length === 1) {
      const singleProd = categoryProducts[0];
      if (singleProd?.slug) {
        navigate(`/products/${singleProd.slug}`, { replace: true });
      }
    }
  }, [loading, categoryProducts, navigate]);

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
          p.slug?.toLowerCase().includes(q) ||
          p.productCode?.toLowerCase().includes(q)
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

        return filterKeys.every((filterKey) => {
          const selectedValues = selectedFilters[filterKey];
          if (!selectedValues || selectedValues.length === 0) return true;

          const normFilterKey = normalizeKey(filterKey);
          const matchedEntry = Object.entries(specsObj).find(
            ([k]) => normalizeKey(k) === normFilterKey
          );

          if (!matchedEntry) return false;

          const productSpecVal = String(matchedEntry[1] || "").trim().toLowerCase();

          return selectedValues.some((selectedVal) => {
            const v = String(selectedVal).trim().toLowerCase();
            return (
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

  const hasDetails = Boolean(
    (categoryData?.features && categoryData.features.length > 0) ||
    (categoryData?.applications && categoryData.applications.length > 0) ||
    categoryData?.howItWorks ||
    (categoryData?.howItWorksSteps && categoryData.howItWorksSteps.length > 0) ||
    (categoryData?.generalSpecifications && categoryData.generalSpecifications.length > 0)
  );

  return (
    <div className="bg-slate-50/60 min-h-screen pb-16">
      
      {/* ================= COMPACT & ELEGANT HEADER ================= */}
      <section className="bg-gradient-to-r from-[#021C57] via-[#052b7a] to-[#021C57] text-white py-6 md:py-8 px-4 md:px-10 border-b border-blue-900 shadow-md">
        <div className="max-w-[1600px] mx-auto space-y-3">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-blue-200/80 font-medium flex-wrap">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <ChevronRight size={12} className="text-blue-300/60" />
            <Link to="/products" className="hover:text-white transition">Catalogue</Link>
            <ChevronRight size={12} className="text-blue-300/60" />
            <span className="text-amber-300 font-semibold truncate max-w-xs sm:max-w-md">
              {formatTitleCase(categoryData?.name || slug)}
            </span>
          </nav>

          {/* Title & Badge */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">
                <Layers className="w-3 h-3 text-blue-300" />
                {formatTitleCase(categoryData?.equipmentType?.name || "Equipment Category")}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                {formatTitleCase(categoryData?.name || "Category Products")}
              </h1>

              {categoryData?.description && (
                <p className="text-blue-100/90 text-xs sm:text-sm max-w-3xl leading-relaxed">
                  {categoryData.description}
                </p>
              )}
            </div>

            {/* Quality Badges */}
            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-100">
                <Award size={15} className="text-amber-400" />
                <span>ISO 9001:2015</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-100">
                <ShieldCheck size={15} className="text-emerald-400" />
                <span>NABL Standard Compliant</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= MAIN PRODUCTS SHOWCASE (PROMINENT TOP) ================= */}
      <section className="max-w-[1600px] mx-auto px-4 md:px-10 pt-8">
        
        {/* MOBILE FILTER BUTTON */}
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
          
          {/* SIDEBAR: TECHNICAL SPECIFICATION FILTERS */}
          {categoryData?.filters?.length > 0 && (
            <aside
              className={`w-full lg:w-72 shrink-0 bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs space-y-6 lg:sticky lg:top-28 ${
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
                              onChange={() => handleFilterToggle(fKey, val)}
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

          {/* MAIN PRODUCTS GRID COLUMN */}
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

            {/* LOADING STATE */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {/* EMPTY STATE */}
            {!loading && filteredProducts.length === 0 && (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 md:p-16 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-blue-50 text-[#021C57] rounded-3xl mx-auto flex items-center justify-center">
                  <Layers size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-800">
                    No Instruments Match Your Selection
                  </h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Try clearing technical filters or search query to view all instruments in this category.
                  </p>
                </div>
                {(search || activeFilterCount > 0) && (
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 bg-[#021C57] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition shadow-sm cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            )}

            {/* PRODUCT CARDS GRID */}
            {!loading && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => (
                  <div key={prod._id} className="h-full">
                    <ProductCard product={prod} />
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ================= TECHNICAL DOCUMENTATION & DETAILS SECTION (BELOW PRODUCTS) ================= */}
      {hasDetails && (
        <section className="max-w-[1600px] mx-auto px-4 md:px-10 pt-12">
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden">
            
            {/* Header / Tabs Navigation */}
            <div className="bg-slate-50 border-b border-gray-200 px-6 pt-5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#021C57] flex items-center gap-2">
                  <FileCheck2 className="text-blue-600" size={18} /> Category Technical Specifications & Overview
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Engineering guidelines, key features, and operational applications
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-3 sm:pb-0 scrollbar-none">
                {categoryData?.features && categoryData.features.length > 0 && (
                  <button
                    onClick={() => setActiveTab("features")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === "features"
                        ? "bg-[#021C57] text-white shadow-xs"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    Key Features ({categoryData.features.length})
                  </button>
                )}

                {categoryData?.applications && categoryData.applications.length > 0 && (
                  <button
                    onClick={() => setActiveTab("applications")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === "applications"
                        ? "bg-[#021C57] text-white shadow-xs"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    Applications ({categoryData.applications.length})
                  </button>
                )}

                {(categoryData?.howItWorks || (categoryData?.howItWorksSteps && categoryData.howItWorksSteps.length > 0)) && (
                  <button
                    onClick={() => setActiveTab("howItWorks")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === "howItWorks"
                        ? "bg-[#021C57] text-white shadow-xs"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    Working Principle
                  </button>
                )}

                {categoryData?.generalSpecifications && categoryData.generalSpecifications.length > 0 && (
                  <button
                    onClick={() => setActiveTab("specs")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === "specs"
                        ? "bg-[#021C57] text-white shadow-xs"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    Master Specs ({categoryData.generalSpecifications.length})
                  </button>
                )}
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-6 md:p-8">
              
              {/* 1. KEY FEATURES */}
              {activeTab === "features" && categoryData?.features && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {categoryData.features.map((feat, i) => (
                    <div
                      key={i}
                      className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl flex items-start gap-3 hover:bg-blue-50 transition"
                    >
                      <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. APPLICATIONS */}
              {activeTab === "applications" && categoryData?.applications && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {categoryData.applications.map((app, i) => (
                    <div
                      key={i}
                      className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3 hover:bg-emerald-50 transition"
                    >
                      <Building2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                        {app}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. WORKING PRINCIPLE */}
              {activeTab === "howItWorks" && (
                <div className="space-y-5">
                  {categoryData?.howItWorks && (
                    <p className="text-xs sm:text-sm text-gray-700 bg-amber-50/60 border border-amber-200/80 p-4.5 rounded-2xl leading-relaxed">
                      {categoryData.howItWorks}
                    </p>
                  )}

                  {categoryData?.howItWorksSteps && categoryData.howItWorksSteps.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {categoryData.howItWorksSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl space-y-2"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-[#021C57] text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {step.stepNumber || idx + 1}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-[#021C57]">
                              {step.title || `Step ${idx + 1}`}
                            </span>
                          </div>
                          {step.description && (
                            <p className="text-xs text-gray-600 leading-relaxed pl-8.5">
                              {step.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. MASTER SPECIFICATIONS */}
              {activeTab === "specs" && categoryData?.generalSpecifications && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categoryData.generalSpecifications.map((spec, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between text-xs"
                    >
                      <span className="font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                        {spec.key}
                      </span>
                      <span className="font-bold text-[#021C57] text-sm mt-1">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        </section>
      )}

    </div>
  );
};

export default CategoryProductPage;

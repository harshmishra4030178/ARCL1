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
      <section className="bg-white border-b border-gray-100 py-8 px-4 md:px-10">
        <div className="max-w-[1600px] mx-auto space-y-3">
          
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium flex-wrap">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight size={12} />
            <Link to="/products" className="hover:text-blue-600">Catalogue</Link>
            <ChevronRight size={12} />
            <span className="text-[#021C57] font-semibold">
              {formatTitleCase(categoryData?.name || slug)}
            </span>
          </nav>

          {/* Title & Description */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5" />
              {formatTitleCase(categoryData?.equipmentType?.name || "Equipment Category")}
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-[#021C57]">
              {formatTitleCase(categoryData?.name || "Category Products")}
            </h1>
            {categoryData?.description && (
              <p className="text-gray-600 text-sm md:text-base max-w-3xl mt-1.5 leading-relaxed">
                {categoryData.description}
              </p>
            )}

            {/* How It Works & Operating Mechanism Section (If Available) */}
            {(categoryData?.howItWorks || (categoryData?.howItWorksSteps && categoryData.howItWorksSteps.length > 0)) && (
              <div className="mt-5 bg-amber-50/60 border border-amber-200/80 p-5 rounded-2xl max-w-4xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Cog size={14} className="text-amber-700" /> Working Principle & Operating Steps
                </h4>

                {categoryData.howItWorks && (
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                    {categoryData.howItWorks}
                  </p>
                )}

                {categoryData.howItWorksSteps && categoryData.howItWorksSteps.length > 0 && (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {categoryData.howItWorksSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {step.stepNumber || idx + 1}
                          </span>
                          <span className="font-bold text-xs text-[#021C57] truncate">
                            {step.title || `Step ${idx + 1}`}
                          </span>
                        </div>
                        {step.description && (
                          <p className="text-[11px] text-gray-600 leading-relaxed pl-7">
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
              <div className="mt-5 bg-indigo-50/50 border border-indigo-200/80 p-5 rounded-2xl max-w-4xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <SlidersHorizontal size={14} className="text-indigo-600" /> General Technical Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                  {categoryData.generalSpecifications.map((spec, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-indigo-100 flex flex-col justify-between shadow-2xs text-xs"
                    >
                      <span className="font-semibold text-gray-500 text-[11px]">{spec.key}</span>
                      <span className="font-bold text-[#021C57] mt-0.5">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Features & Applications */}
            {((categoryData?.features && categoryData.features.length > 0) ||
              (categoryData?.applications && categoryData.applications.length > 0)) && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                {categoryData.features && categoryData.features.length > 0 && (
                  <div className="bg-blue-50/50 border border-blue-200/80 p-4.5 rounded-2xl space-y-2.5">
                    <h4 className="text-xs font-bold text-[#021C57] uppercase tracking-wider">
                      Key Features
                    </h4>
                    <ul className="space-y-1.5 text-xs text-gray-700">
                      {categoryData.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-blue-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {categoryData.applications && categoryData.applications.length > 0 && (
                  <div className="bg-emerald-50/50 border border-emerald-200/80 p-4.5 rounded-2xl space-y-2.5">
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      Industrial & Lab Applications
                    </h4>
                    <ul className="space-y-1.5 text-xs text-gray-700">
                      {categoryData.applications.map((app, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>{app}</span>
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

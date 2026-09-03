"use client";

import { useEffect, useState, useMemo } from "react";
import { useCategoryStore } from "../store/useCategoryStore.js";
import { useProductStore } from "../store/useProductStore.js";
import { useEquipmentTypeStore } from "../store/useEquipmentTypeStore.js";
import CategoryProductsCatalogModal from "../components/catalog/CategoryProductsCatalogModal.jsx";
import NewsletterSubscription from "../components/common/NewsletterSubscription.jsx";
import {
  FileText,
  Search,
  Layers,
  Sparkles,
  Award,
  ArrowRight,
  FlaskConical,
  Gauge,
  Scale,
  Microscope,
  Compass,
  Wrench,
  ShieldCheck,
  Package,
} from "lucide-react";
import { formatTitleCase } from "../utils/stringUtils.js";

// Array of icons for category visual representation
const categoryIcons = [
  Gauge,
  Microscope,
  FlaskConical,
  Scale,
  Compass,
  Wrench,
  ShieldCheck,
  Layers,
];

const CatalogPage = () => {
  const { categories, fetchCategories, loading: catLoading } =
    useCategoryStore();
  const { products, fetchProducts, loading: prodLoading } = useProductStore();
  const { equipmentTypes, fetchEquipmentTypes } = useEquipmentTypeStore();

  const [search, setSearch] = useState("");
  const [selectedEquipmentType, setSelectedEquipmentType] = useState("all");
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchEquipmentTypes();
  }, []);

  // Filter categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        cat.name?.toLowerCase().includes(term) ||
        cat.description?.toLowerCase().includes(term) ||
        cat.equipmentType?.name?.toLowerCase().includes(term);

      const matchesType =
        selectedEquipmentType === "all" ||
        cat.equipmentType?._id === selectedEquipmentType ||
        cat.equipmentType === selectedEquipmentType;

      return matchesSearch && matchesType;
    });
  }, [categories, search, selectedEquipmentType]);

  const handleCategoryClick = (category) => {
    setSelectedCategoryForModal(category);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200/80 py-12 md:py-16 px-4 md:px-10 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#021C57] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200">
            <Award size={14} className="text-blue-600" /> Official Technical Documentation
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#021C57] tracking-tight">
            Equipment Catalog & Technical Brochures
          </h1>

          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Select an equipment category below to explore technical specification sheets, product brochures, and download official 1-click printable PDF catalogs.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-lg mx-auto relative">
            <Search className="absolute left-4 top-[60%] -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category (e.g. Polarimeter, Soil Tester)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition shadow-sm font-medium"
            />
          </div>
        </div>
      </section>

      {/* 2. CATEGORY BOXES GRID */}
      <section className="max-w-[1600px] mx-auto px-4 md:px-10 lg:px-16 py-12 space-y-8">
        
        {/* Equipment Type Filter Tabs */}
        {equipmentTypes.length > 0 && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide justify-start sm:justify-center">
            <button
              onClick={() => setSelectedEquipmentType("all")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedEquipmentType === "all"
                  ? "bg-[#021C57] text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              All Categories ({categories.length})
            </button>

            {equipmentTypes.map((eq) => {
              const count = categories.filter(
                (c) => (c.equipmentType?._id || c.equipmentType) === eq._id
              ).length;

              return (
                <button
                  key={eq._id}
                  onClick={() => setSelectedEquipmentType(eq._id)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedEquipmentType === eq._id
                      ? "bg-[#021C57] text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {eq.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {(catLoading || prodLoading) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-64 bg-white rounded-3xl border border-gray-100 p-6 animate-pulse space-y-4 shadow-xs"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
                <div className="h-5 bg-gray-100 rounded w-3/4"></div>
                <div className="h-3 bg-gray-50 rounded w-full"></div>
                <div className="h-3 bg-gray-50 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* CATEGORY CARDS / BOXES */}
        {!catLoading && filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category, index) => {
              const IconComponent =
                categoryIcons[index % categoryIcons.length] || Layers;

              // Count products in category
              const catProductCount = products.filter(
                (p) =>
                  p.category?._id === category._id ||
                  p.category === category._id ||
                  p.category?.slug === category.slug
              ).length;

              return (
                <div
                  key={category._id}
                  onClick={() => handleCategoryClick(category)}
                  className="group bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 hover:border-[#021C57] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 cursor-pointer relative overflow-hidden transform hover:-translate-y-1"
                >
                  {/* Top Header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-[#021C57] group-hover:bg-[#021C57] group-hover:text-white transition-colors duration-300 flex items-center justify-center shadow-xs">
                        <IconComponent size={26} />
                      </div>

                      {/* Badge */}
                      <span className="bg-gray-100 group-hover:bg-blue-50 text-gray-700 group-hover:text-[#021C57] text-[11px] font-bold px-3 py-1 rounded-full transition">
                        {catProductCount} Products
                      </span>
                    </div>

                    {/* Category Title & Equipment Type */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                        {formatTitleCase(category.equipmentType?.name || "Equipment Type")}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-[#021C57] transition leading-snug line-clamp-2">
                        {formatTitleCase(category.name)}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                      {category.description ||
                        "Explore comprehensive technical specifications, operating features, and official downloadable PDF brochures."}
                    </p>
                  </div>

                  {/* Bottom Action Indicator */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#021C57] group-hover:text-blue-600">
                    <span className="flex items-center gap-1.5">
                      <FileText size={14} className="text-amber-500" /> View Catalogs
                    </span>
                    <ArrowRight
                      size={15}
                      className="group-hover:translate-x-1.5 transition-transform duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!catLoading && filteredCategories.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3 max-w-md mx-auto shadow-xs">
            <Package className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg font-bold text-gray-800">
              No Categories Found
            </h3>
            <p className="text-gray-500 text-xs">
              Try adjusting your search query or equipment type filter.
            </p>
          </div>
        )}

      </section>

      {/* 3. NEWSLETTER SUBSCRIPTION */}
      <NewsletterSubscription />

      {/* 4. CATEGORY PRODUCTS CATALOG MODAL POPUP */}
      <CategoryProductsCatalogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={selectedCategoryForModal}
        products={products}
      />

    </div>
  );
};

export default CatalogPage;

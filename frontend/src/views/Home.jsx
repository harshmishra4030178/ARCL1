"use client";

import { useEffect, useState } from "react";
import Carousel from "../components/Carousel.jsx";
const trustImg = "/assets/why-us/trust.png";
const qualityImg = "/assets/why-us/quality.png";
const supportImg = "/assets/why-us/support.png";
import { Link, NavLink } from "../utils/navigation.jsx";
import { useProductStore } from "../store/useProductStore.js";
import { useEquipmentTypeStore } from "../store/useEquipmentTypeStore.js";
import EquipmentTypeProductRow from "../components/products/EquipmentTypeProductRow.jsx";
import FaqSection from "../components/home/FaqSection.jsx";
import { formatTitleCase } from "../utils/stringUtils.js";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  Check,
  Move,
} from "lucide-react";

const Home = ({ initialShowcase = [] }) => {
  const {
    homeShowcase,
    homeShowcaseLoading,
    fetchHomeShowcase,
  } = useProductStore();

  const { reorderEquipmentTypes } = useEquipmentTypeStore();

  const [sectionsList, setSectionsList] = useState(
    Array.isArray(initialShowcase) && initialShowcase.length > 0
      ? initialShowcase
      : []
  );
  const [canReorder, setCanReorder] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    if (Array.isArray(initialShowcase) && initialShowcase.length > 0) {
      useProductStore.setState({
        homeShowcase: initialShowcase,
        homeShowcaseLoading: false,
      });
    }
    fetchHomeShowcase();
  }, [fetchHomeShowcase, initialShowcase]);

  useEffect(() => {
    if (Array.isArray(homeShowcase) && homeShowcase.length > 0) {
      setSectionsList(homeShowcase);
    }
  }, [homeShowcase]);

  const saveSectionOrder = async (newList) => {
    setSectionsList(newList);
    setIsSavingOrder(true);
    try {
      const equipmentTypesToOrder = newList.map((item) => item.equipmentType);
      await reorderEquipmentTypes(equipmentTypesToOrder);
      toast.success("Showcase sections order saved! ✨");
    } catch (err) {
      toast.error("Failed to save showcase order.");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sectionsList.length) return;

    const copy = [...sectionsList];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    saveSectionOrder(copy);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const copy = [...sectionsList];
    const [moved] = copy.splice(draggedIndex, 1);
    copy.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    setDragOverIndex(null);
    saveSectionOrder(copy);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const featuredEquipmentSections = sectionsList.length > 0 ? sectionsList : (Array.isArray(homeShowcase) ? homeShowcase : []);
  const loading = homeShowcaseLoading && featuredEquipmentSections.length === 0;

  const features = [
    {
      title: "Trusted by Industry Experts",
      description:
        "We have built a reputation of reliability and professionalism, trusted by laboratories, universities, and industries across the nation.",
      image: trustImg,
    },
    {
      title: "Top-Quality Precision Equipment",
      description:
        "Our instruments comply with stringent ISO standards and are rigorously calibrated to ensure the highest testing precision.",
      image: qualityImg,
    },
    {
      title: "Dedicated Technical Support",
      description:
        "We provide comprehensive technical support, calibration assistance, and guidance for seamless operation.",
      image: supportImg,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 1. HERO CAROUSEL */}
      <Carousel />

      {/* 2. FEATURED EQUIPMENT TYPES & REPRESENTATIVE PRODUCTS SHOWCASE */}
      <section className="py-16 px-4 md:px-10 lg:px-16 max-w-[1600px] mx-auto space-y-16">
        {/* =========================================================
    SECTION 1: ABOUT ARCL
========================================================= */}
          <div className="max-w-6xl mx-auto">
            {/* Section Heading */}
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 bg-blue-50 text-[#021C57] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Leading Civil &amp; Material Testing Manufacturer
              </span>
              <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-black text-[#021C57] tracking-tight">
                Civil Laboratory Equipment Manufacturer &amp; Supplier in Mumbai
              </h1>
              <p className="mt-3 text-gray-600 text-sm md:text-base max-w-3xl mx-auto">
                ARCL Instruments Private Limited manufactures precision civil engineering, construction materials, soil, concrete, bitumen, and laboratory testing machines with NABL-traceable calibration across Mumbai, Navi Mumbai, Thane, and Maharashtra.
              </p>
            </div>

            {/* Content */}
            <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 md:p-10 shadow-sm space-y-6">
              <p className="text-gray-700 text-sm md:text-base leading-8">
                <strong className="text-[#021C57]">
                  ARCL Instruments Private Limited
                </strong>{" "}
                is an <strong className="text-[#021C57]">ISO 9001:2015 certified</strong> premier manufacturer and supplier of civil laboratory testing instruments. Based in Navi Mumbai, we supply high-precision testing apparatus for concrete, soil geotechnical investigations, bitumen asphalt, cement, aggregates, surveying, and non-destructive testing (NDT) across Mumbai, Navi Mumbai, Thane, Pune, and all industrial regions of Maharashtra.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                <Link to="/categories/concrete-testing-equipment" className="p-3 bg-white hover:bg-blue-50 border border-gray-200 rounded-2xl text-center transition group shadow-2xs">
                  <span className="text-xs font-bold text-gray-800 group-hover:text-[#021C57] block">Concrete Testing</span>
                  <span className="text-[10px] text-gray-500">CTM, Moulds, Slump</span>
                </Link>
                <Link to="/categories/soil-testing-equipment" className="p-3 bg-white hover:bg-blue-50 border border-gray-200 rounded-2xl text-center transition group shadow-2xs">
                  <span className="text-xs font-bold text-gray-800 group-hover:text-[#021C57] block">Soil Testing</span>
                  <span className="text-[10px] text-gray-500">CBR, Direct Shear, SPT</span>
                </Link>
                <Link to="/categories/aggregate-testing-equipment" className="p-3 bg-white hover:bg-blue-50 border border-gray-200 rounded-2xl text-center transition group shadow-2xs">
                  <span className="text-xs font-bold text-gray-800 group-hover:text-[#021C57] block">Aggregate Testing</span>
                  <span className="text-[10px] text-gray-500">Sieve Shakers, Impact</span>
                </Link>
                <Link to="/categories/bitumen-testing-equipment" className="p-3 bg-white hover:bg-blue-50 border border-gray-200 rounded-2xl text-center transition group shadow-2xs">
                  <span className="text-xs font-bold text-gray-800 group-hover:text-[#021C57] block">Bitumen Testing</span>
                  <span className="text-[10px] text-gray-500">Ductility, Penetrometer</span>
                </Link>
                <Link to="/categories/cement-testing-equipment" className="p-3 bg-white hover:bg-blue-50 border border-gray-200 rounded-2xl text-center transition group shadow-2xs">
                  <span className="text-xs font-bold text-gray-800 group-hover:text-[#021C57] block">Cement Testing</span>
                  <span className="text-[10px] text-gray-500">Vicat, Le-Chatelier</span>
                </Link>
                <Link to="/categories/surveying-instruments" className="p-3 bg-white hover:bg-blue-50 border border-gray-200 rounded-2xl text-center transition group shadow-2xs">
                  <span className="text-xs font-bold text-gray-800 group-hover:text-[#021C57] block">Surveying Equipment</span>
                  <span className="text-[10px] text-gray-500">Total Station, Auto Level</span>
                </Link>
                <Link to="/categories/non-destructive-testing-ndt-equipment" className="p-3 bg-white hover:bg-blue-50 border border-gray-200 rounded-2xl text-center transition group shadow-2xs">
                  <span className="text-xs font-bold text-gray-800 group-hover:text-[#021C57] block">NDT Instruments</span>
                  <span className="text-[10px] text-gray-500">Rebound Hammer, UPV</span>
                </Link>
                <Link to="/calibration-services" className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-center transition group shadow-2xs">
                  <span className="text-xs font-bold text-emerald-900 block">Calibration Services</span>
                  <span className="text-[10px] text-emerald-700">NABL Traceable</span>
                </Link>
              </div>

              {/* Local Service Hub Links */}
              <div className="pt-3 border-t border-gray-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-gray-500 font-medium">Dedicated Regional Testing Hubs:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Link to="/civil-lab-equipment-mumbai" className="font-bold text-[#021C57] hover:underline bg-white px-3 py-1 rounded-lg border border-gray-200">
                    Mumbai Equipment Hub →
                  </Link>
                  <Link to="/civil-lab-equipment-navi-mumbai" className="font-bold text-[#021C57] hover:underline bg-white px-3 py-1 rounded-lg border border-gray-200">
                    Navi Mumbai Office &amp; Lab →
                  </Link>
                  <Link to="/civil-lab-equipment-thane" className="font-bold text-[#021C57] hover:underline bg-white px-3 py-1 rounded-lg border border-gray-200">
                    Thane Construction Hub →
                  </Link>
                </div>
              </div>
            </div>
          </div>

        {/* =========================================================
    SECTION 2: CIVIL LABORATORY EQUIPMENT
========================================================= */}
  
        {/* Main Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200/80 pb-8">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[#021C57] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Featured
              Industry Classifications
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#021C57] tracking-tight">
              Specialized Laboratory Testing Instruments
            </h2>

            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Explore key flagship instruments organized by industry equipment
              types. Each category is engineered to national calibration
              guidelines.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto flex-wrap">
            

            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 bg-[#021C57] hover:bg-[#043399] text-white text-xs sm:text-sm font-bold px-7 py-3.5 rounded-2xl transition duration-200 shadow-md shrink-0 cursor-pointer"
            >
              Browse All Catalogue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* REORDER HELPER BANNER */}
        {canReorder && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-5 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-between gap-4 flex-wrap shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-medium">
              <Move size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Reorder Mode Active:</strong> Drag sections using the <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">⠿</span> handle, or click the ⬆️ / ⬇️ arrow buttons. Changes are saved automatically.
              </span>
            </div>
            {isSavingOrder && (
              <span className="text-xs font-bold bg-amber-200 text-amber-900 px-3 py-1 rounded-full animate-pulse">
                Saving changes...
              </span>
            )}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-12">
            {[1, 2].map((group) => (
              <div key={group} className="space-y-4">
                <div className="h-8 bg-gray-200 rounded-xl w-64 animate-pulse"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-[336px] bg-white rounded-3xl border border-gray-100 p-4 animate-pulse space-y-4 shadow-xs"
                    >
                      <div className="h-48 bg-gray-100 rounded-2xl w-full"></div>
                      <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SECTION-WISE EQUIPMENT TYPES DISPLAY (DRAGGABLE & REORDERABLE) */}
        {!loading && featuredEquipmentSections.length > 0 && (
          <div className="space-y-16">
            {featuredEquipmentSections.map((section, index) => {
              const isDragging = draggedIndex === index;
              const isOver = dragOverIndex === index;

              return (
                <div
                  key={section.equipmentType._id}
                  draggable={canReorder}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`transition-all duration-200 rounded-3xl ${
                    isDragging
                      ? "opacity-30 scale-[0.98] ring-4 ring-blue-400 ring-dashed"
                      : isOver
                      ? "ring-4 ring-[#021C57] ring-offset-4 scale-[1.01]"
                      : ""
                  }`}
                >
                  <EquipmentTypeProductRow
                    section={section}
                    canReorder={canReorder}
                    onMoveUp={() => handleMove(index, -1)}
                    onMoveDown={() => handleMove(index, 1)}
                    isFirst={index === 0}
                    isLast={index === featuredEquipmentSections.length - 1}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Fallback if no products/equipment types available */}
        {!loading && featuredEquipmentSections.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 bg-blue-50 text-[#021C57] rounded-full flex items-center justify-center mx-auto">
              <Layers size={30} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Explore Our Comprehensive Catalogue
            </h3>
            <p className="text-gray-500 text-sm">
              Browse our full inventory of civil, mechanical, scientific, and
              testing laboratory equipment.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-[#021C57] text-white px-7 py-3 rounded-2xl font-semibold hover:bg-[#03308f] transition text-xs shadow-md"
            >
              Browse All Products <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>

      {/* 3. WHY CHOOSE ARCL */}
      <section className="py-16 px-6 md:px-16 bg-white text-[#021C57] border-t border-gray-100">
        <div className="max-w-6xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Award size={14} /> ISO 9001:2015 Certified
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Why Choose ARCL</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base">
            We deliver exceptional precision, comprehensive ISO compliance, and
            reliable engineering solutions tailored to your laboratory
            requirements.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">
          {features.map((item, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-100 rounded-3xl p-8 hover:shadow-lg hover:bg-white hover:border-gray-200 transition-all duration-300 flex flex-col items-center text-center"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-20 h-20 object-contain mb-6"
              />
              <h3 className="text-xl font-bold text-[#021C57] mb-3">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FREQUENTLY ASKED QUESTIONS (FAQ SECTION) */}
      <FaqSection />

      {/* 6. GLOBAL INTERACTION CTA */}
      <section className="w-full bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-[#021C57] to-[#043399] rounded-3xl shadow-xl p-8 md:p-14 text-center text-white space-y-6">
          <h2 className="text-2xl md:text-4xl font-bold leading-snug">
            Need Custom Laboratory Equipment or Calibration?
          </h2>
          <p className="text-blue-100 text-sm md:text-base max-w-2xl mx-auto">
            Our engineering specialists are ready to help you configure testing
            instruments according to national & international standards.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
            <NavLink
              to="/contact"
              className="inline-block bg-white hover:bg-gray-100 text-[#021C57] font-bold px-7 py-3.5 rounded-2xl shadow-lg transition duration-300 text-sm md:text-base cursor-pointer"
            >
              Contact Our Engineers
            </NavLink>

            <NavLink
              to="/standards"
              className="inline-block bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-7 py-3.5 rounded-2xl shadow-lg transition duration-300 text-sm md:text-base cursor-pointer"
            >
              Explore Testing Standards (IS Codes) →
            </NavLink>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;

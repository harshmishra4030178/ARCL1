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

const Home = () => {
  const {
    homeShowcase,
    homeShowcaseLoading,
    fetchHomeShowcase,
  } = useProductStore();

  const { reorderEquipmentTypes } = useEquipmentTypeStore();

  const [sectionsList, setSectionsList] = useState([]);
  const [canReorder, setCanReorder] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    fetchHomeShowcase();
  }, [fetchHomeShowcase]);

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
              <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-black text-[#021C57]">
                Laboratory Instruments & Testing Equipment
              </h2>
            </div>

            {/* Content */}
            <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 md:p-10 shadow-sm">
              <p className="text-gray-700 text-sm md:text-base leading-8">
                <strong className="text-[#021C57]">
                  ARCL Instruments Private Limited
                </strong>{" "}
                manufactures and supplies a wide range of laboratory
                instruments, including equipment for concrete, cement,
                aggregate, soil, bitumen, surveying, and scientific
                applications.
              </p>

              <p className="mt-5 text-gray-700 text-sm md:text-base leading-8">
                We use flexible management practices to quickly adapt to
                changing market needs. Our focus on science and innovation
                enables us to develop new laboratory instruments while
                maintaining strong connections with customers, industry experts,
                and professionals.
              </p>

              <p className="mt-5 text-gray-700 text-sm md:text-base leading-8">
                ARCL is an{" "}
                <strong className="text-[#021C57]">
                  ISO 9001:2015 Certified Company
                </strong>
                , and our products are designed to meet stringent international
                standards and laboratory quality requirements, including{" "}
                <strong className="text-[#021C57]">ISO/IEC 17025:2017</strong>.
              </p>

              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                  <h3 className="text-lg font-bold text-[#021C57]">
                    ISO 9001:2015
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Certified Company
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                  <h3 className="text-lg font-bold text-[#021C57]">
                    International Standards
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Quality-Focused Products
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                  <h3 className="text-lg font-bold text-[#021C57]">
                    Innovation
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Science & Technology Driven
                  </p>
                </div>
              </div>
            </div>
                  <section className="py-6 md:py-6 px-6 md:px-12 lg:px-16 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            {/* Section Heading */}
            <div className="text-center mb-10">
              <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-black text-[#021C57]">
                Civil Laboratory Equipment
              </h2>

              <p className="mt-4 max-w-3xl mx-auto text-gray-600 text-sm md:text-base leading-7">
                Precision-engineered laboratory equipment for reliable testing,
                measurement, research, and quality control applications.
              </p>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-10">
              <p className="text-gray-700 text-sm md:text-base leading-8">
                ARCL offers a wide range of laboratory equipment designed to
                enhance precision, reliability, and efficiency across various
                scientific and engineering applications.
              </p>

              <p className="mt-5 text-gray-700 text-sm md:text-base leading-8">
                Our advanced range includes{" "}
                <strong className="text-[#021C57]">
                  fully automatic Compression Testing Machines
                </strong>{" "}
                for precise concrete strength testing, laboratory ovens that
                provide uniform heating, and{" "}
                <strong className="text-[#021C57]">Pan Mixers</strong> for
                consistent and efficient material mixing.
              </p>

              <p className="mt-5 text-gray-700 text-sm md:text-base leading-8">
                Our precision{" "}
                <strong className="text-[#021C57]">laboratory balances</strong>{" "}
                provide accurate material measurements, while our{" "}
                <strong className="text-[#021C57]">
                  Non-Destructive Testing (NDT) instruments
                </strong>{" "}
                use advanced technology to deliver reliable testing data.
              </p>

              <p className="mt-5 text-gray-700 text-sm md:text-base leading-8">
                ARCL laboratory equipment is designed with user-friendly
                controls and practical operating features to support high
                standards of performance, accuracy, reliability, and safety.
              </p>

              {/* Equipment Categories */}
            </div>
          </div>
        </section>

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
            {featuredEquipmentSections.length > 1 && (
              <button
                type="button"
                onClick={() => setCanReorder(!canReorder)}
                className={`inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer border ${
                  canReorder
                    ? "bg-amber-400 text-gray-950 border-amber-500 shadow-md ring-2 ring-amber-300"
                    : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                }`}
                title="Adjust the order of showcase sections"
              >
                {canReorder ? (
                  <>
                    <Check size={16} />
                    <span>Done Reordering</span>
                  </>
                ) : (
                  <>
                    <SlidersHorizontal size={16} />
                    <span>Adjust Section Order</span>
                  </>
                )}
              </button>
            )}

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
          <div className="pt-2">
            <NavLink
              to="/contact"
              className="inline-block bg-white hover:bg-gray-100 text-[#021C57] font-bold px-8 py-3.5 rounded-2xl shadow-lg transition duration-300 text-sm md:text-base"
            >
              Contact Our Engineers
            </NavLink>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "../utils/navigation.jsx";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  PhoneCall,
  FileText,
} from "lucide-react";

const image1 = "/assets/Slider/CalibrationMaintenanceService.jpg";
const image2 = "/assets/Slider/CivilAndMechanicalLabEqu.jpg";
const image3 = "/assets/Slider/MedicalAndScientificInstruments.jpg";

const slides = [
  {
    video: "https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4",
    image: image2,
    badge: "Civil & Mechanical Engineering",
    tagline: "Quality Testing & Research Equipment",
    heading: "Civil & Mechanical Lab Equipment",
    text: "ARCL specializes in delivering advanced material, concrete, soil, bitumen, and mechanical laboratory testing machinery with certified durability and micron-level accuracy.",
    primaryCta: { label: "Explore Products", to: "/products" },
    secondaryCta: { label: "View Catalogs", to: "/catalog" },
  },
  {
    video: "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4",
    image: image1,
    badge: "NABL Traceable Calibration",
    tagline: "Certified Compliance & Testing Services",
    heading: "Calibration & Maintenance Services",
    text: "ARCL provides professional laboratory calibration, repair, and periodic maintenance services ensuring your instruments maintain peak precision and strict ISO compliance.",
    primaryCta: { label: "Calibration Services", to: "/calibration-services" },
    secondaryCta: { label: "Contact Engineers", to: "/contact" },
  },
  {
    video: "https://videos.pexels.com/video-files/3191572/3191572-hd_1920_1080_25fps.mp4",
    image: image3,
    badge: "Scientific & Analytical Systems",
    tagline: "Next-Gen Research Lab Solutions",
    heading: "Scientific & Laboratory Instruments",
    text: "Engineered for high-throughput institutional labs, universities, and industrial R&D centers with strict adherence to IS, ASTM, BS, and ISO quality standards.",
    primaryCta: { label: "Browse Catalog", to: "/catalog" },
    secondaryCta: { label: "Request Custom Quote", to: "/contact" },
  },
];

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const length = slides.length;
  const timerRef = useRef(null);

  // Auto slide every 6.5 seconds
  useEffect(() => {
    if (!isPlaying) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev === length - 1 ? 0 : prev + 1));
    }, 6500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPlaying, length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      className="relative w-full min-h-[580px] sm:min-h-[640px] lg:h-[calc(100vh-8.5rem)] max-h-[820px] bg-slate-950 overflow-hidden select-none"
    >
      {/* Background Slides */}
      {slides.map((item, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={index}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Animated HTML5 Video Loop */}
            <video
              autoPlay
              loop
              muted
              playsInline
              poster={item.image}
              className="w-full h-full object-cover scale-105 transform animate-subtle-zoom"
            >
              <source src={item.video} type="video/mp4" />
            </video>

            {/* High-End Dark Gradient Mesh Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-[#021C57]/80 to-slate-950/70" />
            <div className="absolute inset-0 bg-radial-at-t from-transparent via-black/40 to-slate-950/90" />

            {/* Slide Foreground Content */}
            <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center py-16">
              <div className="max-w-2xl lg:max-w-3xl space-y-5">
                
                {/* Badge Tag */}
                <div
                  className={`inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs sm:text-sm font-semibold text-cyan-300 shadow-lg ${
                    isActive ? "animate-hero-badge" : "opacity-0"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>{item.badge}</span>
                </div>

                {/* Subtitle / Category Label */}
                <p
                  className={`text-sm sm:text-base md:text-lg font-bold uppercase tracking-wider text-amber-400 ${
                    isActive ? "animate-hero-badge" : "opacity-0"
                  }`}
                >
                  {item.tagline}
                </p>

                {/* Main Heading */}
                <h1
                  className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-md ${
                    isActive ? "animate-hero-heading" : "opacity-0"
                  }`}
                >
                  {item.heading}
                </h1>

                {/* Body Paragraph */}
                <p
                  className={`text-sm sm:text-base md:text-lg text-slate-200/90 leading-relaxed max-w-2xl font-normal drop-shadow-sm ${
                    isActive ? "animate-hero-text" : "opacity-0"
                  }`}
                >
                  {item.text}
                </p>

                {/* Action Buttons */}
                <div
                  className={`pt-3 flex flex-wrap items-center gap-3.5 ${
                    isActive ? "animate-hero-cta" : "opacity-0"
                  }`}
                >
                  <Link
                    to={item.primaryCta.to}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold px-7 py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/35 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm md:text-base cursor-pointer"
                  >
                    <span>{item.primaryCta.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to={item.secondaryCta.to}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-2xl border border-white/25 backdrop-blur-md shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm md:text-base cursor-pointer"
                  >
                    <span>{item.secondaryCta.label}</span>
                  </Link>
                </div>

              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrow Controls (Glassmorphism) */}
      <button
        suppressHydrationWarning
        type="button"
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-2xl bg-white/10 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer hidden sm:flex items-center justify-center"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        suppressHydrationWarning
        type="button"
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-2xl bg-white/10 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer hidden sm:flex items-center justify-center"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Modern Slide Progress Indicators */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex items-center justify-center gap-2.5 px-4">
        {slides.map((item, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={index}
              suppressHydrationWarning
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}: ${item.heading}`}
              className={`h-2.5 rounded-full transition-all duration-500 cursor-pointer ${
                isActive
                  ? "w-10 sm:w-12 bg-gradient-to-r from-amber-400 to-amber-500 shadow-md shadow-amber-500/50"
                  : "w-2.5 sm:w-3 bg-white/30 hover:bg-white/50"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Carousel;

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "../utils/navigation.jsx";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const image1 = "/assets/Slider/CalibrationMaintenanceService.jpg";
const image2 = "/assets/Slider/CivilAndMechanicalLabEqu.jpg";
const image3 = "/assets/Slider/MedicalAndScientificInstruments.jpg";

const slides = [
  {
    video: "https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4",
    image: image2,
    subheading: "We offers",
    heading: "Civil and Mechanical Equipments",
    text: "ARCL specializes in providing advanced civil and mechanical laboratory equipment, offering durable and high-accuracy tools used in engineering research, quality testing, and educational institutions.",
    primaryCta: { label: "Explore Products", to: "/products" },
    secondaryCta: { label: "View Catalogs", to: "/catalog" },
  },
  {
    video: "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4",
    image: image1,
    subheading: "We offers",
    heading: "Calibration and Maintenance Service",
    text: "ARCL delivers professional calibration and maintenance services, ensuring your laboratory instruments remain accurate, compliant, and reliable in accordance with regulatory and ISO standards.",
    primaryCta: { label: "Calibration Services", to: "/calibration-services" },
    secondaryCta: { label: "Contact Engineers", to: "/contact" },
  },
  {
    video: "https://videos.pexels.com/video-files/3191572/3191572-hd_1920_1080_25fps.mp4",
    image: image3,
    subheading: "We offers",
    heading: "Medical and Scientific Instruments",
    text: "ARCL provides a comprehensive range of precision medical and scientific instruments designed to meet the demands of modern laboratories and research institutions, conforming to national and international standards.",
    primaryCta: { label: "Browse Catalog", to: "/catalog" },
    secondaryCta: { label: "Request Custom Quote", to: "/contact" },
  },
];

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const length = slides.length;
  const timerRef = useRef(null);

  // Continuous Auto Slide every 5 seconds
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev === length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, length]);

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
    <div className="relative w-full xl:h-[calc(100vh-10rem)] min-h-[520px] md:min-h-[600px] bg-slate-950 overflow-hidden select-none">
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
              className="absolute inset-0 w-full h-full object-cover z-0"
            >
              <source src={item.video} type="video/mp4" />
            </video>

            {/* Dark Transparent Overlay for Contrast */}
            <div className="absolute inset-0 bg-black/65 z-10 pointer-events-none" />

            {/* Slide Foreground Content */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center pointer-events-auto">
              <div className="left-6 md:left-24 relative flex flex-col justify-center h-full w-[92%] max-w-4xl px-4 md:px-0 text-white font-semibold">
                
                {/* We offers */}
                <p className="md:text-3xl text-2xl font-bold text-white tracking-wide drop-shadow-md">
                  {item.subheading}
                </p>

                {/* Stroked Outlined Heading */}
                <h1 className="lg:text-7xl md:text-5xl text-3xl font-black stroke-text leading-tight my-2 drop-shadow-md">
                  {item.heading}
                </h1>

                {/* Description Text */}
                <p className="my-4 font-normal text-sm md:text-2xl text-slate-100 leading-relaxed max-w-3xl drop-shadow-sm">
                  {item.text}
                </p>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3.5">
                  <Link
                    to={item.primaryCta.to}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold px-6 py-3 rounded-2xl shadow-xl shadow-amber-500/25 transform hover:scale-105 active:scale-95 transition-all duration-200 text-xs sm:text-sm cursor-pointer"
                  >
                    <span>{item.primaryCta.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to={item.secondaryCta.to}
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-3 rounded-2xl border border-white/30 backdrop-blur-md shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 text-xs sm:text-sm cursor-pointer"
                  >
                    <span>{item.secondaryCta.label}</span>
                  </Link>
                </div>

              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrow Controls */}
      <button
        suppressHydrationWarning
        type="button"
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all duration-200 cursor-pointer hidden md:flex items-center justify-center border border-white/20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        suppressHydrationWarning
        type="button"
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all duration-200 cursor-pointer hidden md:flex items-center justify-center border border-white/20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators / Dots */}
      <div className="absolute bottom-5 w-full flex justify-center space-x-2 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            suppressHydrationWarning
            type="button"
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-3 rounded-full transition-all duration-300 cursor-pointer ${
              index === currentIndex
                ? "w-8 bg-amber-400 shadow-md shadow-amber-400/50"
                : "w-3 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;

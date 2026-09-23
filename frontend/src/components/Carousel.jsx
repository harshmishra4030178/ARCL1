"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "../utils/navigation.jsx";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

const image1 = "/assets/Slider/CalibrationMaintenanceService.webp";
const image2 = "/assets/Slider/CivilAndMechanicalLabEqu.webp";
const image3 = "/assets/Slider/MedicalAndScientificInstruments.webp";

const image1Mobile = "/assets/Slider/CalibrationMaintenanceService-mobile.webp";
const image2Mobile = "/assets/Slider/CivilAndMechanicalLabEqu-mobile.webp";
const image3Mobile = "/assets/Slider/MedicalAndScientificInstruments-mobile.webp";

const slides = [
  {
    video: "/videos/slide1.mp4",
    image: image2,
    mobileImage: image2Mobile,
    subheading: "We offers",
    heading: "Civil and Mechanical Equipments",
    text: "ARCL specializes in providing advanced civil and mechanical laboratory equipment, offering durable and high-accuracy tools used in engineering research, quality testing, and educational institutions.",
    primaryCta: { label: "Explore Products", to: "/products" },
    secondaryCta: { label: "View Catalogs", to: "/catalog" },
  },
  {
    video: "/videos/slide2.mp4",
    image: image1,
    mobileImage: image1Mobile,
    subheading: "We offers",
    heading: "Calibration and Maintenance Service",
    text: "ARCL delivers professional calibration and maintenance services, ensuring your laboratory instruments remain accurate, compliant, and reliable in accordance with regulatory and ISO standards.",
    primaryCta: { label: "Calibration Services", to: "/calibration-services" },
    secondaryCta: { label: "Contact Engineers", to: "/contact" },
  },
  {
    video: "/videos/slide3.mp4",
    image: image3,
    mobileImage: image3Mobile,
    subheading: "We offers",
    heading: "Medical and Scientific Instruments",
    text: "ARCL provides a comprehensive range of precision medical and scientific instruments designed to meet the demands of modern laboratories and research institutions, conforming to national and international standards.",
    primaryCta: { label: "Browse Catalog", to: "/catalog" },
    secondaryCta: { label: "Request Custom Quote", to: "/contact" },
  },
];

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [canLoadVideo, setCanLoadVideo] = useState(false);
  const length = slides.length;
  const timerRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    const isDesk = window.innerWidth >= 768;
    setIsDesktop(isDesk);

    if (isDesk) {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        const handle = window.requestIdleCallback(
          () => {
            setCanLoadVideo(true);
          },
          { timeout: 3000 }
        );
        return () => window.cancelIdleCallback(handle);
      } else {
        const timer = setTimeout(() => {
          setCanLoadVideo(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Auto Slide every 5 seconds (paused on hover or keyboard focus)
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev === length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, length, isPaused]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? length - 1 : prev - 1));
  }, [length]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === length - 1 ? 0 : prev + 1));
  }, [length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      prevSlide();
    } else if (e.key === "ArrowRight") {
      nextSlide();
    }
  };

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Laboratory Equipment and Calibration Services"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative w-full xl:h-[calc(100vh-10rem)] min-h-[520px] md:min-h-[600px] bg-slate-950 overflow-hidden select-none"
    >
      {/* Background Slides */}
      {slides.map((item, index) => {
        const isActive = index === currentIndex;
        // Video only runs on Desktop screens after idle paint
        const shouldLoadVideo = isDesktop && canLoadVideo && isActive;

        return (
          <div
            id={`carousel-slide-${index}`}
            key={index}
            role="tabpanel"
            aria-labelledby={`carousel-tab-${index}`}
            aria-label={`Slide ${index + 1} of ${slides.length}: ${item.heading}`}
            aria-hidden={!isActive}
            inert={!isActive ? "" : undefined}
            className={`absolute inset-0 ${
              isActive
                ? "opacity-100 z-10 visible pointer-events-auto"
                : "opacity-0 z-0 invisible pointer-events-none"
            } transition-opacity duration-700 ease-in-out`}
          >
            {/* High-priority Responsive WebP Poster Image for instant LCP render */}
            <picture>
              <source
                media="(max-width: 768px)"
                srcSet={item.mobileImage}
                type="image/webp"
              />
              <source
                media="(min-width: 769px)"
                srcSet={item.image}
                type="image/webp"
              />
              <img
                src={item.mobileImage}
                alt=""
                aria-hidden="true"
                width={750}
                height={600}
                fetchPriority={index === 0 ? "high" : "low"}
                loading={index === 0 ? "eager" : "lazy"}
                decoding={index === 0 ? "sync" : "async"}
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            </picture>

            {/* Animated HTML5 Video Loop (Mounted smoothly on client without blocking LCP) */}
            {shouldLoadVideo && (
              <video
                autoPlay
                loop
                muted
                playsInline
                preload={isActive ? "auto" : "none"}
                poster={item.image}
                aria-hidden="true"
                tabIndex={-1}
                className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              >
                <source src={item.video} type="video/mp4" />
              </video>
            )}

            {/* Dark Transparent Overlay for Contrast */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-black/65 z-10 pointer-events-none"
            />

            {/* Slide Foreground Content */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center pointer-events-auto">
              <div className="left-6 md:left-24 relative flex flex-col justify-center h-full w-[92%] max-w-4xl px-4 md:px-0 text-white font-semibold">
                
                {/* We offers */}
                <p className="md:text-3xl text-2xl font-bold text-white tracking-wide drop-shadow-md">
                  {item.subheading}
                </p>

                {/* Stroked Outlined Heading */}
                <h2 className="lg:text-7xl md:text-5xl text-3xl font-black stroke-text leading-tight my-2 drop-shadow-md">
                  {item.heading}
                </h2>

                {/* Description Text */}
                <p className="my-4 font-normal text-sm md:text-2xl text-slate-100 leading-relaxed max-w-3xl drop-shadow-sm">
                  {item.text}
                </p>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3.5">
                  <Link
                    to={item.primaryCta.to}
                    tabIndex={isActive ? 0 : -1}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold px-6 py-3 rounded-2xl shadow-xl shadow-amber-500/25 transform hover:scale-105 active:scale-95 transition-transform duration-200 text-xs sm:text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <span>{item.primaryCta.label}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>

                  <Link
                    to={item.secondaryCta.to}
                    tabIndex={isActive ? 0 : -1}
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-3 rounded-2xl border border-white/30 backdrop-blur-md shadow-lg transform hover:scale-105 active:scale-95 transition-transform duration-200 text-xs sm:text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
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
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-colors duration-200 cursor-pointer hidden md:flex items-center justify-center border border-white/20 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <ChevronLeft className="w-6 h-6" aria-hidden="true" />
      </button>

      <button
        suppressHydrationWarning
        type="button"
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-colors duration-200 cursor-pointer hidden md:flex items-center justify-center border border-white/20 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <ChevronRight className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Slide Indicators / Dots with accessible 44px touch targets */}
      <div
        role="tablist"
        aria-label="Slide Selection"
        className="absolute bottom-5 w-full flex justify-center items-center space-x-1 z-30"
      >
        {slides.map((item, index) => {
          const isCurrent = index === currentIndex;
          return (
            <button
              id={`carousel-tab-${index}`}
              aria-controls={`carousel-slide-${index}`}
              key={index}
              suppressHydrationWarning
              type="button"
              role="tab"
              aria-selected={isCurrent}
              aria-label={`Slide ${index + 1}: ${item.heading}`}
              onClick={() => goToSlide(index)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-full cursor-pointer"
            >
              <span
                className={`h-3 rounded-full transition-colors duration-300 block ${
                  isCurrent
                    ? "w-8 bg-amber-400 shadow-md shadow-amber-400/50"
                    : "w-3 bg-white/50 hover:bg-white/80"
                }`}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default Carousel;

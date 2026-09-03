"use client";

import React, { useMemo, useState } from "react";
import { Link } from "../utils/navigation.jsx";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gauge,
  Globe2,
  Layers3,
  MapPin,
  Menu,
  Microscope,
  MoveRight,
  Ruler,
  Search,
  ShieldCheck,
  Thermometer,
  Scale,
  Settings2,
  Zap,
  X,
} from "lucide-react";

const calibrationCategories = [
  {
    id: "dimensional",
    number: "01",
    title: "Dimensional Calibration",
    description:
      "Accurate calibration and verification of dimensional measuring instruments used for precision measurement and quality control.",
    icon: Ruler,
    items: [
      "Vernier Caliper",
      "Digital Caliper",
      "Bore Gage",
      "Radius Gage",
      "Protractor",
      "Dial Indicator",
      "Test Sieves",
      "Digital Indicator",
      "Outside Micrometer",
      "Height Gage",
      "Feeler Gage",
      "Steel Scale",
      "Tape Measure",
      "Cube Mould",
      "Beam Mould",
      "Cylindrical Mould",
    ],
  },
  {
    id: "temperature",
    number: "02",
    title: "Temperature & Environmental Calibration",
    description:
      "Calibration and verification services for temperature, humidity and environmental monitoring instruments and equipment.",
    icon: Thermometer,
    items: [
      "Thermometer Calibration",
      "Thermocouple Calibration",
      "RTD Calibration",
      "Temperature Data Logger Calibration",
      "Humidity Calibration",
      "Environmental Chamber Testing",
      "Oven & Furnace Calibration",
      "Refrigerator / Freezer Temperature Verification",
    ],
  },
  {
    id: "pressure",
    number: "03",
    title: "Pressure & Vacuum Calibration",
    description:
      "Reliable pressure and vacuum calibration solutions for gauges, transmitters, sensors and pressure measurement systems.",
    icon: Gauge,
    items: [
      "Pressure Gauge Calibration",
      "Digital Pressure Gauge Calibration",
      "Pressure Transmitter Calibration",
      "Vacuum Gauge Calibration",
      "Pressure Sensor Calibration",
      "Manometer Calibration",
      "Pressure Switch Testing",
    ],
  },
  {
    id: "mass",
    number: "04",
    title: "Mass, Weight & Balance Calibration",
    description:
      "Precision calibration and verification of weighing instruments, balances and standard weights.",
    icon: Scale,
    items: [
      "Weighing Balance Calibration",
      "Analytical Balance Calibration",
      "Precision Balance Calibration",
      "Platform Scale Calibration",
      "Standard Weight Calibration",
      "Mass Verification",
    ],
  },
  {
    id: "laboratory",
    number: "05",
    title: "Laboratory Instrument Calibration",
    description:
      "Calibration services for laboratory meters and analytical instruments to support accurate and dependable measurements.",
    icon: Microscope,
    items: [
      "pH Meter Calibration",
      "Conductivity Meter Calibration",
      "TDS Meter Calibration",
      "Dissolved Oxygen Meter Calibration",
      "Analytical Instrument Calibration",
      "Laboratory Meter Calibration",
    ],
  },
  {
    id: "force",
    number: "06",
    title: "Force Calibration Services",
    description:
      "Comprehensive force calibration services for testing machines, load cells, force gauges and other force measurement systems.",
    icon: MoveRight,
    items: [
      "Universal Testing Machine (UTM) Calibration",
      "Compression Testing Machine Calibration",
      "CBR Testing Machine Calibration",
      "Marshall Testing Machine Calibration",
      "Point Load Testing Machine Calibration",
      "Direct Shear Testing Machine Calibration",
      "Tensile Testing Machine Calibration",
      "Load Testing Machine Calibration",
      "Load Cell Calibration",
      "Force Gauge Calibration",
      "Digital Force Gauge Calibration",
      "Pull-out Tester Calibration",
      "Proving Ring Calibration",
    ],
  },
  {
    id: "rpm",
    number: "07",
    title: "RPM Calibration Services",
    description:
      "Accurate RPM and speed measurement calibration for tachometers, speed indicators and machine monitoring systems.",
    icon: Settings2,
    items: [
      "Digital Tachometer Calibration",
      "Contact Tachometer Calibration",
      "Non-Contact / Laser Tachometer Calibration",
      "RPM Meter Calibration",
      "Speed Indicator Calibration",
      "Motor RPM Measurement System Calibration",
      "Machine Speed Monitoring System Calibration",
    ],
  },
];

const forceRanges = [
  "1 kN",
  "5 kN",
  "10 kN",
  "20 kN",
  "50 kN",
  "100 kN",
  "200 kN",
  "500 kN",
  "1000 kN",
  "2000 kN",
  "3000 kN",
];

const locations = [
  "Mumbai",
  "Navi Mumbai",
  "Kalyan",
  "Thane",
  "Palghar",
  "Raigad",
  "Nashik",
  "Pune",
  "Maharashtra",
  "Pan India",
];

function Calibration() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [mobileMenu, setMobileMenu] = useState(false);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return calibrationCategories
      .filter((category) => {
        if (activeCategory === "all") return true;
        return category.id === activeCategory;
      })
      .map((category) => {
        if (!keyword) return category;

        const filteredItems = category.items.filter((item) =>
          item.toLowerCase().includes(keyword)
        );

        const categoryMatches =
          category.title.toLowerCase().includes(keyword) ||
          category.description.toLowerCase().includes(keyword);

        return {
          ...category,
          items: categoryMatches ? category.items : filteredItems,
        };
      })
      .filter((category) => category.items.length > 0);
  }, [search, activeCategory]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 overflow-x-hidden">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative min-h-[760px] overflow-hidden bg-slate-950">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-0 top-10 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "55px 55px",
          }}
        />

     

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="relative z-30 mx-5 rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl lg:hidden">
            <div className="grid gap-2">
              <button
                onClick={() => scrollTo("services")}
                className="rounded-xl px-4 py-3 text-left text-slate-200 hover:bg-white/10"
              >
                Calibration
              </button>
              <button
                onClick={() => scrollTo("force-range")}
                className="rounded-xl px-4 py-3 text-left text-slate-200 hover:bg-white/10"
              >
                Force Range
              </button>
              <button
                onClick={() => scrollTo("coverage")}
                className="rounded-xl px-4 py-3 text-left text-slate-200 hover:bg-white/10"
              >
                Coverage
              </button>
            </div>
          </div>
        )}

        {/* Hero content */}
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:pt-20">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
              Specialist Calibration Services
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Precision You Can
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                Measure.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              ARCL Instruments Pvt. Ltd. is a highly regarded specialist
              Calibration Services company with laboratories India-wide. We
              offer complete calibration services for various measuring
              instruments.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => scrollTo("services")}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-bold text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
              >
                Explore Calibration
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => scrollTo("contact")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-bold text-white backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/10"
              >
                Request a Quote
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {[
                "Accurate Measurement",
                "Complete Calibration",
                "Pan India Coverage",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-8 rounded-[3rem] bg-cyan-400/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl">
              <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                      Calibration Dashboard
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      Measurement Control
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10">
                    <ShieldCheck className="h-6 w-6 text-cyan-300" />
                  </div>
                </div>

                <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="mb-5 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-500">
                        Instrument Status
                      </p>
                      <p className="mt-1 text-xl font-bold text-white">
                        Calibration Ready
                      </p>
                    </div>

                    <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                      VERIFIED
                    </div>
                  </div>

                  <div className="h-40 rounded-2xl border border-cyan-300/10 bg-gradient-to-br from-cyan-300/10 to-blue-500/5 p-5">
                    <div className="flex h-full items-end gap-2">
                      {[32, 45, 39, 61, 55, 74, 68, 82, 77, 92].map(
                        (height, index) => (
                          <div
                            key={index}
                            className="flex-1 rounded-t-lg bg-gradient-to-t from-blue-600/30 to-cyan-300/80"
                            style={{ height: `${height}%` }}
                          />
                        )
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-slate-500">Accuracy</p>
                      <p className="mt-1 text-lg font-black text-white">
                        High
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-slate-500">Coverage</p>
                      <p className="mt-1 text-lg font-black text-white">
                        Pan India
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-slate-500">Support</p>
                      <p className="mt-1 text-lg font-black text-white">
                        Flexible
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Ruler className="h-5 w-5 text-cyan-300" />
                  <p className="mt-3 text-sm font-bold text-white">
                    Measurement
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Dimensional Calibration
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Gauge className="h-5 w-5 text-blue-300" />
                  <p className="mt-3 text-sm font-bold text-white">
                    Force & Pressure
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Calibration Services
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          INTRO / COVERAGE STRIP
      ========================================================== */}
      <section className="relative bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              About ARCL Calibration
            </p>

            <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Keep every instrument performing as expected.
            </h2>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              ARCL Instruments Pvt. Ltd. has years of experience in qualified
              calibration management of various measuring instruments. By using
              ARCL Instruments Pvt. Ltd., you don't have to invest in expensive
              calibration instruments and technical skills.
            </p>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              You will also benefit from time and resource savings on the
              registration and administration process.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["01", "Save Resources"],
                ["02", "Flexible Service"],
                ["03", "Technical Support"],
              ].map(([number, title]) => (
                <div
                  key={number}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-sm font-black text-cyan-600">{number}</p>
                  <p className="mt-2 font-bold text-slate-950">{title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10">
                <Globe2 className="h-6 w-6 text-cyan-300" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Service Coverage
                </p>
                <h3 className="mt-2 text-2xl font-black">
                  Maharashtra & India-wide
                </h3>
              </div>
            </div>

            <p className="mt-6 leading-7 text-slate-400">
              Our flexible and responsive Calibration Services are available
              in Mumbai, Navi Mumbai, Kalyan, Thane, Palghar, Raigad, Nashik,
              Pune and across Maharashtra and in India.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {locations.map((location) => (
                <span
                  key={location}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300"
                >
                  {location}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SERVICES HEADER
      ========================================================== */}
      <section id="services" className="scroll-mt-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Complete Calibration Solutions
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Calibration for every critical measurement.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Explore our complete range of calibration services for measuring
              and testing instruments.
            </p>
          </div>

          {/* Search */}
          <div className="mt-10 flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search calibration instrument..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-sm font-medium outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Reset Filters
            </button>
          </div>

          {/* Category filter */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition ${
                activeCategory === "all"
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Services
            </button>

            {calibrationCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition ${
                  activeCategory === category.id
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-200"
                }`}
              >
                {category.number}. {category.title.split(" Calibration")[0]}
              </button>
            ))}
          </div>

          {/* Service Cards */}
          <div className="mt-10 space-y-8">
            {filteredCategories.map((category) => {
              const Icon = category.icon;

              return (
                <article
                  key={category.id}
                  id={category.id}
                  className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-xl"
                >
                  <div className="grid lg:grid-cols-[330px_1fr]">
                    {/* Category intro */}
                    <div className="relative overflow-hidden bg-slate-950 p-7 text-white lg:p-9">
                      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

                      <div className="relative">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-cyan-300">
                            {category.number}
                          </span>

                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                            <Icon className="h-6 w-6 text-cyan-300" />
                          </div>
                        </div>

                        <h3 className="mt-12 text-2xl font-black leading-tight">
                          {category.title}
                        </h3>

                        <p className="mt-4 text-sm leading-6 text-slate-400">
                          {category.description}
                        </p>

                        <div className="mt-7 flex items-center gap-2 text-xs font-bold text-slate-300">
                          <Layers3 className="h-4 w-4 text-cyan-300" />
                          {category.items.length} Services / Instruments
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="p-6 lg:p-9">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {category.items.map((item) => (
                          <div
                            key={item}
                            className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-1 hover:border-cyan-200 hover:bg-cyan-50"
                          >
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                              <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                            </div>

                            <span className="text-sm font-semibold leading-5 text-slate-700 group-hover:text-slate-950">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredCategories.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center">
                <Search className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 text-xl font-black text-slate-950">
                  No calibration service found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Try another instrument name or reset the filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          FORCE RANGE
      ========================================================== */}
      <section
        id="force-range"
        className="relative scroll-mt-20 overflow-hidden bg-slate-950"
      >
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                Force Calibration
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                From 1 kN to 3000 kN.
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-400">
                Our Force Calibration Services cover a broad range of force
                capacities for testing machines and force measurement
                instruments.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10">
                  <Zap className="h-6 w-6 text-cyan-300" />
                </div>

                <div>
                  <p className="text-sm font-bold text-white">
                    Force Calibration Range
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Multiple capacities available
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl lg:p-8">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {forceRanges.map((range, index) => (
                  <div
                    key={range}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-cyan-300/10"
                  >
                    <div className="absolute bottom-0 left-0 h-1 bg-cyan-300 transition-all duration-500 group-hover:w-full" />

                    <p className="text-xs font-bold text-slate-500">
                      RANGE {String(index + 1).padStart(2, "0")}
                    </p>

                    <p className="mt-2 text-xl font-black text-white">
                      {range}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          BENEFITS
      ========================================================== */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Why ARCL Instruments
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Calibration without unnecessary complexity.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Award,
                title: "Experienced Team",
                text: "Years of experience in qualified calibration management of measuring instruments.",
              },
              {
                icon: ShieldCheck,
                title: "Reliable Service",
                text: "Professional calibration support to help instruments perform as expected.",
              },
              {
                icon: Clock3,
                title: "Save Time",
                text: "Reduce the time and resources required for calibration management.",
              },
              {
                icon: BadgeCheck,
                title: "Complete Support",
                text: "Flexible and responsive calibration services for multiple instrument types.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group rounded-[2rem] border border-slate-200 bg-slate-50 p-7 transition duration-300 hover:-translate-y-2 hover:bg-slate-950 hover:text-white hover:shadow-2xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition group-hover:bg-white/10">
                  <Icon className="h-6 w-6 text-cyan-600" />
                </div>

                <h3 className="mt-6 text-xl font-black">{title}</h3>

                <p className="mt-3 text-sm leading-6 text-slate-500 transition group-hover:text-slate-400">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          SERVICE LOCATIONS
      ========================================================== */}
      <section
        id="coverage"
        className="scroll-mt-20 bg-slate-50 border-y border-slate-200"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950">
                <MapPin className="h-6 w-6 text-cyan-300" />
              </div>

              <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-950">
                Calibration services across Maharashtra & India.
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                We serve our calibration services in Mumbai, Navi Mumbai,
                Kalyan, Thane, Palghar, Raigad, Nashik, Pune and across
                Maharashtra and in India.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {locations.map((location) => (
                <div
                  key={location}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-lg"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50">
                    <MapPin className="h-4 w-4 text-cyan-600" />
                  </div>

                  <span className="font-bold text-slate-800">
                    {location}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================== */}
      <section id="contact" className="scroll-mt-20 bg-white px-5 py-20 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-slate-950 px-7 py-14 text-center shadow-2xl sm:px-12 lg:py-20">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

          <div className="relative mx-auto max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              Need Calibration?
            </p>

            <h2 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Keep your measurements accurate.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Contact ARCL Instruments Pvt. Ltd. for flexible and responsive
              calibration services for your measuring and testing instruments.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/contact"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
              >
                Request Calibration
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>

              <Link
                to="/catalog"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 font-bold text-white transition hover:-translate-y-1 hover:bg-white/10"
              >
                Browse Catalog
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER NOTE
      ========================================================== */}
     
    </div>
  );
}

export default Calibration;
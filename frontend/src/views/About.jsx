"use client";

import React from "react";
import { Link } from "../utils/navigation.jsx";
import {
  ShieldCheck,
  Award,
  Cpu,
  Layers,
  Globe2,
  CheckCircle2,
  Building2,
  Compass,
  ArrowRight,
  Sparkles,
  FlaskConical,
  Gauge,
  Microscope,
  FileCheck,
  MapPin,
  Mail,
  Phone,
  Clock,
  Target,
} from "lucide-react";

const commitmentData = [
  {
    title: "Precision & Accuracy",
    text: "Engineered to deliver high-resolution measurements and consistent analytical results meeting international standards.",
    image:
      "https://images.pexels.com/photos/256381/pexels-photo-256381.jpeg?auto=compress&cs=tinysrgb&w=800",
    icon: <Gauge className="w-5 h-5 text-blue-400" />,
  },
  {
    title: "Scientific Innovation",
    text: "Integrating digital LCD controllers, smart microprocessors, and IoT-ready telemetry into everyday laboratory workflows.",
    image:
      "https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=800",
    icon: <Sparkles className="w-5 h-5 text-amber-400" />,
  },
  {
    title: "ISO & NABL Quality",
    text: "Rigorous multi-stage calibration and quality control under ISO 9001:2015 and ISO/IEC 17025 compliance frameworks.",
    image:
      "https://images.pexels.com/photos/832571/pexels-photo-832571.jpeg?auto=compress&cs=tinysrgb&w=800",
    icon: <Award className="w-5 h-5 text-emerald-400" />,
  },
  {
    title: "Ergonomic Operation",
    text: "User-centric design with intuitive controls, emergency safety cutoffs, and durable stainless steel construction.",
    image:
      "https://images.pexels.com/photos/2280551/pexels-photo-2280551.jpeg?auto=compress&cs=tinysrgb&w=800",
    icon: <Cpu className="w-5 h-5 text-purple-400" />,
  },
  {
    title: "Continuous Development",
    text: "Guided by feedback from civil engineering labs, pharmaceutical researchers, and institutional testing centers.",
    image:
      "https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=800",
    icon: <Compass className="w-5 h-5 text-cyan-400" />,
  },
  {
    title: "Safety & Reliability",
    text: "Built-in thermal protection, overload trip mechanisms, and heavy-duty industrial chassis for 24/7 durability.",
    image:
      "https://images.pexels.com/photos/4031522/pexels-photo-4031522.jpeg?auto=compress&cs=tinysrgb&w=800",
    icon: <ShieldCheck className="w-5 h-5 text-rose-400" />,
  },
];

const offerData = [
  {
    number: "01",
    title: "Concrete & Structure Testing",
    desc: "Compressive strength, workability, and durability analyzers for construction engineering.",
    icon: <Building2 className="w-6 h-6 text-[#021C57]" />,
    items: [
      "Digital Compression Testing Machines (CTM)",
      "Flexural Strength Testing Apparatus",
      "Concrete Cube Moulds & Vibrating Tables",
      "Slump Cone & Flow Test Apparatus",
      "Concrete Permeability & Air Entrainment",
      "Core Drilling & Cutting Machines",
    ],
  },
  {
    number: "02",
    title: "Aggregate & Quarry Testing",
    desc: "Particle grading, impact resistance, and mechanical abrasion evaluation instruments.",
    icon: <Layers className="w-6 h-6 text-[#021C57]" />,
    items: [
      "Aggregate Impact & Crushing Value Apparatus",
      "Los Angeles Abrasion Testing Machine",
      "Motorized Sieve Shakers (Gyratory)",
      "Flakiness & Elongation Gauges",
      "Specific Gravity & Water Absorption Baskets",
      "Riffle Sample Splitters",
    ],
  },
  {
    number: "03",
    title: "Cement & Binder Analysis",
    desc: "Soundness, fineness, consistency, and initial/final setting time instruments.",
    icon: <FlaskConical className="w-6 h-6 text-[#021C57]" />,
    items: [
      "Vicat Needle Apparatus (Standard & Digital)",
      "Le Chatelier Soundness Water Bath",
      "Blaine Air Permeability Fineness Apparatus",
      "Mortar Flow Tables & Cube Compressors",
      "Standard Cement Autoclaves",
      "Length Comparators with Digital Dial",
    ],
  },
  {
    number: "04",
    title: "Soil Mechanics & Geotechnical",
    desc: "Compaction, CBR bearing ratio, shear parameters, and soil classification apparatus.",
    icon: <Gauge className="w-6 h-6 text-[#021C57]" />,
    items: [
      "California Bearing Ratio (CBR) Test Apparatus",
      "Direct Shear & Triaxial Compression Machines",
      "Standard & Modified Proctor Compaction",
      "Liquid & Plastic Limit (Casagrande) Devices",
      "Constant/Variable Head Permeameters",
      "Universal Soil Unconfined Extruders",
    ],
  },
  {
    number: "05",
    title: "Non-Destructive Testing (NDT)",
    desc: "In-situ structural integrity assessment without damaging concrete or structural components.",
    icon: <Microscope className="w-6 h-6 text-[#021C57]" />,
    items: [
      "Digital & Mechanical Rebound Test Hammers",
      "Ultrasonic Pulse Velocity (UPV) Testers",
      "Electromagnetic Concrete Cover Meters",
      "Digital Crack Width Measuring Microscopes",
      "Rebar Locators & Corrosion Analyzers",
      "Pull-Off Adhesion Strength Testers",
    ],
  },
  {
    number: "06",
    title: "Thermal & General Lab Equipment",
    desc: "Temperature-controlled chambers, environmental ovens, and general sample preparation.",
    icon: <Cpu className="w-6 h-6 text-[#021C57]" />,
    items: [
      "High-Temperature Muffle Furnaces (1200°C)",
      "Digital Laboratory Drying Ovens",
      "Constant Temperature Curing Tanks",
      "Precision Analytical Electronic Balances",
      "Humidity & Environmental Chambers",
      "Ultrasonic Cleaners & Processors",
    ],
  },
];

const rdSteps = [
  { step: "01", title: "Concept & Lab Needs Analysis", desc: "Consulting research standards (IS, ASTM, BS, EN)." },
  { step: "02", title: "CAD Design & Structural Modeling", desc: "Stress analysis and ergonomic hardware layout." },
  { step: "03", title: "High-Precision Prototyping", desc: "CNC fabrication with medical/industrial steel alloys." },
  { step: "04", title: "Microprocessor & Sensor Integration", desc: "High-speed ADC, LCD touchscreens, and digital telemetry." },
  { step: "05", title: "Multi-Point Traceable Calibration", desc: "NABL-traceable reference load cells & transducers." },
  { step: "06", title: "Continuous Stress & Safety Testing", desc: "10,000+ continuous load cycles and thermal stress." },
  { step: "07", title: "Final Dispatch Certification", desc: "Comprehensive calibration certificate and documentation." },
];

const qualityStandards = [
  {
    badge: "ISO 9001:2015",
    title: "Quality Management System",
    desc: "Standardized manufacturing workflows, full traceability, and continuous operational audit compliance.",
  },
  {
    badge: "ISO/IEC 17025",
    title: "Calibration & Testing Competence",
    desc: "Adherence to international technical criteria for laboratory calibration accuracy and repeatability.",
  },
  {
    badge: "NABL Traceability",
    title: "National Accreditation Standards",
    desc: "Instruments pre-calibrated against National Physical Laboratory (NPL) reference standards.",
  },
  {
    badge: "Bureau of Indian Standards (BIS)",
    title: "IS Specification Alignment",
    desc: "Custom-configured for IS 516, IS 2720, IS 2386, IS 4031, and ASTM C39 compliance.",
  },
];

export default function About() {
  return (
    <main className="min-h-screen bg-slate-50/50 text-[#021C57] selection:bg-blue-900 selection:text-white">
      
      {/* =====================================================
          1. HERO BANNER WITH INDUSTRIAL GRADIENT
      ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#021C57] via-[#042878] to-[#01143d] text-white py-20 md:py-28 px-4 sm:px-6 lg:px-12">
        
        {/* Decorative Grid & Glow Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* LEFT: HERO COPY */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-cyan-300 text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Leading Laboratory Instrument Manufacturer
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Engineering <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-white">Precision & Trust</span> Across India.
              </h1>

              <p className="text-blue-100/90 text-base sm:text-lg leading-relaxed max-w-2xl font-light">
                <strong className="font-semibold text-white">ARCL Instruments Private Limited</strong> designs, manufactures, and calibrates high-precision testing instruments for Civil, Mechanical, Geotechnical, and Quality Control laboratories across India.
              </p>

              {/* ACCREDITATION BADGES */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                {["ISO 9001:2015 Certified", "ISO/IEC 17025 Compliant", "NABL Traceable", "Make in India 🇮🇳"].map((tag) => (
                  <span
                    key={tag}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-blue-200 backdrop-blur-sm shadow-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
                >
                  Explore Equipment Catalogue <ArrowRight size={16} />
                </Link>

                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-6 py-3.5 rounded-2xl backdrop-blur-md transition cursor-pointer text-sm"
                >
                  <FileCheck size={16} /> Download PDF Catalog
                </Link>
              </div>

            </div>

            {/* RIGHT: STATS & HIGHLIGHTS CARD */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
                
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">ARCL At A Glance</h3>
                    <p className="text-xs text-blue-200">Industrial Testing Benchmark</p>
                  </div>
                  <span className="p-2.5 rounded-2xl bg-cyan-400/20 text-cyan-300">
                    <ShieldCheck size={24} />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 transition hover:bg-white/10">
                    <div className="text-3xl font-black text-cyan-300">2,000+</div>
                    <div className="text-xs font-semibold text-white mt-1">Instruments Shipped</div>
                    <div className="text-[11px] text-blue-200 mt-0.5">Across all Indian states</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 transition hover:bg-white/10">
                    <div className="text-3xl font-black text-cyan-300">100%</div>
                    <div className="text-xs font-semibold text-white mt-1">Calibrated Accuracy</div>
                    <div className="text-[11px] text-blue-200 mt-0.5">Multi-point validation</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 transition hover:bg-white/10">
                    <div className="text-3xl font-black text-cyan-300">15+</div>
                    <div className="text-xs font-semibold text-white mt-1">Core Categories</div>
                    <div className="text-[11px] text-blue-200 mt-0.5">Civil, NDT, Soil, Cement</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 transition hover:bg-white/10">
                    <div className="text-3xl font-black text-cyan-300">24/7</div>
                    <div className="text-xs font-semibold text-white mt-1">Technical Support</div>
                    <div className="text-[11px] text-blue-200 mt-0.5">Pan-India engineer visits</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-white/15 flex items-center gap-3.5">
                  <Globe2 className="text-cyan-300 shrink-0" size={24} />
                  <p className="text-xs text-blue-100 leading-snug">
                    Headquartered in <strong>Airoli, Navi Mumbai</strong> with nationwide logistics & calibration service network.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>

      </section>

      {/* =====================================================
          2. CORPORATE OVERVIEW & CORE MISSION
      ===================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 md:py-24 space-y-16">
        
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* IMAGE WITH INDUSTRIAL BADGE */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200 group">
              <img
                src="https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Laboratory testing scientist"
                className="w-full h-[450px] object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#021C57]/90 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                <p className="text-xs uppercase tracking-widest text-cyan-300 font-bold">Industrial Standard Quality</p>
                <p className="text-sm font-medium mt-1">Every machine is calibrated to deliver unmatched accuracy in daily testing procedures.</p>
              </div>
            </div>

            {/* FLOATING EXPERIENCE BADGE */}
            <div className="absolute -top-6 -right-6 hidden sm:flex items-center gap-3 bg-[#021C57] text-white p-4 rounded-2xl shadow-xl border border-blue-900">
              <Building2 className="text-cyan-400" size={28} />
              <div>
                <div className="text-xl font-bold">Airoli, Navi Mumbai</div>
                <div className="text-[11px] text-blue-200">State-of-the-art Manufacturing Facility</div>
              </div>
            </div>
          </div>

          {/* TEXT DESCRIPTION */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
              <Building2 size={14} /> Who We Are
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#021C57] tracking-tight">
              Driving Scientific & Engineering Progress with Advanced Equipment
            </h2>

            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              <strong>ARCL Instruments Private Limited</strong> manufactures advanced laboratory equipment designed to meet the rigorous demands of civil infrastructure projects, university research centers, industrial quality assurance, and commercial testing laboratories.
            </p>

            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              From initial structural modeling to multi-point sensor calibration, every product undergoes comprehensive evaluation to ensure robust durability, easy maintenance, and strict adherence to Bureau of Indian Standards (BIS) and ASTM parameters.
            </p>

            {/* BULLET HIGHLIGHTS */}
            <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
              {[
                "Certified Testing Precision",
                "High-Grade Industrial Alloys",
                "Digital Microprocessor Telemetry",
                "Pan-India Calibration Support",
              ].map((point) => (
                <div key={point} className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
                  <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* =====================================================
            MISSION & VISION CARDS
        ===================================================== */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* MISSION */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#021C57] to-[#063394] text-white p-8 sm:p-10 rounded-3xl shadow-xl space-y-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">Core Purpose</span>
              <span className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <Target size={22} className="text-cyan-300" />
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold">Our Mission</h3>

            <p className="text-blue-100 text-sm sm:text-base leading-relaxed font-light">
              To empower civil testing professionals, scientists, and infrastructure developers with high-reliability laboratory instruments that eliminate measurement variances, optimize test cycles, and support scientific validation across every discipline.
            </p>
          </div>

          {/* VISION */}
          <div className="relative overflow-hidden bg-white border border-gray-200 text-[#021C57] p-8 sm:p-10 rounded-3xl shadow-lg space-y-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full pointer-events-none"></div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Strategic Horizon</span>
              <span className="p-3 bg-blue-50 rounded-2xl">
                <Compass size={22} className="text-blue-600" />
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold">Our Vision</h3>

            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              To be India's most trusted and innovative manufacturer of laboratory testing instruments, setting the benchmark for precision engineering, digital automation, customer-first service, and long-term instrument reliability.
            </p>
          </div>

        </div>

      </section>

      {/* =====================================================
          3. COMPREHENSIVE PRODUCT OFFERINGS
      ===================================================== */}
      <section className="bg-white border-y border-gray-100 py-16 md:py-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
              <Layers size={14} /> Comprehensive Portfolio
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#021C57]">
              Laboratory & Testing Solutions We Offer
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              Engineered to meet Indian and International testing standards (IS, ASTM, BS, EN) across key engineering domains.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerData.map((category) => (
              <div
                key={category.number}
                className="bg-slate-50/70 border border-gray-200/80 rounded-3xl p-7 flex flex-col justify-between hover:bg-white hover:border-blue-300 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-center font-bold text-xs text-[#021C57]">
                      {category.number}
                    </span>
                    <span className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                      {category.icon}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#021C57] group-hover:text-blue-700 transition">
                    {category.title}
                  </h3>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    {category.desc}
                  </p>

                  <div className="pt-2 border-t border-gray-200/60 space-y-2">
                    {category.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <Link
                    to="/products"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#021C57] hover:bg-[#021C57] hover:text-white transition shadow-2xs cursor-pointer"
                  >
                    View Associated Equipment <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =====================================================
          4. R&D AND MANUFACTURING ROADMAP
      ===================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 md:py-24 space-y-12">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
            <Cpu size={14} /> Rigorous Engineering
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#021C57]">
            Research, Development & Quality Pipeline
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">
            From raw materials to final calibration, each testing instrument goes through a controlled 7-step engineering pipeline.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {rdSteps.map((step, idx) => (
            <div
              key={step.step}
              className={`bg-white border rounded-3xl p-6 shadow-xs relative space-y-3 hover:shadow-lg transition ${
                idx === 6 ? "sm:col-span-2 lg:col-span-2 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-[#021C57] text-white flex items-center justify-center text-xs font-bold">
                  {step.step}
                </span>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Phase {idx + 1}</span>
              </div>

              <h3 className="font-bold text-[#021C57] text-base leading-snug">
                {step.title}
              </h3>

              <p className="text-xs text-gray-500 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

      </section>

      {/* =====================================================
          5. QUALITY STANDARDS & ACCREDITATIONS
      ===================================================== */}
      <section className="bg-[#021C57] text-white py-16 md:py-24 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto space-y-12 relative z-10">
          
          <div className="grid lg:grid-cols-12 gap-8 items-center border-b border-white/10 pb-10">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-300 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15">
                <Award size={14} /> Uncompromising Compliance
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Internationally Recognized Quality Standards
              </h2>
              <p className="text-blue-200 text-sm sm:text-base max-w-2xl font-light">
                ARCL instruments are manufactured, inspected, and validated under ISO 9001:2015 frameworks with NABL traceability, ensuring peace of mind during internal and external audits.
              </p>
            </div>

            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-md">
                <div className="text-2xl font-black text-cyan-300">100% Traceability</div>
                <div className="text-xs text-blue-200 mt-1">Calibration Certificates included with each shipment.</div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {qualityStandards.map((std) => (
              <div
                key={std.badge}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition backdrop-blur-md space-y-3"
              >
                <div className="inline-block px-3 py-1 rounded-lg bg-cyan-400/20 text-cyan-300 text-xs font-bold">
                  {std.badge}
                </div>
                <h3 className="font-bold text-white text-base">
                  {std.title}
                </h3>
                <p className="text-xs text-blue-200 leading-relaxed font-light">
                  {std.desc}
                </p>
              </div>
            ))}
          </div>

        </div>

      </section>

      {/* =====================================================
          6. CORE VALUES & COMMITMENT
      ===================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 md:py-24 space-y-12">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
            <ShieldCheck size={14} /> Our Core Values
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#021C57]">
            The Pillars of ARCL Instruments
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">
            Guiding every interaction, engineering decision, and instrument delivery across the nation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {commitmentData.map((val) => (
            <div
              key={val.title}
              className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={val.image}
                  alt={val.title}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 text-white">
                  {val.icon}
                </div>
              </div>

              <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#021C57] group-hover:text-blue-600 transition">
                    {val.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mt-2">
                    {val.text}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-[11px] font-bold text-blue-600">
                  <span>Guaranteed Standard</span>
                  <CheckCircle2 size={13} />
                </div>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* =====================================================
          7. PAN-INDIA PRESENCE & CORPORATE HEADQUARTERS
      ===================================================== */}
      <section className="bg-slate-900 text-white py-16 md:py-20 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-300 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15">
              <MapPin size={14} /> Corporate Headquarters
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Pan-India Supply & Technical Network
            </h2>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Based out of Navi Mumbai, Maharashtra, ARCL Instruments maintains direct supply channels, spare parts availability, on-site installation, and calibration engineers servicing laboratory infrastructure across all 28 states and union territories.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-cyan-400 shrink-0 mt-1" size={20} />
                <div className="text-xs leading-relaxed text-gray-200">
                  <strong className="text-white text-sm block">ARCL INSTRUMENTS PRIVATE LIMITED</strong>
                  Shop No. 6, Siddivinayak Park CHS, Sector - 8A, Airoli, Navi Mumbai - 400708, Maharashtra, India
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <Mail size={15} className="text-cyan-400" />
                    <span> 
                      <a
                          href="mailto:arclinstruments@gmail.com"
                          className="hover:underline transition-all"
                        >
                          arclinstruments@gmail.com
                      </a>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-cyan-400" />
                  <span>Mon - Sat: 9:30 AM - 6:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/10 border border-white/15 rounded-3xl p-8 backdrop-blur-xl text-center space-y-6">
            <div className="text-6xl">🇮🇳</div>
            <div>
              <h3 className="text-2xl font-bold text-white">Make In India</h3>
              <p className="text-xs text-blue-200 mt-1">Proudly engineered and manufactured in Maharashtra for global standards.</p>
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              <Link
                to="/contact"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-sm shadow-lg transition"
              >
                Contact Engineering Support
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* =====================================================
          8. BOTTOM CALL-TO-ACTION (CTA)
      ===================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16">
        <div className="bg-gradient-to-r from-[#021C57] to-[#043399] rounded-3xl p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="text-cyan-300 text-xs font-bold uppercase tracking-widest">Ready to upgrade your laboratory?</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Request a Custom Equipment Quote or Calibration Catalog
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              Get in touch with our applications engineering team for technical datasheets, tender specifications, and custom instrument fabrication.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/catalog"
              className="bg-white/15 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3.5 rounded-2xl text-xs transition cursor-pointer"
            >
              Browse Catalog
            </Link>
            <Link
              to="/contact"
              className="bg-cyan-400 hover:bg-cyan-300 text-[#021C57] font-extrabold px-6 py-3.5 rounded-2xl text-xs shadow-lg transition cursor-pointer"
            >
              Request Quote
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
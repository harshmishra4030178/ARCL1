import React from "react";
import Link from "next/link";
import {
  FaCheckCircle,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFilePdf,
  FaCertificate,
  FaArrowRight,
  FaShieldAlt,
  FaCube,
  FaLayerGroup,
  FaRoad,
  FaFlask,
  FaHardHat,
  FaTools,
  FaBookOpen,
} from "react-icons/fa";

export const metadata = {
  title: "Best Civil Lab Equipment & Testing Setups in Mumbai | ARCL Instruments",
  description:
    "Looking for the best civil lab equipment & material testing solutions in Mumbai? ARCL Instruments supplies certified concrete, soil, bitumen, aggregate & NDT testing setups with NABL calibration.",
  keywords: [
    "best civil lab in mumbai",
    "best civil lab equipment supplier in mumbai",
    "civil laboratory in Mumbai",
    "civil lab equipment supplier in Mumbai",
    "civil testing laboratory Mumbai",
    "civil engineering laboratory Mumbai",
    "material testing laboratory Mumbai",
    "civil lab equipment manufacturers in Mumbai",
    "concrete testing equipment Mumbai",
    "soil testing equipment Mumbai",
    "aggregate testing equipment Mumbai",
    "bitumen testing equipment Mumbai",
    "NDT equipment Mumbai",
    "civil lab machine calibration Mumbai",
    "ARCL Instruments Private Limited",
  ],
  alternates: {
    canonical: "https://arclinstruments.com/civil-lab-equipment-mumbai",
  },
  openGraph: {
    title: "Best Civil Lab Equipment & Testing Solutions in Mumbai | ARCL Instruments",
    description:
      "ARCL Instruments Private Limited supplies certified civil laboratory equipment, concrete testing machines, soil CBR testers, aggregate sieve shakers, and NDT apparatus across Mumbai.",
    url: "https://arclinstruments.com/civil-lab-equipment-mumbai",
    siteName: "ARCL Instruments Private Limited",
    images: [
      {
        url: "https://arclinstruments.com/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "Best Civil Lab Equipment & Testing Solutions in Mumbai - ARCL Instruments Private Limited",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Civil Lab Equipment & Testing Setups in Mumbai | ARCL Instruments",
    description:
      "Reliable civil laboratory testing machines and on-site NABL calibration services across Mumbai and MMR.",
    images: ["https://arclinstruments.com/assets/LOGO.png"],
  },
};

const mumbaiJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://arclinstruments.com",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Civil Lab Equipment & Testing in Mumbai",
          "item": "https://arclinstruments.com/civil-lab-equipment-mumbai",
        },
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://arclinstruments.com/civil-lab-equipment-mumbai#localbusiness",
      "name": "ARCL Instruments Private Limited - Mumbai Civil Testing Hub",
      "alternateName": "ARCL Civil Lab Equipment Mumbai",
      "url": "https://arclinstruments.com/civil-lab-equipment-mumbai",
      "logo": "https://arclinstruments.com/assets/LOGO.png",
      "image": "https://arclinstruments.com/assets/LOGO.png",
      "description":
        "Leading manufacturer and supplier of precision civil engineering laboratory equipment, material testing machines, and NABL calibration services across Mumbai and the Mumbai Metropolitan Region.",
      "telephone": "+91-8169695728",
      "email": "arclinstruments@gmail.com",
      "priceRange": "₹₹",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli",
        "addressLocality": "Navi Mumbai",
        "addressRegion": "Maharashtra",
        "postalCode": "400708",
        "addressCountry": "IN",
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 19.1551,
        "longitude": 72.9984,
      },
      "areaServed": [
        { "@type": "City", "name": "Mumbai" },
        { "@type": "AdministrativeArea", "name": "Mumbai Suburban" },
        { "@type": "AdministrativeArea", "name": "South Mumbai" },
        { "@type": "AdministrativeArea", "name": "Western Suburbs Mumbai" },
        { "@type": "AdministrativeArea", "name": "Eastern Suburbs Mumbai" },
        { "@type": "AdministrativeArea", "name": "Navi Mumbai" },
        { "@type": "AdministrativeArea", "name": "Thane" },
        { "@type": "AdministrativeArea", "name": "Maharashtra" },
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Civil Laboratory Equipment & Testing Setups",
        "itemListElement": [
          {
            "@type": "OfferCatalog",
            "name": "Concrete Testing Laboratory Equipment",
            "itemListElement": [
              { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Digital Compression Testing Machine (CTM 2000kN / 3000kN)" } },
              { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Cast Iron Concrete Cube Moulds (150mm & 70.6mm)" } },
              { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Slump Test Apparatus" } },
            ],
          },
          {
            "@type": "OfferCatalog",
            "name": "Soil Geotechnical Testing Equipment",
            "itemListElement": [
              { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Motorized CBR Test Apparatus (IS 2720 Part 16)" } },
              { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Direct Shear Test Apparatus 12 Speed" } },
              { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Standard Penetration Test (SPT) Apparatus" } },
            ],
          },
        ],
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://arclinstruments.com/civil-lab-equipment-mumbai#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Where can I find the best civil lab equipment and testing setups in Mumbai?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "ARCL Instruments Private Limited is a premier manufacturer and supplier of civil engineering laboratory equipment in Mumbai. We provide complete testing setups for concrete, soil, bitumen, aggregates, cement, and non-destructive testing (NDT), complying with Bureau of Indian Standards (IS Codes), ASTM, and BS specifications with direct factory delivery across Mumbai and MMR.",
          },
        },
        {
          "@type": "Question",
          "name": "What equipment is required to set up a civil testing laboratory in Mumbai?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A standard civil testing laboratory requires: (1) Concrete Testing: Compression Testing Machine (CTM), cube moulds, slump cone, curing tank; (2) Soil Mechanics: CBR test apparatus, direct shear machine, Proctor compaction, sand pouring cylinder; (3) Aggregates: motorized sieve shaker, test sieves, impact value tester, flakiness gauge; (4) Bitumen: ductility apparatus, penetrometer, Marshall stability setup; and (5) NDT: digital rebound hammer and UPV tester.",
          },
        },
        {
          "@type": "Question",
          "name": "Do ARCL Instruments machines comply with Bureau of Indian Standards (IS Codes)?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, all ARCL Instruments testing machines and apparatus strictly comply with relevant Indian Standards including IS 516 (Concrete), IS 2720 (Soil), IS 2386 (Aggregates), IS 1208 (Bitumen), IS 4031 (Cement), and IS 13311 (NDT), as well as ASTM, BS, and MoRTH technical specifications.",
          },
        },
        {
          "@type": "Question",
          "name": "Does ARCL provide on-site calibration and commissioning in Mumbai?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, ARCL Instruments provides expert on-site equipment installation, operator training, and NABL-traceable load cell, proving ring, and dimensional calibration across all Mumbai job sites, RMC plants, and quality control testing laboratories.",
          },
        },
        {
          "@type": "Question",
          "name": "What is the delivery timeline for civil lab equipment in Mumbai?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Standard testing instruments and consumables such as cube moulds, slump cones, sieves, and balances are dispatched within 24 to 48 hours across Mumbai. Heavy testing machines such as digital Compression Testing Machines (CTM) are delivered within 3 to 7 working days.",
          },
        },
        {
          "@type": "Question",
          "name": "Can ARCL Instruments set up complete civil engineering college laboratories in Mumbai?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, ARCL Instruments specializes in end-to-end turnkey civil engineering laboratory setup for engineering colleges, polytechnics, university research centres, and government QA/QC testing departments across Mumbai, Navi Mumbai, and Maharashtra.",
          },
        },
      ],
    },
  ],
};

export default function CivilLabEquipmentMumbaiPage() {
  const categories = [
    {
      title: "Concrete Testing Laboratory Equipment",
      code: "IS 516, IS 1199, IS 9013, ASTM C39",
      desc: "Automatic Compression Testing Machines (CTM 2000kN / 3000kN), Cast Iron Cube Moulds, Flexural Beam Testers, Slump Cones, and Accelerated Curing Tanks.",
      link: "/categories/concrete-testing-equipment",
      icon: <FaCube className="text-blue-600 text-2xl" />,
      items: ["Digital CTM 2000kN / 3000kN", "Cast Iron Cube Moulds (150mm & 70.6mm)", "Slump Test Apparatus with Tamping Rod", "Compaction Factor & Accelerated Curing Tank"],
    },
    {
      title: "Soil Geotechnical & Subgrade Laboratory",
      code: "IS 2720, IS 2131, IS 4968, ASTM D1883",
      desc: "Motorized California Bearing Ratio (CBR) Test Apparatus, Direct Shear Apparatus (12 Speed), Proctor Compaction Moulds, Liquid Limit, and SPT/DCPT penetrometers.",
      link: "/categories/soil-testing-equipment",
      icon: <FaLayerGroup className="text-emerald-600 text-2xl" />,
      items: ["Motorized CBR Test Apparatus", "Direct Shear Test Setup (12 Speed)", "Standard Penetration Test (SPT) Apparatus", "Core Cutter & Sand Pouring Cylinder"],
    },
    {
      title: "Aggregate & Road Material Testing Equipment",
      code: "IS 2386, IS 460, ASTM C136, BS 812",
      desc: "Motorized Sieve Shakers, Brass & GI Test Sieves, Aggregate Impact Testers, Los Angeles Abrasion Machines, and Thickness/Length Flakiness Gauges.",
      link: "/categories/aggregate-testing-equipment",
      icon: <FaRoad className="text-amber-600 text-2xl" />,
      items: ["Motorized Sieve Shakers & GI Sieves", "Aggregate Impact Value Apparatus", "Los Angeles Abrasion Testing Machine", "Flakiness & Elongation Thickness Gauges"],
    },
    {
      title: "Bitumen & Asphalt Highway Laboratory",
      code: "IS 1208, IS 1203, IS 1205, ASTM D6927",
      desc: "Digital Ductility Testing Machines, Automatic Penetrometers, Ring and Ball Softening Point Apparatus, and Marshall Stability Test Systems with load cells.",
      link: "/categories/bitumen-testing-equipment",
      icon: <FaFlask className="text-purple-600 text-2xl" />,
      items: ["Digital Ductility Testing Machine (27°C)", "Standard & Automatic Penetrometer", "Ring and Ball Softening Point Setup", "Marshall Stability Apparatus with Flow Meter"],
    },
    {
      title: "Cement & Mortar Quality Testing Equipment",
      code: "IS 4031, IS 5512, IS 5513, IS 10080",
      desc: "Vicat Apparatus with Dashpot, Le-Chatelier Soundness Moulds & Water Bath, Mortar Vibrating Machines, and Standard Ennore Sand for compressive strength.",
      link: "/categories/cement-testing-equipment",
      icon: <FaHardHat className="text-rose-600 text-2xl" />,
      items: ["Vicat Apparatus with Plungers & Needles", "Le-Chatelier Soundness Moulds & Bath", "Mortar Vibrating Machine (IS 10080)", "Standard Sand (Ennore) & Cube Moulds 70.6mm"],
    },
    {
      title: "Non-Destructive Testing (NDT) & Surveying",
      code: "IS 13311, ASTM C805, ASTM C597, ISO 17123",
      desc: "Digital Concrete Rebound Hammers, Ultrasonic Pulse Velocity (UPV) Testers, Rebar Locators, Core Drilling Machines, and Sokkia/Leica Auto Levels.",
      link: "/categories/non-destructive-testing-ndt-equipment",
      icon: <FaShieldAlt className="text-indigo-600 text-2xl" />,
      items: ["Digital Concrete Rebound Hammer (IS 13311)", "Ultrasonic Pulse Velocity (UPV) Tester", "Rebar Cover Meter & Concrete Core Cutter", "Precision Auto Levels & Aluminium Staffs"],
    },
  ];

  const mumbaiAreas = [
    { name: "South Mumbai", desc: "Nariman Point, Fort, Colaba, Worli, Lower Parel, Byculla" },
    { name: "Central Mumbai & BKC", desc: "Bandra-Kurla Complex (BKC), Dadar, Parel, Kurla, Sion" },
    { name: "Western Suburbs", desc: "Andheri, Vile Parle, Goregaon, Malad, Kandivali, Borivali, Dahisar" },
    { name: "Eastern Suburbs", desc: "Ghatkopar, Chembur, Vikhroli, Bhandup, Mulund, Kanjurmarg" },
    { name: "Navi Mumbai Hub", desc: "Airoli (Headquarters), Vashi, Mahape, Turbhe, Belapur, Taloja MIDC" },
    { name: "Thane & MMR Corridor", desc: "Thane West, Wagle Estate, Ghodbunder Road, Kalyan, Dombivli, Bhiwandi" },
  ];

  const faqs = [
    {
      q: "Where can I find the best civil lab equipment and testing setups in Mumbai?",
      a: "ARCL Instruments Private Limited is a premier manufacturer and supplier of civil engineering laboratory equipment in Mumbai. We provide complete testing setups for concrete, soil, bitumen, aggregates, cement, and non-destructive testing (NDT), complying with Bureau of Indian Standards (IS Codes), ASTM, and BS specifications with direct factory delivery across Mumbai and MMR.",
    },
    {
      q: "What equipment is required to set up a civil testing laboratory in Mumbai?",
      a: "A standard civil testing laboratory requires: (1) Concrete Testing: Compression Testing Machine (CTM), cube moulds, slump cone, curing tank; (2) Soil Mechanics: CBR test apparatus, direct shear machine, Proctor compaction, sand pouring cylinder; (3) Aggregates: motorized sieve shaker, test sieves, impact value tester, flakiness gauge; (4) Bitumen: ductility apparatus, penetrometer, Marshall stability setup; and (5) NDT: digital rebound hammer and UPV tester.",
    },
    {
      q: "Do ARCL Instruments machines comply with Bureau of Indian Standards (IS Codes)?",
      a: "Yes, all ARCL Instruments testing machines and apparatus strictly comply with relevant Indian Standards including IS 516 (Concrete), IS 2720 (Soil), IS 2386 (Aggregates), IS 1208 (Bitumen), IS 4031 (Cement), and IS 13311 (NDT), as well as ASTM, BS, and MoRTH technical specifications.",
    },
    {
      q: "Does ARCL provide on-site calibration and commissioning in Mumbai?",
      a: "Yes, ARCL Instruments provides expert on-site equipment installation, operator training, and NABL-traceable load cell, proving ring, and dimensional calibration across all Mumbai job sites, RMC plants, and quality control testing laboratories.",
    },
    {
      q: "What is the delivery timeline for civil lab equipment in Mumbai?",
      a: "Standard testing instruments and consumables such as cube moulds, slump cones, sieves, and balances are dispatched within 24 to 48 hours across Mumbai. Heavy testing machines such as digital Compression Testing Machines (CTM) are delivered within 3 to 7 working days.",
    },
    {
      q: "Can ARCL Instruments set up complete civil engineering college laboratories in Mumbai?",
      a: "Yes, ARCL Instruments specializes in end-to-end turnkey civil engineering laboratory setup for engineering colleges, polytechnics, university research centres, and government QA/QC testing departments across Mumbai, Navi Mumbai, and Maharashtra.",
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mumbaiJsonLd) }}
      />

      <div className="bg-gray-50 min-h-screen">
        {/* BREADCRUMB */}
        <div className="bg-white border-b border-gray-100 py-3 px-4 sm:px-6 lg:px-12 text-xs text-gray-500">
          <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
            <Link href="/" className="hover:text-blue-600 transition">Home</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Civil Lab Equipment &amp; Testing in Mumbai</span>
          </div>
        </div>

        {/* HERO SECTION */}
        <section className="bg-gradient-to-br from-[#021C57] via-[#043399] to-[#021C57] text-white py-14 md:py-20 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <FaCertificate /> ISO 9001:2015 Certified Manufacturer &amp; Supplier
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl leading-tight">
              Premier Civil Laboratory Equipment &amp; Testing Solutions in Mumbai
            </h1>

            <p className="text-blue-100 text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed">
              ARCL Instruments Private Limited is India’s premier manufacturer and trusted supplier of certified civil engineering laboratory equipment, material testing machines, and on-site NABL calibration setups across Mumbai, South Mumbai, Western Suburbs, Eastern Suburbs, and the Mumbai Metropolitan Region (MMR).
            </p>

            {/* Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-3xl text-xs sm:text-sm">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
                <FaCheckCircle className="text-emerald-400 shrink-0" />
                <span>IS / ASTM / BS Compliant</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
                <FaCheckCircle className="text-emerald-400 shrink-0" />
                <span>NABL Traceable Calibration</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
                <FaCheckCircle className="text-emerald-400 shrink-0" />
                <span>Pan-Mumbai 24-48h Dispatch</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
                <FaCheckCircle className="text-emerald-400 shrink-0" />
                <span>Direct Factory Pricing</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-3.5">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-7 py-3.5 rounded-2xl shadow-lg transition text-xs sm:text-sm"
              >
                <span>Request Instant Mumbai Quote</span>
                <FaArrowRight />
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-6 py-3.5 rounded-2xl border border-white/30 backdrop-blur-md transition text-xs sm:text-sm"
              >
                <FaFilePdf />
                <span>Download Master Catalogue</span>
              </Link>
              <Link
                href="/standards"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-6 py-3.5 rounded-2xl border border-white/30 backdrop-blur-md transition text-xs sm:text-sm"
              >
                <FaBookOpen />
                <span>IS Standards Hub</span>
              </Link>
              <a
                href="tel:+918169695728"
                className="inline-flex items-center gap-2 text-blue-200 hover:text-white text-xs sm:text-sm font-semibold pl-2"
              >
                <FaPhoneAlt className="text-amber-400" /> +91 8169695728
              </a>
            </div>
          </div>
        </section>

        {/* MAIN BODY CONTENT */}
        <div className="max-w-7xl mx-auto py-12 md:py-16 px-4 sm:px-6 lg:px-12 space-y-16">

          {/* 1. INTRODUCTION & SEARCH INTENT SECTION */}
          <section className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xs space-y-5">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-[#021C57] tracking-tight">
                Complete Civil Laboratory Setup &amp; Testing Equipment in Mumbai
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm">
                Precision testing setups for contractors, RMC plants, consulting engineers, third-party testing laboratories, and academic institutions.
              </p>
            </div>

            <p className="text-gray-700 text-sm md:text-base leading-relaxed">
              Mumbai’s infrastructure landscape—spanning high-rise towers, Mumbai Metro rail lines, coastal expressways, bridges, and sea links—demands uncompromising material quality control. Every batch of concrete, soil stratum, aggregate supply, and bituminous asphalt mix must be verified against rigorous Bureau of Indian Standards (IS Codes) and MoRTH specifications.
            </p>

            <p className="text-gray-700 text-sm md:text-base leading-relaxed">
              <strong>ARCL Instruments Private Limited</strong> provides complete, calibrated, and robust testing setups that empower QA/QC engineers to determine the compressive strength of concrete, the bearing capacity of soil subgrades, the particle distribution of aggregates, and the elasticity of bituminous binders with scientific accuracy and NABL traceability.
            </p>
          </section>

          {/* 2. PRODUCT CATEGORIES GRID */}
          <section className="space-y-6">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#021C57] tracking-tight">
                Civil Testing Equipment &amp; Machinery Supplied Across Mumbai
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                Explore our full line of material testing machines, calibrated to IS, ASTM, BS, and AASHTO specifications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                      {cat.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {cat.title}
                    </h3>
                    <div className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
                      {cat.code}
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      {cat.desc}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      {cat.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={cat.link}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#021C57] hover:text-blue-700 transition pt-2"
                  >
                    <span>View All {cat.title.split(" ")[0]} Machines</span>
                    <FaArrowRight className="text-[10px]" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* 3. TURNKEY LAB SETUP SECTION */}
          <section className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xs space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-[#021C57] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200">
                <FaTools className="text-blue-600" /> End-to-End Turnkey Solutions
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#021C57] tracking-tight">
                Turnkey Civil Engineering Laboratory Setup in Mumbai &amp; MMR
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                From initial equipment BOQ estimation to site installation and NABL calibration:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-2">
                <span className="w-8 h-8 rounded-xl bg-[#021C57] text-white flex items-center justify-center font-bold text-xs">1</span>
                <h3 className="font-bold text-sm text-gray-900">Custom Lab Planning</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We prepare tailored equipment lists based on project tender specifications (NHAI, MSRDC, MMRDA, CPWD, Municipal Corporations).
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-2">
                <span className="w-8 h-8 rounded-xl bg-[#021C57] text-white flex items-center justify-center font-bold text-xs">2</span>
                <h3 className="font-bold text-sm text-gray-900">Direct Factory Supply</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Fast dispatch of testing machines, moulds, glassware, and precision tools with zero intermediary markups.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-2">
                <span className="w-8 h-8 rounded-xl bg-[#021C57] text-white flex items-center justify-center font-bold text-xs">3</span>
                <h3 className="font-bold text-sm text-gray-900">On-Site Commissioning</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Certified calibration engineers install machines, verify foundation levelling, and perform proving ring load tests.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-2">
                <span className="w-8 h-8 rounded-xl bg-[#021C57] text-white flex items-center justify-center font-bold text-xs">4</span>
                <h3 className="font-bold text-sm text-gray-900">Operator Training</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Hands-on training for site technicians on test methodologies, loading pace control, and IS code calculation standards.
                </p>
              </div>
            </div>
          </section>

          {/* 4. CALIBRATION & STANDARDS SECTION */}
          <section className="bg-gradient-to-r from-slate-900 to-[#021C57] text-white rounded-3xl p-8 md:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
                <FaCertificate /> ISO/IEC 17025 Compliant Calibration
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                On-Site Calibration &amp; Laboratory Setup Services in Mumbai
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed">
                We don’t just supply machines—our certified calibration engineers provide on-site load cell proving ring calibration, electronic balance verification, temperature uniformity profiling for laboratory ovens, and issuance of NABL-traceable test certificates across Mumbai.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold">
                <Link
                  href="/calibration-services"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl transition"
                >
                  Book Calibration Service →
                </Link>
                <Link
                  href="/standards"
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl border border-white/20 transition"
                >
                  Explore IS Codes Testing Hub →
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3 text-xs">
              <h3 className="font-bold text-amber-300 text-sm uppercase tracking-wider">Why Mumbai Engineers Choose ARCL:</h3>
              <ul className="space-y-2 text-blue-100">
                <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Heavy-duty cast iron &amp; high-grade steel build</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Complies with IS 516, IS 2720, IS 2386</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Rapid emergency spares &amp; servicing support</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Verified calibration master instruments</li>
              </ul>
            </div>
          </section>

          {/* 5. MUMBAI REGIONAL COVERAGE */}
          <section className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xs space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-[#021C57] tracking-tight flex items-center gap-2.5">
                <FaMapMarkerAlt className="text-red-500" /> Areas &amp; Corridors We Supply Across Mumbai &amp; MMR
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                Fast direct-to-site delivery and technician dispatch across all Mumbai zones and nearby industrial hubs:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {mumbaiAreas.map((area, idx) => (
                <div key={idx} className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-1">
                  <h3 className="font-bold text-xs text-[#021C57] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    <span>{area.name}</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed pl-4">
                    {area.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <span className="text-gray-500 font-semibold">Explore Neighboring Regional Hubs:</span>
              <Link
                href="/civil-lab-equipment-navi-mumbai"
                className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-xl font-bold transition"
              >
                Navi Mumbai HQ Hub →
              </Link>
              <Link
                href="/civil-lab-equipment-thane"
                className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-xl font-bold transition"
              >
                Thane &amp; Kalyan Region →
              </Link>
            </div>
          </section>

          {/* 6. FREQUENTLY ASKED QUESTIONS */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[#021C57] tracking-tight">
                Frequently Asked Questions (Mumbai Civil Laboratory &amp; Testing Equipment)
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                Answers to common inquiries regarding testing machines, procurement, calibration, and turnkey lab setup.
              </p>
            </div>

            <div className="space-y-3.5 max-w-4xl mx-auto">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2 shadow-2xs">
                  <h3 className="text-sm md:text-base font-bold text-gray-900">
                    {faq.q}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 7. BOTTOM CTA & INQUIRY FORM PROMPT */}
          <section className="bg-gradient-to-r from-[#021C57] to-[#043399] text-white rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-xl">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
              Ready to Upgrade Your Civil Testing Laboratory in Mumbai?
            </h2>
            <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto">
              Contact ARCL Instruments Private Limited today for custom price quotes, product technical datasheets, and laboratory design assistance.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Link
                href="/contact"
                className="bg-white hover:bg-gray-100 text-[#021C57] font-extrabold px-8 py-3.5 rounded-2xl shadow-lg transition text-xs sm:text-sm"
              >
                Contact Technical Sales Team
              </Link>
              <Link
                href="/products"
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold px-8 py-3.5 rounded-2xl shadow-lg transition text-xs sm:text-sm"
              >
                Explore Complete Catalogue
              </Link>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}

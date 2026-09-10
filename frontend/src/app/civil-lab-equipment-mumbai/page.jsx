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
} from "react-icons/fa";

export const metadata = {
  title: "Civil Lab Equipment Supplier in Mumbai | ARCL Instruments",
  description:
    "ARCL Instruments Private Limited is a premier civil laboratory equipment manufacturer and supplier in Mumbai. High-accuracy testing machines for concrete, soil, aggregate, bitumen, cement, surveying, and NDT with NABL calibration.",
  keywords: [
    "civil lab equipment supplier in Mumbai",
    "civil laboratory equipment supplier in Mumbai",
    "civil lab equipment manufacturers in Mumbai",
    "civil engineering lab equipment Mumbai",
    "civil testing equipment supplier Mumbai",
    "laboratory equipment supplier Mumbai",
    "material testing equipment Mumbai",
    "best civil lab equipment supplier in Mumbai",
    "civil laboratory equipment manufacturer in Mumbai",
    "concrete testing equipment Mumbai",
    "soil testing equipment Mumbai",
    "aggregate testing equipment Mumbai",
    "bitumen testing equipment Mumbai",
    "NDT equipment Mumbai",
    "calibration services Mumbai",
    "ARCL Instruments Private Limited",
  ],
  alternates: {
    canonical: "https://arclinstruments.com/civil-lab-equipment-mumbai",
  },
  openGraph: {
    title: "Civil Lab Equipment Supplier in Mumbai | ARCL Instruments",
    description:
      "ARCL Instruments Private Limited supplies certified civil laboratory equipment, concrete testing machines, soil CBR testers, aggregate sieve shakers, and NDT apparatus across Mumbai.",
    url: "https://arclinstruments.com/civil-lab-equipment-mumbai",
    siteName: "ARCL Instruments Private Limited",
    images: [
      {
        url: "https://arclinstruments.com/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "Civil Lab Equipment Supplier in Mumbai - ARCL Instruments Private Limited",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Civil Lab Equipment Supplier in Mumbai | ARCL Instruments",
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
          "name": "Civil Lab Equipment Supplier in Mumbai",
          "item": "https://arclinstruments.com/civil-lab-equipment-mumbai",
        },
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://arclinstruments.com/civil-lab-equipment-mumbai#localbusiness",
      "name": "ARCL Instruments Private Limited - Mumbai Civil Testing Hub",
      "alternateName": "ARCL Instruments Mumbai",
      "url": "https://arclinstruments.com/civil-lab-equipment-mumbai",
      "logo": "https://arclinstruments.com/assets/LOGO.png",
      "image": "https://arclinstruments.com/assets/LOGO.png",
      "description":
        "Leading manufacturer and supplier of precision civil engineering laboratory equipment, material testing machines, and calibration services across Mumbai and Mumbai Metropolitan Region.",
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
      "areaServed": [
        { "@type": "City", "name": "Mumbai" },
        { "@type": "AdministrativeArea", "name": "Mumbai Suburban" },
        { "@type": "AdministrativeArea", "name": "South Mumbai" },
        { "@type": "AdministrativeArea", "name": "Western Suburbs Mumbai" },
        { "@type": "AdministrativeArea", "name": "Eastern Suburbs Mumbai" },
        { "@type": "AdministrativeArea", "name": "Maharashtra" },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://arclinstruments.com/civil-lab-equipment-mumbai#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Where can I buy civil laboratory testing equipment in Mumbai?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can procure certified civil laboratory testing equipment directly from ARCL Instruments Private Limited. We manufacture and supply concrete compression testing machines, soil CBR testers, aggregate sieve shakers, bitumen ductility testers, and surveying instruments with direct factory delivery across Mumbai and MMR.",
          },
        },
        {
          "@type": "Question",
          "name": "Do ARCL Instruments machines comply with Bureau of Indian Standards (IS Codes)?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, all ARCL Instruments testing apparatus strictly comply with Indian Standards including IS 516 (Concrete), IS 2720 (Soil), IS 2386 (Aggregates), IS 1208 (Bitumen), and IS 4031 (Cement), as well as ASTM, BS, and MoRTH technical specifications.",
          },
        },
        {
          "@type": "Question",
          "name": "Does ARCL provide on-site calibration and commissioning in Mumbai?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, ARCL Instruments provides expert on-site equipment installation, operator training, and NABL-traceable load cell and dimensional calibration across all Mumbai job sites, RMC plants, and testing laboratories.",
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
            "text": "Yes, ARCL Instruments specializes in end-to-end turnkey civil engineering laboratory setup for engineering colleges, polytechnics, university research centres, and government QA/QC testing departments in Mumbai.",
          },
        },
      ],
    },
  ],
};

export default function CivilLabEquipmentMumbaiPage() {
  const categories = [
    {
      title: "Concrete Testing Equipment",
      desc: "Automatic Compression Testing Machines (CTM 2000kN / 3000kN), Cube Moulds, Flexural Testers, Slump Cones, and Vibrating Tables complying with IS 516 & IS 1199.",
      link: "/categories/concrete-testing-equipment",
      icon: <FaCube className="text-blue-600 text-2xl" />,
      items: ["Digital CTM Machines", "Cast Iron Cube Moulds", "Slump Test Apparatus", "Compaction Factor Apparatus"],
    },
    {
      title: "Soil Geotechnical Testing Equipment",
      desc: "California Bearing Ratio (CBR) Test Apparatus, Direct Shear Apparatus, Proctor Compaction, Liquid/Plastic Limit, and Triaxial Cells complying with IS 2720.",
      link: "/categories/soil-testing-equipment",
      icon: <FaLayerGroup className="text-emerald-600 text-2xl" />,
      items: ["Motorized CBR Apparatus", "Direct Shear Test Setup", "Standard Penetration Test (SPT)", "Core Cutter & Sand Pouring"],
    },
    {
      title: "Aggregate & Road Testing Equipment",
      desc: "Motorized Sieve Shakers, Brass/GI Test Sieves, Aggregate Impact Testers, Los Angeles Abrasion, and Flakiness/Elongation Gauges complying with IS 2386.",
      link: "/categories/aggregate-testing-equipment",
      icon: <FaRoad className="text-amber-600 text-2xl" />,
      items: ["G.I. & Brass Test Sieves", "Aggregate Impact Tester", "Los Angeles Abrasion Machine", "Thickness & Length Gauges"],
    },
    {
      title: "Bitumen & Asphalt Testing Equipment",
      desc: "Ductility Testing Apparatus, Penetrometers, Ring and Ball Softening Point Apparatus, and Marshall Stability Test Systems complying with IS 1208 & IS 1203.",
      link: "/categories/bitumen-testing-equipment",
      icon: <FaFlask className="text-purple-600 text-2xl" />,
      items: ["Digital Ductility Machine", "Automatic Penetrometer", "Softening Point Apparatus", "Marshall Stability Setup"],
    },
    {
      title: "Cement & Mortar Testing Equipment",
      desc: "Vicat Apparatus with Dashpot, Le-Chatelier Moulds & Water Bath, Mortar Pan Mixers, and Vibration Machines complying with IS 4031 & IS 5512.",
      link: "/categories/cement-testing-equipment",
      icon: <FaHardHat className="text-rose-600 text-2xl" />,
      items: ["Vicat Apparatus with Plungers", "Le-Chatelier Soundness Moulds", "Cement Tensile Testing Machine", "Standard Sand (Ennore)"],
    },
    {
      title: "Non-Destructive Testing (NDT)",
      desc: "Digital Concrete Rebound Hammers, Ultrasonic Pulse Velocity (UPV) Testers, Rebar Locators, and Core Drilling Machines complying with IS 13311.",
      link: "/categories/non-destructive-testing-ndt-equipment",
      icon: <FaShieldAlt className="text-indigo-600 text-2xl" />,
      items: ["Digital Rebound Hammer", "Ultrasonic Pulse Velocity", "Rebar Cover Meter", "Concrete Core Cutting Machine"],
    },
  ];

  const mumbaiAreas = [
    "South Mumbai (Nariman Point, Fort, Colaba, Worli)",
    "Bandra-Kurla Complex (BKC) & Central Mumbai",
    "Andheri, Vile Parle, Jogeshwari, Goregaon",
    "Malad, Kandivali, Borivali, Dahisar",
    "Ghatkopar, Kurla, Chembur, Govandi, Mankhurd",
    "Bhandup, Kanjurmarg, Vikhroli, Mulund",
    "Dadar, Parel, Lower Parel, Prabhadevi",
    "TTC Industrial Area & MIDC Mumbai Corridor",
  ];

  const faqs = [
    {
      q: "Where can I buy civil laboratory testing equipment in Mumbai?",
      a: "You can procure certified civil laboratory testing equipment directly from ARCL Instruments Private Limited. We manufacture and supply concrete compression testing machines, soil CBR testers, aggregate sieve shakers, bitumen ductility testers, and surveying instruments with direct factory delivery across Mumbai and MMR.",
    },
    {
      q: "Do ARCL Instruments machines comply with Bureau of Indian Standards (IS Codes)?",
      a: "Yes, all ARCL Instruments testing apparatus strictly comply with Indian Standards including IS 516 (Concrete), IS 2720 (Soil), IS 2386 (Aggregates), IS 1208 (Bitumen), and IS 4031 (Cement), as well as ASTM, BS, and MoRTH technical specifications.",
    },
    {
      q: "Does ARCL provide on-site calibration and commissioning in Mumbai?",
      a: "Yes, ARCL Instruments provides expert on-site equipment installation, operator training, and NABL-traceable load cell and dimensional calibration across all Mumbai job sites, RMC plants, and testing laboratories.",
    },
    {
      q: "What is the delivery timeline for civil lab equipment in Mumbai?",
      a: "Standard testing instruments and consumables such as cube moulds, slump cones, sieves, and balances are dispatched within 24 to 48 hours across Mumbai. Heavy testing machines such as digital Compression Testing Machines (CTM) are delivered within 3 to 7 working days.",
    },
    {
      q: "Can ARCL Instruments set up complete civil engineering college laboratories in Mumbai?",
      a: "Yes, ARCL Instruments specializes in end-to-end turnkey civil engineering laboratory setup for engineering colleges, polytechnics, university research centres, and government QA/QC testing departments in Mumbai.",
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
            <span className="text-gray-800 font-semibold">Civil Lab Equipment Supplier in Mumbai</span>
          </div>
        </div>

        {/* HERO SECTION */}
        <section className="bg-gradient-to-br from-[#021C57] via-[#043399] to-[#021C57] text-white py-14 md:py-20 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <FaCertificate /> ISO 9001:2015 Certified Manufacturer
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl leading-tight">
              Civil Lab Equipment Supplier in Mumbai
            </h1>

            <p className="text-blue-100 text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed">
              ARCL Instruments Private Limited is India’s premier manufacturer and trusted supplier of certified civil engineering laboratory equipment and material testing machines across Mumbai, South Mumbai, Western Suburbs, and Eastern Suburbs.
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
                <span>Pan-Mumbai Fast Delivery</span>
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

          {/* 1. INTRODUCTION SECTION */}
          <section className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xs space-y-5">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-[#021C57] tracking-tight">
                Complete Civil Laboratory Equipment Supplier for Mumbai Construction &amp; Infrastructure
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm">
                Precision testing setups for contractors, RMC plants, consulting engineers, third-party testing labs, and academic institutions.
              </p>
            </div>

            <p className="text-gray-700 text-sm md:text-base leading-relaxed">
              Mumbai is experiencing rapid infrastructure development—including the Mumbai Metro expansions, coastal road corridors, high-rise residential towers, and multi-tier highway networks. Accurate material quality control and stringent adherence to Indian Standards (IS Codes) are mandatory for every project.
            </p>

            <p className="text-gray-700 text-sm md:text-base leading-relaxed">
              <strong>ARCL Instruments Private Limited</strong> supplies complete, calibrated, and robust testing setups that enable QA/QC engineers to determine the compressive strength of concrete, the bearing capacity of soil, the flakiness of aggregates, and the ductility of bituminous binders with scientific accuracy.
            </p>
          </section>

          {/* 2. PRODUCT CATEGORIES GRID */}
          <section className="space-y-6">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#021C57] tracking-tight">
                Specialized Testing Equipment Supplied Across Mumbai
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
                    <p className="text-gray-600 text-xs leading-relaxed">
                      {cat.desc}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      {cat.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={cat.link}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#021C57] hover:text-blue-700 transition pt-2"
                  >
                    <span>View Equipment Specifications</span>
                    <FaArrowRight className="text-[10px]" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* 3. CALIBRATION & STANDARDS SECTION */}
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

          {/* 4. MUMBAI REGIONAL COVERAGE */}
          <section className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xs space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-[#021C57] tracking-tight flex items-center gap-2.5">
                <FaMapMarkerAlt className="text-red-500" /> Areas We Supply in Mumbai &amp; MMR
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                Fast direct-to-site delivery and technician dispatch across all Mumbai zones:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {mumbaiAreas.map((area, idx) => (
                <div key={idx} className="p-3 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs text-gray-800 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 5. FREQUENTLY ASKED QUESTIONS */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[#021C57] tracking-tight">
                Frequently Asked Questions (Mumbai Equipment Supply)
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                Answers to common inquiries regarding testing machines, procurement, and on-site support.
              </p>
            </div>

            <div className="space-y-3 max-w-4xl mx-auto">
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

          {/* 6. BOTTOM CTA & INQUIRY FORM PROMPT */}
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

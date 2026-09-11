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
  FaIndustry,
  FaHardHat,
} from "react-icons/fa";

export const metadata = {
  title: "Civil Lab Equipment Manufacturer & Supplier in Navi Mumbai | ARCL Instruments",
  description:
    "ARCL Instruments Private Limited - Headquartered in Airoli, Navi Mumbai. Leading manufacturer and supplier of civil engineering lab equipment, concrete CTM, soil CBR, bitumen, surveying, and NDT apparatus with local factory support.",
  keywords: [
    "civil lab equipment Navi Mumbai",
    "civil laboratory equipment Navi Mumbai",
    "civil lab equipment supplier in Navi Mumbai",
    "civil laboratory equipment manufacturer in Navi Mumbai",
    "laboratory equipment supplier Navi Mumbai",
    "concrete testing machine Navi Mumbai",
    "soil testing equipment Navi Mumbai",
    "aggregate testing equipment Navi Mumbai",
    "bitumen testing equipment Navi Mumbai",
    "material testing equipment Navi Mumbai",
    "calibration lab Navi Mumbai Airoli",
    "ARCL Instruments Private Limited",
  ],
  alternates: {
    canonical: "https://arclinstruments.com/civil-lab-equipment-navi-mumbai",
  },
  openGraph: {
    title: "Civil Lab Equipment Supplier in Navi Mumbai | ARCL Instruments",
    description:
      "ARCL Instruments Private Limited supplies precision civil engineering laboratory equipment, concrete CTM, soil CBR, aggregate sieve shakers, and NDT instruments from Airoli, Navi Mumbai.",
    url: "https://arclinstruments.com/civil-lab-equipment-navi-mumbai",
    siteName: "ARCL Instruments Private Limited",
    images: [
      {
        url: "https://arclinstruments.com/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "Civil Lab Equipment Supplier in Navi Mumbai - ARCL Instruments Private Limited",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Civil Lab Equipment Supplier in Navi Mumbai | ARCL Instruments",
    description:
      "Airoli, Navi Mumbai local manufacturing & calibration hub for civil laboratory testing equipment.",
    images: ["https://arclinstruments.com/assets/LOGO.png"],
  },
};

const naviMumbaiJsonLd = {
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
          "name": "Civil Lab Equipment Supplier in Navi Mumbai",
          "item": "https://arclinstruments.com/civil-lab-equipment-navi-mumbai",
        },
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://arclinstruments.com/civil-lab-equipment-navi-mumbai#localbusiness",
      "name": "ARCL Instruments Private Limited - Navi Mumbai Headquarters & Testing Lab",
      "alternateName": "ARCL Instruments Navi Mumbai",
      "url": "https://arclinstruments.com/civil-lab-equipment-navi-mumbai",
      "logo": "https://arclinstruments.com/assets/LOGO.png",
      "image": "https://arclinstruments.com/assets/LOGO.png",
      "description":
        "Headquartered at Airoli, Navi Mumbai. ISO 9001:2015 certified manufacturer of precision civil engineering testing equipment, concrete CTM, soil mechanics, aggregate testing, and NDT apparatus.",
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
        { "@type": "City", "name": "Navi Mumbai" },
        { "@type": "AdministrativeArea", "name": "Airoli" },
        { "@type": "AdministrativeArea", "name": "Vashi" },
        { "@type": "AdministrativeArea", "name": "Mahape" },
        { "@type": "AdministrativeArea", "name": "Rabale" },
        { "@type": "AdministrativeArea", "name": "Turbhe" },
        { "@type": "AdministrativeArea", "name": "Belapur" },
        { "@type": "AdministrativeArea", "name": "Kharghar" },
        { "@type": "AdministrativeArea", "name": "Panvel" },
        { "@type": "AdministrativeArea", "name": "Taloja MIDC" },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://arclinstruments.com/civil-lab-equipment-navi-mumbai#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Where is ARCL Instruments located in Navi Mumbai?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "ARCL Instruments Private Limited is headquartered at Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai, Maharashtra 400708. Clients and engineers are welcome to visit our office and testing demo facilities.",
          },
        },
        {
          "@type": "Question",
          "name": "Can I get same-day equipment pickup or inspection in Navi Mumbai?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, standard civil testing equipment, cube moulds, sieves, slump cones, and glassware can be inspected and picked up directly from our Navi Mumbai facility or dispatched via express same-day courier across Navi Mumbai and Thane.",
          },
        },
        {
          "@type": "Question",
          "name": "Does ARCL serve the Navi Mumbai International Airport (NMIA) and industrial projects?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, ARCL Instruments actively supplies certified soil CBR testing setups, concrete compression machines, plate load testers, and bitumen testing instruments for contractors and testing labs working on the Navi Mumbai International Airport (NMIA), MTHL Atal Setu, NAINA, and JNPT port logistics infrastructure.",
          },
        },
      ],
    },
  ],
};

export default function CivilLabEquipmentNaviMumbaiPage() {
  const naviMumbaiNodes = [
    "Airoli (Head Office & Testing Support)",
    "Rabale & Ghansoli MIDC Industrial Hubs",
    "Mahape Millennium Business Park & TTC Area",
    "Vashi, Sanpada, Nerul & Seawoods",
    "Belapur CBD & Kharghar Infrastructure Hub",
    "Taloja MIDC & Road Quality Testing Laboratories",
    "Panvel, JNPT, Uran & NMIA Airport Zone",
    "Dronagiri, Ulwe & NAINA Smart City Expansions",
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(naviMumbaiJsonLd) }}
      />

      <div className="bg-gray-50 min-h-screen">
        {/* BREADCRUMB */}
        <div className="bg-white border-b border-gray-100 py-3 px-4 sm:px-6 lg:px-12 text-xs text-gray-500">
          <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
            <Link href="/" className="hover:text-blue-600 transition">Home</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Civil Lab Equipment Supplier in Navi Mumbai</span>
          </div>
        </div>

        {/* HERO SECTION */}
        <section className="bg-gradient-to-br from-[#021C57] via-[#043399] to-[#021C57] text-white py-14 md:py-20 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <FaMapMarkerAlt /> Airoli, Navi Mumbai Direct Factory Hub
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl leading-tight">
              Civil Laboratory Equipment Supplier in Navi Mumbai
            </h1>

            <p className="text-blue-100 text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed">
              ARCL Instruments Private Limited is your local, certified manufacturing partner based in Airoli, Navi Mumbai. We provide precision testing equipment for concrete, soil mechanics, aggregates, bitumen, surveying, and non-destructive testing with immediate regional dispatch and on-site calibration.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-3.5">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-7 py-3.5 rounded-2xl shadow-lg transition text-xs sm:text-sm"
              >
                <span>Visit Our Navi Mumbai Office</span>
                <FaArrowRight />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-6 py-3.5 rounded-2xl border border-white/30 backdrop-blur-md transition text-xs sm:text-sm"
              >
                <span>Explore Full Equipment Range</span>
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

        {/* MAIN BODY */}
        <div className="max-w-7xl mx-auto py-12 md:py-16 px-4 sm:px-6 lg:px-12 space-y-16">

          {/* 1. LOCAL PRESENCE CARD */}
          <section className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xs space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-[#021C57] tracking-tight">
                Navi Mumbai’s Leading Manufacturer of Civil Testing Machines
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm">
                Direct factory support, rapid spare parts availability, and prompt calibration dispatch from Sector 8A, Airoli.
              </p>
            </div>

            <p className="text-gray-700 text-sm md:text-base leading-relaxed">
              Navi Mumbai is the epicenter of western India’s mega-infrastructure transformation—including the Navi Mumbai International Airport (NMIA), the Mumbai Trans Harbour Link (Atal Setu), smart city urban development, and extensive industrial hubs in Taloja, Rabale, Mahape, and TTC Industrial Area.
            </p>

            <p className="text-gray-700 text-sm md:text-base leading-relaxed">
              With <strong>ARCL Instruments Private Limited</strong> located right in Airoli, engineering contractors, ready-mix concrete (RMC) plants, and third-party NABL testing laboratories enjoy immediate access to high-accuracy testing apparatus, same-day dispatch of standard consumables, and on-call calibration engineers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
                <h3 className="font-bold text-[#021C57] text-sm">Airoli Head Office</h3>
                <p className="text-xs text-gray-600 mt-1">Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708</p>
              </div>
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                <h3 className="font-bold text-emerald-900 text-sm">Direct Phone / WhatsApp</h3>
                <p className="text-xs text-gray-600 mt-1">+91 8169695728 / +91 8369458583 (Instant Quotes &amp; Technical Support)</p>
              </div>
              <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl">
                <h3 className="font-bold text-amber-900 text-sm">Calibration &amp; Commissioning</h3>
                <p className="text-xs text-gray-600 mt-1">On-site load cell calibration, digital CTM verification, and NABL test certificates.</p>
              </div>
            </div>
          </section>

          {/* 2. REGIONAL COVERAGE */}
          <section className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xs space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-[#021C57] tracking-tight flex items-center gap-2">
                <FaIndustry className="text-blue-600" /> Navi Mumbai Industrial &amp; Infrastructure Coverage
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                We supply and service civil laboratory testing apparatus across all nodes of Navi Mumbai:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {naviMumbaiNodes.map((node, idx) => (
                <div key={idx} className="p-3 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs text-gray-800 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>{node}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. CATEGORIES SUMMARY */}
          <section className="space-y-6">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#021C57] tracking-tight">
                Complete Laboratory Testing Catalogue Available in Navi Mumbai
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                Full conformity with Bureau of Indian Standards (IS), ASTM, BS, and MoRTH codes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/categories/concrete-testing-equipment" className="p-5 bg-white border border-gray-100 rounded-3xl hover:border-blue-300 hover:shadow-md transition space-y-2 group">
                <FaCube className="text-blue-600 text-2xl" />
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 text-sm">Concrete Testing</h3>
                <p className="text-xs text-gray-500">Digital CTMs, Cube Moulds, Flexural Frames, Slump Apparatus.</p>
              </Link>
              <Link href="/categories/soil-testing-equipment" className="p-5 bg-white border border-gray-100 rounded-3xl hover:border-emerald-300 hover:shadow-md transition space-y-2 group">
                <FaLayerGroup className="text-emerald-600 text-2xl" />
                <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 text-sm">Soil Geotechnical</h3>
                <p className="text-xs text-gray-500">Motorized CBR Machines, Direct Shear, SPT, Proctor Moulds.</p>
              </Link>
              <Link href="/categories/aggregate-testing-equipment" className="p-5 bg-white border border-gray-100 rounded-3xl hover:border-amber-300 hover:shadow-md transition space-y-2 group">
                <FaRoad className="text-amber-600 text-2xl" />
                <h3 className="font-bold text-gray-900 group-hover:text-amber-600 text-sm">Aggregate &amp; Highway</h3>
                <p className="text-xs text-gray-500">Motorized Sieve Shakers, Impact Testers, LA Abrasion, Gauges.</p>
              </Link>
              <Link href="/categories/non-destructive-testing-ndt-equipment" className="p-5 bg-white border border-gray-100 rounded-3xl hover:border-purple-300 hover:shadow-md transition space-y-2 group">
                <FaShieldAlt className="text-purple-600 text-2xl" />
                <h3 className="font-bold text-gray-900 group-hover:text-purple-600 text-sm">NDT Instruments</h3>
                <p className="text-xs text-gray-500">Digital Rebound Hammers, UPV Concrete Testers, Rebar Scanners.</p>
              </Link>
            </div>
          </section>

          {/* 4. CTA BANNER */}
          <section className="bg-gradient-to-r from-[#021C57] to-[#043399] text-white rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-xl">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
              Get Local Factory-Direct Pricing in Navi Mumbai
            </h2>
            <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto">
              Contact ARCL Instruments Private Limited today for product brochures, live equipment demos, and on-site calibration visits in Navi Mumbai.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Link
                href="/contact"
                className="bg-white hover:bg-gray-100 text-[#021C57] font-extrabold px-8 py-3.5 rounded-2xl shadow-lg transition text-xs sm:text-sm"
              >
                Contact Navi Mumbai Office
              </Link>
              <Link
                href="/calibration-services"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg transition text-xs sm:text-sm"
              >
                Book NABL Calibration
              </Link>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}

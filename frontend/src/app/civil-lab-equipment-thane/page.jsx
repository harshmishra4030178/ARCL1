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
  FaHardHat,
  FaIndustry,
} from "react-icons/fa";

export const metadata = {
  title: "Civil Lab Equipment Supplier in Thane | ARCL Instruments",
  description:
    "ARCL Instruments Private Limited supplies certified civil laboratory equipment and material testing machines across Thane, Ghodbunder Road, Wagle Estate, Kalyan, Dombivli, and Bhiwandi with NABL calibration.",
  keywords: [
    "civil lab equipment supplier in Thane",
    "civil laboratory equipment supplier in Thane",
    "civil lab equipment Thane",
    "concrete testing machine Thane",
    "soil testing equipment Thane",
    "aggregate testing equipment Thane",
    "material testing equipment Thane",
    "civil testing machines Kalyan Dombivli",
    "civil lab equipment Bhiwandi",
    "laboratory equipment supplier Thane",
    "ARCL Instruments Private Limited",
  ],
  alternates: {
    canonical: "https://arclinstruments.com/civil-lab-equipment-thane",
  },
  openGraph: {
    title: "Civil Lab Equipment Supplier in Thane | ARCL Instruments",
    description:
      "ARCL Instruments Private Limited supplies precision civil engineering laboratory equipment, concrete CTMs, soil CBR testers, aggregate sieve shakers, and NDT instruments across Thane.",
    url: "https://arclinstruments.com/civil-lab-equipment-thane",
    siteName: "ARCL Instruments Private Limited",
    images: [
      {
        url: "https://arclinstruments.com/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "Civil Lab Equipment Supplier in Thane - ARCL Instruments Private Limited",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Civil Lab Equipment Supplier in Thane | ARCL Instruments",
    description:
      "Certified civil laboratory testing machines and calibration services across Thane & Kalyan-Dombivli.",
    images: ["https://arclinstruments.com/assets/LOGO.png"],
  },
};

const thaneJsonLd = {
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
          "name": "Civil Lab Equipment Supplier in Thane",
          "item": "https://arclinstruments.com/civil-lab-equipment-thane",
        },
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://arclinstruments.com/civil-lab-equipment-thane#localbusiness",
      "name": "ARCL Instruments Private Limited - Thane Civil Testing Supply",
      "alternateName": "ARCL Instruments Thane",
      "url": "https://arclinstruments.com/civil-lab-equipment-thane",
      "logo": "https://arclinstruments.com/assets/LOGO.png",
      "image": "https://arclinstruments.com/assets/LOGO.png",
      "description":
        "Premier supplier of civil laboratory testing equipment, concrete compression testing machines, geotechnical soil equipment, and calibration services across Thane and surrounding industrial corridors.",
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
        { "@type": "City", "name": "Thane" },
        { "@type": "AdministrativeArea", "name": "Ghodbunder Road Thane" },
        { "@type": "AdministrativeArea", "name": "Wagle Estate Thane" },
        { "@type": "AdministrativeArea", "name": "Majiwada Thane" },
        { "@type": "AdministrativeArea", "name": "Kalyan" },
        { "@type": "AdministrativeArea", "name": "Dombivli" },
        { "@type": "AdministrativeArea", "name": "Bhiwandi" },
        { "@type": "AdministrativeArea", "name": "Mira Bhayandar" },
      ],
    },
  ],
};

export default function CivilLabEquipmentThanePage() {
  const thaneAreas = [
    "Thane West & Ghodbunder Road Corridor",
    "Wagle Industrial Estate & Pokhran Road",
    "Majiwada, Kasarvadavali & Ovala",
    "Kalyan & Dombivli Residential & Commercial Hubs",
    "Bhiwandi Logistics & Warehousing Infrastructure",
    "Ambernath & Badlapur MIDC Corridors",
    "Mira Road & Bhayandar Coastal Belt",
    "Mumbra, Kalwa & Diva Infrastructure Sectors",
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(thaneJsonLd) }}
      />

      <div className="bg-gray-50 min-h-screen">
        {/* BREADCRUMB */}
        <div className="bg-white border-b border-gray-100 py-3 px-4 sm:px-6 lg:px-12 text-xs text-gray-500">
          <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
            <Link href="/" className="hover:text-blue-600 transition">Home</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Civil Lab Equipment Supplier in Thane</span>
          </div>
        </div>

        {/* HERO SECTION */}
        <section className="bg-gradient-to-br from-[#021C57] via-[#043399] to-[#021C57] text-white py-14 md:py-20 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <FaCertificate /> ISO 9001:2015 Certified Manufacturer
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl leading-tight">
              Civil Lab Equipment Supplier in Thane
            </h1>

            <p className="text-blue-100 text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed">
              ARCL Instruments Private Limited supplies heavy-duty, high-precision civil engineering laboratory equipment, concrete testing machines, soil CBR systems, aggregate sieve shakers, and NDT equipment across Thane, Ghodbunder Road, Kalyan, Dombivli, and Bhiwandi.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-3.5">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-7 py-3.5 rounded-2xl shadow-lg transition text-xs sm:text-sm"
              >
                <span>Request Instant Thane Quote</span>
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

        {/* MAIN BODY */}
        <div className="max-w-7xl mx-auto py-12 md:py-16 px-4 sm:px-6 lg:px-12 space-y-16">

          {/* 1. INTRO CARD */}
          <section className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xs space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-[#021C57] tracking-tight">
                Engineered for High-Volume Material Testing in Thane Infrastructure Projects
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm">
                Supporting contractors, RMC plants, municipal infrastructure, and quality control labs across the Thane district.
              </p>
            </div>

            <p className="text-gray-700 text-sm md:text-base leading-relaxed">
              With rapid urban growth across Ghodbunder Road, Majiwada, Kalyan-Dombivli smart city projects, and the industrial logistics belt in Bhiwandi, construction material testing requires precision and rugged dependability.
            </p>

            <p className="text-gray-700 text-sm md:text-base leading-relaxed">
              <strong>ARCL Instruments Private Limited</strong> provides heavy-duty cast iron and alloy steel testing instruments designed for continuous laboratory operations. All our instruments adhere strictly to relevant Indian Standards (IS 516, IS 2720, IS 2386, IS 1208, IS 4031) and international ASTM standards.
            </p>
          </section>

          {/* 2. REGIONAL THANE AREAS */}
          <section className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xs space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-[#021C57] tracking-tight flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-500" /> Key Delivery &amp; Calibration Zones in Thane
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                Same-day &amp; next-day equipment dispatch with dedicated calibration team coverage:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {thaneAreas.map((area, idx) => (
                <div key={idx} className="p-3 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs text-gray-800 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. CTA */}
          <section className="bg-gradient-to-r from-[#021C57] to-[#043399] text-white rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-xl">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
              Equip Your Civil Laboratory in Thane
            </h2>
            <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto">
              Get in touch with ARCL Instruments Private Limited for instant quotations, product catalogs, and on-site testing machine setup in Thane.
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
                Browse Product Catalogue
              </Link>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}

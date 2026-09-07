import HomeClient from "../views/Home.jsx";

export const metadata = {
  title: "ARCL Instruments | Civil & Material Testing Lab Equipment Manufacturer Mumbai",
  description:
    "ARCL Instruments Pvt. Ltd. is Mumbai & Navi Mumbai's leading ISO 9001:2015 certified manufacturer of civil engineering, concrete, soil, bitumen, cement, and material testing laboratory instruments. Best price & NABL calibration in Maharashtra.",
  keywords: [
    "civil lab equipment manufacturer Mumbai",
    "material testing machines supplier Navi Mumbai",
    "concrete compression testing machine Mumbai",
    "soil testing equipment supplier Mumbai Maharashtra",
    "cement testing apparatus Thane Navi Mumbai",
    "bitumen lab equipment manufacturer Mumbai",
    "civil engineering lab setup Mumbai",
    "NABL calibration laboratory Navi Mumbai",
    "ARCL Instruments Airoli Navi Mumbai",
    "laboratory equipment manufacturer India",
  ],
  alternates: {
    canonical: "https://www.arclinstruments.com",
  },
  openGraph: {
    title: "ARCL Instruments | Material & Civil Testing Lab Equipment Manufacturer Mumbai",
    description:
      "ISO 9001:2015 Certified Manufacturer & Exporter of Precision Civil, Material, Geotechnical & Laboratory Testing Machines in Mumbai, Navi Mumbai & across India.",
    url: "https://www.arclinstruments.com",
    siteName: "ARCL Instruments Pvt. Ltd.",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "ARCL Instruments Logo Mumbai",
      },
    ],
  },
};

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://www.arclinstruments.com/#localbusiness",
      "name": "ARCL Instruments Pvt. Ltd.",
      "alternateName": "ARCL Instruments Mumbai",
      "url": "https://www.arclinstruments.com",
      "logo": "https://www.arclinstruments.com/assets/LOGO.png",
      "image": "https://www.arclinstruments.com/assets/LOGO.png",
      "description":
        "Mumbai & Navi Mumbai's premier ISO 9001:2015 certified manufacturer and supplier of civil engineering, concrete, soil, bitumen, and material testing laboratory instruments.",
      "telephone": "+91-8169695728",
      "email": "arclinstruments@gmail.com",
      "priceRange": "₹₹",
      "currenciesAccepted": "INR",
      "paymentAccepted": "Cash, Credit Card, Bank Transfer, Cheque, UPI",
      "areaServed": [
        { "@type": "City", "name": "Mumbai" },
        { "@type": "City", "name": "Navi Mumbai" },
        { "@type": "City", "name": "Thane" },
        { "@type": "City", "name": "Pune" },
        { "@type": "AdministrativeArea", "name": "Maharashtra" },
        { "@type": "Country", "name": "India" },
      ],
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
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "09:00",
          "closes": "19:00",
        },
      ],
      "sameAs": [
        "https://www.linkedin.com/company/arcl-instruments",
        "https://www.instagram.com/arcl_instruments",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.arclinstruments.com/#website",
      "url": "https://www.arclinstruments.com",
      "name": "ARCL Instruments",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.arclinstruments.com/products?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
      "publisher": {
        "@id": "https://www.arclinstruments.com/#localbusiness",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.arclinstruments.com/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Who is the best civil laboratory equipment manufacturer in Navi Mumbai, India?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "ARCL Instruments Pvt. Ltd. is an ISO 9001:2015 certified leading manufacturer and exporter of precision laboratory and civil testing equipment based in Airoli, Navi Mumbai, India.",
          },
        },
        {
          "@type": "Question",
          "name": "What standards do ARCL Instruments comply with?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "All testing equipment and instruments comply strictly with IS (Bureau of Indian Standards), ASTM, BS, and AASHTO regulatory guidelines.",
          },
        },
        {
          "@type": "Question",
          "name": "Do you provide calibration services and test certificates?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, ARCL Instruments provides NABL-traceable calibration certificates, on-site commissioning, and periodic maintenance services across India.",
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HomeClient />
    </>
  );
}

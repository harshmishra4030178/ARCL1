import HomeClient from "../views/Home.jsx";

export const metadata = {
  title: "ARCL Instruments Private Limited | Civil Engineering Laboratory Equipment & Material Testing Machines Manufacturer India",
  description:
    "ARCL Instruments Private Limited is India's leading ISO 9001:2015 certified manufacturer and supplier of precision civil engineering laboratory equipment, concrete testing machines, soil CBR testers, bitumen ductility apparatus, aggregate sieve shakers, and cement testing instruments.",
  keywords: [
    "ARCL Instruments Private Limited",
    "ARCL Instruments",
    "Civil Engineering Laboratory Equipment",
    "Material Testing Equipment Manufacturer India",
    "Laboratory Testing Equipment Supplier India",
    "Concrete Testing Equipment",
    "Soil Testing Equipment",
    "Aggregate Testing Equipment",
    "Cement Testing Equipment",
    "Bitumen Testing Equipment",
    "Civil Laboratory Equipment Manufacturer",
    "Concrete compression testing machine CTM",
    "Soil CBR testing machine",
    "Digital Sieve Shaker",
    "NABL calibration laboratory equipment",
    "ARCL Instruments Navi Mumbai Mumbai",
  ],
  alternates: {
    canonical: "https://arclinstruments.com",
  },
  openGraph: {
    title: "ARCL Instruments Private Limited | Civil Engineering Laboratory Equipment Manufacturer & Supplier India",
    description:
      "ISO 9001:2015 Certified Manufacturer & Exporter of Precision Civil, Material, Geotechnical, Concrete, Asphalt, Aggregate, and Cement Testing Machines across India.",
    url: "https://arclinstruments.com",
    siteName: "ARCL Instruments Private Limited",
    images: [
      {
        url: "https://arclinstruments.com/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "ARCL Instruments Private Limited - Civil Engineering Laboratory Equipment Manufacturer India",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "ARCL Instruments Private Limited | Civil Engineering & Material Testing Laboratory Equipment",
    description:
      "Precision civil engineering laboratory testing machines complying with IS, ASTM, BS, and AASHTO standards.",
    images: ["https://arclinstruments.com/assets/LOGO.png"],
  },
};

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://arclinstruments.com/#localbusiness",
      "name": "ARCL Instruments Private Limited",
      "alternateName": [
        "ARCL Instruments",
        "ARCL Instruments Pvt. Ltd.",
        "ARCL Instruments Private Limited",
        "ARCL Instruments India"
      ],
      "url": "https://arclinstruments.com",
      "logo": "https://arclinstruments.com/assets/LOGO.png",
      "image": "https://arclinstruments.com/assets/LOGO.png",
      "description":
        "India's premier ISO 9001:2015 certified manufacturer and supplier of precision civil engineering, concrete, soil, bitumen, cement, aggregate, and material testing laboratory instruments.",
      "telephone": "+91-8169695728",
      "email": "arclinstruments@gmail.com",
      "priceRange": "₹₹",
      "currenciesAccepted": "INR",
      "paymentAccepted": "Bank Transfer, Cheque, NEFT/RTGS, UPI, Cash, Credit Card",
      "areaServed": [
        { "@type": "Country", "name": "India" },
        { "@type": "AdministrativeArea", "name": "Maharashtra" },
        { "@type": "City", "name": "Mumbai" },
        { "@type": "City", "name": "Navi Mumbai" },
        { "@type": "City", "name": "Thane" },
        { "@type": "City", "name": "Pune" },
        { "@type": "City", "name": "Delhi NCR" },
        { "@type": "City", "name": "Bengaluru" },
        { "@type": "City", "name": "Hyderabad" },
        { "@type": "City", "name": "Ahmedabad" },
        { "@type": "City", "name": "Chennai" },
        { "@type": "City", "name": "Kolkata" },
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
      "@id": "https://arclinstruments.com/#website",
      "url": "https://arclinstruments.com",
      "name": "ARCL Instruments Private Limited",
      "alternateName": [
        "ARCL Instruments",
        "ARCL Instruments Pvt. Ltd.",
        "ARCL Instruments Private Limited"
      ],
      "description": "Civil Engineering & Material Testing Laboratory Equipment Manufacturer in India",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://arclinstruments.com/products?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
      "publisher": {
        "@id": "https://arclinstruments.com/#localbusiness",
      },
    },
    {
      "@type": "WebPage",
      "@id": "https://arclinstruments.com/#webpage",
      "url": "https://arclinstruments.com",
      "name": "Civil Engineering Laboratory Equipment & Material Testing Equipment Manufacturer India",
      "isPartOf": {
        "@id": "https://arclinstruments.com/#website",
      },
      "about": {
        "@id": "https://arclinstruments.com/#localbusiness",
      },
      "description":
        "Manufacturer and supplier of precision civil engineering laboratory equipment for concrete, soil, bitumen, cement, aggregate, and material testing across India.",
    },
    {
      "@type": "FAQPage",
      "@id": "https://arclinstruments.com/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What types of civil engineering laboratory equipment does ARCL Instruments manufacture?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "ARCL Instruments manufactures a comprehensive range of material testing laboratory equipment including Concrete Testing Equipment (Compression Testing Machines, Flexural Testers, Slump Cones), Soil Testing Equipment (CBR, Direct Shear, Liquid Limit Apparatus), Aggregate Testing Equipment (Digital Sieve Shakers, Impact Testers, Flakiness Gauges), Bitumen/Asphalt Testing Equipment (Ductility, Penetrometers), and Cement Testing Apparatus (Vicat, Le-Chatelier, Autoclave).",
          },
        },
        {
          "@type": "Question",
          "name": "Do ARCL Instruments testing machines comply with national and international standards?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, all laboratory testing equipment and instruments manufactured by ARCL Instruments strictly comply with IS (Bureau of Indian Standards), ASTM, BS, EN, and AASHTO regulatory guidelines.",
          },
        },
        {
          "@type": "Question",
          "name": "Does ARCL Instruments provide NABL calibration and test certificates?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, ARCL Instruments provides NABL-traceable calibration certificates, factory load cell calibration, on-site commissioning, and periodic maintenance services across India.",
          },
        },
        {
          "@type": "Question",
          "name": "How can I request a quote or product catalog for civil laboratory equipment?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can request a direct factory quotation or download the master product catalog by visiting our website at arclinstruments.com/contact or by contacting our technical sales team at arclinstruments@gmail.com / +91-8169695728.",
          },
        },
      ],
    },
  ],
};

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return "https://arcl1-1.onrender.com/api/v1";
  }
  return "http://localhost:5000/api/v1";
};

async function getHomeShowcaseData() {
  try {
    const BACKEND_URL = getBackendUrl();
    const res = await fetch(`${BACKEND_URL}/client/products/home-showcase`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch (err) {
    return [];
  }
}

export default async function HomePage() {
  const initialShowcase = await getHomeShowcaseData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HomeClient initialShowcase={initialShowcase} />
    </>
  );
}

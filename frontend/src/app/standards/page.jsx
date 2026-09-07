import StandardsDirectoryPage from "../../views/StandardsDirectoryPage.jsx";

export const metadata = {
  title: "Civil Engineering Testing Standards Hub (IS, ASTM, BS Codes) | ARCL Instruments",
  description:
    "Complete testing apparatus, machinery, and equipment checklists for Indian Standards (IS 516 Concrete, IS 2720 Soil CBR, IS 1208 Bitumen Ductility, IS 4031 Cement Vicat, IS 2386 Aggregates), ASTM, BS, and MoRTH specifications. Download instant test BOQ estimates.",
  keywords: [
    "IS 516 concrete testing equipment",
    "IS 2720 soil CBR testing machine",
    "IS 1208 bitumen ductility test apparatus",
    "IS 4031 cement vicat apparatus",
    "IS 2386 aggregate sieve analysis",
    "ASTM C39 concrete cylinder compression",
    "ASTM D6927 Marshall stability test",
    "Indian testing standards directory",
    "Civil engineering lab equipment list",
    "ARCL Instruments Navi Mumbai",
  ],
  alternates: {
    canonical: "https://www.arclinstruments.com/standards",
  },
  openGraph: {
    title: "Civil Engineering Testing Standards Directory (IS, ASTM, BS Codes) | ARCL",
    description:
      "Find complete equipment lists and 1-click BOQ estimates for certified Indian Standards (IS 516, IS 2720, IS 1208, IS 4031) and international civil testing codes.",
    url: "https://www.arclinstruments.com/standards",
    siteName: "ARCL Instruments Pvt. Ltd.",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "ARCL Instruments Testing Standards Directory",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Civil Engineering Testing Standards Hub | ARCL Instruments",
    description:
      "Access complete equipment checklists and 1-click BOQ quotes for IS 516, IS 2720, IS 1208, and ASTM civil testing standards.",
    images: ["/assets/LOGO.png"],
  },
};

const standardsJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.arclinstruments.com",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Testing Standards Directory",
          "item": "https://www.arclinstruments.com/standards",
        },
      ],
    },
    {
      "@type": "CollectionPage",
      "@id": "https://www.arclinstruments.com/standards#webpage",
      "url": "https://www.arclinstruments.com/standards",
      "name": "Civil Engineering Testing Standards Hub (IS, ASTM, BS Codes)",
      "description":
        "Directory of civil material testing standards including IS 516, IS 2720, IS 1208, IS 4031, IS 2386 with certified equipment mapping.",
      "publisher": {
        "@type": "Organization",
        "name": "ARCL Instruments Pvt. Ltd.",
        "url": "https://www.arclinstruments.com",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.arclinstruments.com/standards#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What equipment is required for IS 516 Concrete Compressive Strength Test?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "For IS 516 compliance, the essential equipment includes a Digital or Automatic Compression Testing Machine (2000kN / 3000kN), Cast Iron Cube Moulds (150mm & 70.6mm), Accelerated Curing Tank, and Slump Cone Apparatus.",
          },
        },
        {
          "@type": "Question",
          "name": "Which instruments are mandatory for IS 2720 Soil Testing in Road Construction?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Key instruments for IS 2720 include the California Bearing Ratio (CBR) Test Apparatus (IS 2720 Part 16), Direct Shear Apparatus (Part 13), Sand Pouring Cylinder for Field Density (Part 28), and Standard/Modified Proctor Compaction Moulds.",
          },
        },
        {
          "@type": "Question",
          "name": "Are all ARCL instruments certified according to BIS and ASTM standards?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, all ARCL Instruments testing apparatus and machines are manufactured in compliance with Bureau of Indian Standards (IS), ASTM International, and British Standards (BS), supplied with NABL-traceable calibration certificates.",
          },
        },
      ],
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(standardsJsonLd) }}
      />
      <StandardsDirectoryPage />
    </>
  );
}


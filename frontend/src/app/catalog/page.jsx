import CatalogClient from "../../views/CatalogPage.jsx";

export const metadata = {
  title: "Equipment Catalog & Technical PDF Brochures | ARCL Instruments",
  description:
    "Download official technical product catalogs, civil laboratory testing brochures, and equipment specification sheets from ARCL Instruments Pvt. Ltd. Complying with IS, ASTM, and BS codes.",
  keywords: [
    "laboratory equipment catalog PDF",
    "civil testing machines brochure",
    "testing machine PDF catalog download",
    "ARCL Instruments catalog",
  ],
  alternates: {
    canonical: "https://arclinstruments.com/catalog",
  },
  openGraph: {
    title: "Equipment Catalog & Technical PDF Brochures | ARCL Instruments",
    description:
      "Download certified civil engineering and material testing equipment catalogs and PDF specification sheets.",
    url: "https://arclinstruments.com/catalog",
    siteName: "ARCL Instruments Pvt. Ltd.",
    images: [
      {
        url: "https://arclinstruments.com/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "ARCL Instruments Equipment Catalog",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Equipment Catalog & PDF Brochures | ARCL Instruments",
    description: "Download official civil engineering testing equipment catalogs and specifications.",
    images: ["https://arclinstruments.com/assets/LOGO.png"],
  },
};

const catalogJsonLd = {
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
          "name": "Product Catalog",
          "item": "https://arclinstruments.com/catalog",
        },
      ],
    },
  ],
};

export default function CatalogRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd) }}
      />
      <CatalogClient />
    </>
  );
}

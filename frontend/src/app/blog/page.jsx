import BlogListPage from "../../views/BlogListPage.jsx";

export const metadata = {
  title: "Civil Engineering Lab Testing Guides & IS Codes Blog | ARCL Instruments",
  description:
    "Expert technical guides, laboratory test procedures, Indian Standards (IS 516, IS 2720, IS 1208, IS 4031), calibration methods, and civil QA/QC benchmarks by ARCL Instruments Private Limited.",
  keywords: [
    "civil engineering blog India",
    "material testing lab guides",
    "IS 516 concrete cube test procedure",
    "IS 2720 soil CBR test steps",
    "bitumen ductility test standard",
    "cement vicat apparatus test",
    "NABL calibration guide civil lab",
    "ARCL Instruments technical knowledge",
  ],
  alternates: {
    canonical: "https://arclinstruments.com/blog",
  },
  openGraph: {
    title: "Civil Engineering Lab Testing Guides & IS Codes Blog | ARCL Instruments",
    description:
      "Step-by-step laboratory testing guides, formulas, and equipment checklists for Indian Standards (IS Codes) and civil QA/QC.",
    url: "https://arclinstruments.com/blog",
    siteName: "ARCL Instruments Private Limited",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "ARCL Instruments Private Limited Technical Knowledge Hub",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Civil Engineering Lab Testing Guides & IS Codes Blog | ARCL Instruments",
    description:
      "Authoritative laboratory testing procedures and IS code guides for civil engineers.",
    images: ["/assets/LOGO.png"],
  },
};

const blogListJsonLd = {
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
          "name": "Blog & Technical Guides",
          "item": "https://arclinstruments.com/blog",
        },
      ],
    },
    {
      "@type": "Blog",
      "@id": "https://arclinstruments.com/blog#blog",
      "name": "ARCL Instruments Technical Knowledge Hub",
      "description":
        "Technical guides, laboratory test procedures, and standards documentation for civil engineering and material testing.",
      "url": "https://arclinstruments.com/blog",
      "publisher": {
        "@type": "Organization",
        "name": "ARCL Instruments Private Limited",
        "url": "https://arclinstruments.com",
        "logo": "https://arclinstruments.com/assets/LOGO.png",
      },
    },
  ],
};

export default function BlogRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListJsonLd) }}
      />
      <BlogListPage />
    </>
  );
}

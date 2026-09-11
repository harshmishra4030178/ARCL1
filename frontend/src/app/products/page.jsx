import ProductListingClient from "../../views/ProductListingPage.jsx";

export const metadata = {
  title: "Civil Engineering Laboratory Equipment Catalogue | ARCL Instruments",
  description:
    "Explore the complete catalogue of certified laboratory and civil engineering testing equipment by ARCL Instruments Private Limited. High accuracy testing solutions for Concrete, Soil, Bitumen, Cement, and Aggregate labs across India.",
  keywords: [
    "civil engineering laboratory equipment catalogue",
    "civil testing machines manufacturer India",
    "soil testing equipment list",
    "cement testing instruments",
    "concrete compression testing machine",
    "bitumen lab apparatus",
    "ARCL Instruments",
  ],
  alternates: {
    canonical: "https://arclinstruments.com/products",
  },
  openGraph: {
    title: "Civil Engineering Laboratory Equipment Catalogue | ARCL Instruments Private Limited",
    description:
      "Explore certified laboratory and civil engineering testing equipment manufactured by ARCL Instruments Private Limited.",
    url: "https://arclinstruments.com/products",
    siteName: "ARCL Instruments Private Limited",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "ARCL Instruments Private Limited Products Catalogue",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Civil Engineering Laboratory Equipment Catalogue | ARCL Instruments",
    description:
      "Precision civil engineering testing instruments and laboratory machines across India.",
    images: ["/assets/LOGO.png"],
  },
};

const productsJsonLd = {
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
          "name": "Products",
          "item": "https://arclinstruments.com/products",
        },
      ],
    },
    {
      "@type": "CollectionPage",
      "@id": "https://arclinstruments.com/products#webpage",
      "url": "https://arclinstruments.com/products",
      "name": "Laboratory Testing Equipment & Instruments Catalogue",
      "description":
        "Complete catalogue of civil material testing machines manufactured by ARCL Instruments Private Limited.",
      "publisher": {
        "@type": "Organization",
        "name": "ARCL Instruments Private Limited",
        "url": "https://arclinstruments.com",
      },
    },
  ],
};

export default function ProductsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productsJsonLd) }}
      />
      <ProductListingClient />
    </>
  );
}


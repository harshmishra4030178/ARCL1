import ProductListingClient from "../../views/ProductListingPage.jsx";

export const metadata = {
  title: "Testing Instruments & Laboratory Equipment Catalogue | ARCL Instruments",
  description:
    "Explore the complete catalogue of certified laboratory and civil engineering testing equipment by ARCL Instruments Pvt. Ltd. High accuracy testing solutions for Concrete, Soil, Bitumen, Cement, and Aggregate labs across India.",
  keywords: [
    "laboratory equipment catalogue",
    "civil testing machines manufacturer India",
    "soil testing equipment list",
    "cement testing instruments",
    "concrete compression testing machine",
    "bitumen lab apparatus",
    "ARCL Instruments",
  ],
  alternates: {
    canonical: "https://www.arclinstruments.com/products",
  },
  openGraph: {
    title: "Testing Instruments & Laboratory Equipment Catalogue | ARCL Instruments",
    description:
      "Explore certified laboratory and civil engineering testing equipment manufactured by ARCL Instruments Pvt. Ltd.",
    url: "https://www.arclinstruments.com/products",
    siteName: "ARCL Instruments Pvt. Ltd.",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "ARCL Instruments Products Catalogue",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Testing Instruments Catalogue | ARCL Instruments",
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
          "item": "https://www.arclinstruments.com",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Products",
          "item": "https://www.arclinstruments.com/products",
        },
      ],
    },
    {
      "@type": "CollectionPage",
      "@id": "https://www.arclinstruments.com/products#webpage",
      "url": "https://www.arclinstruments.com/products",
      "name": "Laboratory Testing Equipment & Instruments Catalogue",
      "description":
        "Complete catalogue of civil material testing machines manufactured by ARCL Instruments Pvt. Ltd.",
      "publisher": {
        "@type": "Organization",
        "name": "ARCL Instruments Pvt. Ltd.",
        "url": "https://www.arclinstruments.com",
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


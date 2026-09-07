import AboutClient from "../../views/About.jsx";

export const metadata = {
  title: "About ARCL Instruments | ISO Certified Testing Machine Manufacturer",
  description:
    "Learn about ARCL Instruments Pvt. Ltd. Leading manufacturer of certified civil engineering, concrete, soil, bitumen, and material testing laboratory instruments in Navi Mumbai, India.",
  keywords: [
    "about ARCL Instruments",
    "laboratory equipment manufacturer",
    "ISO 9001:2015 certified company",
    "civil lab instruments manufacturer Navi Mumbai",
    "material testing machines India",
  ],
  alternates: {
    canonical: "https://www.arclinstruments.com/about",
  },
  openGraph: {
    title: "About ARCL Instruments | ISO Certified Testing Machine Manufacturer",
    description:
      "Leading manufacturer of certified civil engineering and laboratory testing instruments based in Navi Mumbai, India.",
    url: "https://www.arclinstruments.com/about",
    siteName: "ARCL Instruments Pvt. Ltd.",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "About ARCL Instruments Pvt. Ltd.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About ARCL Instruments Pvt. Ltd.",
    description: "ISO 9001:2015 Certified Civil & Material Testing Equipment Manufacturer.",
    images: ["/assets/LOGO.png"],
  },
};

const aboutJsonLd = {
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
          "name": "About Us",
          "item": "https://www.arclinstruments.com/about",
        },
      ],
    },
    {
      "@type": "AboutPage",
      "@id": "https://www.arclinstruments.com/about#webpage",
      "url": "https://www.arclinstruments.com/about",
      "name": "About ARCL Instruments Pvt. Ltd.",
      "description":
        "ARCL Instruments Pvt. Ltd. is an ISO 9001:2015 certified manufacturer & exporter of precision laboratory and civil testing equipment.",
      "mainEntity": {
        "@type": "Organization",
        "name": "ARCL Instruments Pvt. Ltd.",
        "url": "https://www.arclinstruments.com",
        "logo": "https://www.arclinstruments.com/assets/LOGO.png",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli",
          "addressLocality": "Navi Mumbai",
          "addressRegion": "Maharashtra",
          "postalCode": "400708",
          "addressCountry": "IN",
        },
      },
    },
  ],
};

export default function AboutRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <AboutClient />
    </>
  );
}


import AboutClient from "../../views/About.jsx";

export const metadata = {
  title: "About ARCL Instruments Private Limited | Civil Lab Equipment Manufacturer",
  description:
    "Learn about ARCL Instruments Private Limited, leading manufacturer of certified civil engineering, concrete, soil, bitumen, and material testing laboratory instruments in Navi Mumbai, India.",
  keywords: [
    "about ARCL Instruments",
    "laboratory equipment manufacturer",
    "ISO 9001:2015 certified company",
    "civil lab instruments manufacturer Navi Mumbai",
    "material testing machines India",
  ],
  alternates: {
    canonical: "https://arclinstruments.com/about",
  },
  openGraph: {
    title: "About ARCL Instruments Private Limited | Civil Lab Equipment Manufacturer",
    description:
      "Leading manufacturer of certified civil engineering and laboratory testing instruments based in Navi Mumbai, India.",
    url: "https://arclinstruments.com/about",
    siteName: "ARCL Instruments Private Limited",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "About ARCL Instruments Private Limited",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About ARCL Instruments Private Limited | Civil Lab Equipment Manufacturer",
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
          "item": "https://arclinstruments.com",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "About Us",
          "item": "https://arclinstruments.com/about",
        },
      ],
    },
    {
      "@type": "AboutPage",
      "@id": "https://arclinstruments.com/about#webpage",
      "url": "https://arclinstruments.com/about",
      "name": "About ARCL Instruments Private Limited",
      "description":
        "ARCL Instruments Private Limited is an ISO 9001:2015 certified manufacturer & exporter of precision laboratory and civil testing equipment.",
      "mainEntity": {
        "@type": "Organization",
        "name": "ARCL Instruments Private Limited",
        "url": "https://arclinstruments.com",
        "logo": "https://arclinstruments.com/assets/LOGO.png",
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


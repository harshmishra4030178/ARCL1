import "../index.css";
import ClientLayout from "./ClientLayout";

export const metadata = {
  metadataBase: new URL("https://arclinstruments.com"),
  title: {
    default: "ARCL Instruments | Civil Engineering & Material Testing Equipment Manufacturer India",
    template: "%s | ARCL Instruments",
  },
  description:
    "ARCL Instruments Pvt. Ltd. is an ISO 9001:2015 certified leading manufacturer and exporter of precision civil engineering, concrete, soil, bitumen, cement, aggregate, and material testing laboratory instruments in India.",
  keywords: [
    "Civil Engineering Laboratory Equipment",
    "Material Testing Equipment Manufacturer India",
    "Laboratory Testing Equipment Supplier",
    "Concrete Testing Equipment",
    "Soil Testing Equipment",
    "Aggregate Testing Equipment",
    "Cement Testing Equipment",
    "Bitumen Testing Equipment",
    "Civil Laboratory Equipment Manufacturer",
    "NABL calibration laboratory equipment",
    "ARCL Instruments Navi Mumbai",
  ],
  authors: [{ name: "ARCL Instruments Pvt. Ltd.", url: "https://arclinstruments.com" }],
  creator: "ARCL Instruments Pvt. Ltd.",
  publisher: "ARCL Instruments Pvt. Ltd.",
  category: "Industrial Equipment & Laboratory Testing Machines",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://arclinstruments.com",
    siteName: "ARCL Instruments Pvt. Ltd.",
    title: "ARCL Instruments | Civil & Material Testing Laboratory Equipment Manufacturer",
    description:
      "ISO 9001:2015 certified manufacturer of precision civil engineering, soil, concrete, asphalt, cement, and material testing machines in India.",
    images: [
      {
        url: "https://arclinstruments.com/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "ARCL Instruments - Civil & Material Testing Laboratory Equipment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ARCL Instruments | Civil Engineering & Material Testing Equipment",
    description:
      "Precision testing instruments for civil, geotechnical, and quality control laboratories across India.",
    images: ["https://arclinstruments.com/assets/LOGO.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "Mq-moqdyg-M2BS6wTh301R6U-gAmOxNFBQWVoPJQ1Y4",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://arclinstruments.com/#organization",
      "name": "ARCL Instruments Pvt. Ltd.",
      "alternateName": ["ARCL Instruments", "ARCL Material Testing Machines"],
      "url": "https://arclinstruments.com",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://arclinstruments.com/#logo",
        "url": "https://arclinstruments.com/assets/LOGO.png",
        "caption": "ARCL Instruments Logo",
      },
      "image": "https://arclinstruments.com/assets/LOGO.png",
      "description":
        "ISO 9001:2015 certified manufacturer and supplier of precision civil engineering, concrete, soil, cement, bitumen, aggregate, and material testing laboratory instruments in India.",
      "email": "arclinstruments@gmail.com",
      "telephone": "+91-8169695728",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli",
        "addressLocality": "Navi Mumbai",
        "addressRegion": "Maharashtra",
        "postalCode": "400708",
        "addressCountry": "IN",
      },
      "sameAs": [
        "https://www.linkedin.com/company/arcl-instruments",
        "https://www.instagram.com/arcl_instruments",
      ],
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+91-8169695728",
          "contactType": "sales",
          "areaServed": "IN",
          "availableLanguage": ["English", "Hindi", "Marathi"],
        },
        {
          "@type": "ContactPoint",
          "telephone": "+91-8169695728",
          "contactType": "technical support",
          "areaServed": "IN",
          "availableLanguage": ["English", "Hindi", "Marathi"],
        },
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="google-site-verification" content="Mq-moqdyg-M2BS6wTh301R6U-gAmOxNFBQWVoPJQ1Y4" />
        <meta name="geo.region" content="IN-MH" />
        <meta name="geo.placename" content="Navi Mumbai, Mumbai, Maharashtra" />
        <meta name="geo.position" content="19.1551;72.9984" />
        <meta name="ICBM" content="19.1551, 72.9984" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen flex flex-col bg-white text-gray-900"
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

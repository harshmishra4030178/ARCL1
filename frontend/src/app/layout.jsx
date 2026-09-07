import "../index.css";
import ClientLayout from "./ClientLayout";

export const metadata = {
  metadataBase: new URL("https://www.arclinstruments.com"),
  title: {
    default: "ARCL INSTRUMENTS PVT. LTD | Precision Laboratory & Civil Testing Equipment Manufacturer",
    template: "%s | ARCL Instruments",
  },
  description:
    "Leading ISO 9001:2015 certified manufacturer and exporter of precision civil engineering, concrete, soil, bitumen, cement, aggregate, and material testing laboratory instruments in India.",
  keywords: [
    "laboratory equipment manufacturer",
    "civil engineering lab equipment manufacturer India",
    "material testing machines",
    "concrete compression testing machine CTM",
    "soil testing equipment CBR direct shear",
    "bitumen ductility testing apparatus",
    "cement testing vicat apparatus",
    "aggregate testing sieve shaker",
    "NABL calibration laboratory equipment",
    "IS 516 concrete testing",
    "IS 2720 soil testing",
    "ARCL Instruments",
    "Navi Mumbai Airoli Maharashtra",
  ],
  authors: [{ name: "ARCL Instruments Pvt. Ltd." }],
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
    url: "https://www.arclinstruments.com",
    siteName: "ARCL Instruments Pvt. Ltd.",
    title: "ARCL Instruments | Material & Civil Testing Lab Equipment Manufacturer",
    description:
      "Leading manufacturer and exporter of civil, material, geotechnical, concrete, asphalt, and cement testing instruments in India. ISO 9001:2015 certified.",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "ARCL Instruments Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ARCL Instruments | Material & Civil Testing Lab Equipment",
    description:
      "Precision testing instruments for civil, geotechnical, and quality control laboratories across India.",
    images: ["/assets/LOGO.png"],
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="geo.region" content="IN-MH" />
        <meta name="geo.placename" content="Navi Mumbai, Mumbai, Maharashtra" />
        <meta name="geo.position" content="19.1551;72.9984" />
        <meta name="ICBM" content="19.1551, 72.9984" />
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


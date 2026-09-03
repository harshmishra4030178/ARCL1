import "../index.css";
import ClientLayout from "./ClientLayout";

export const metadata = {
  metadataBase: new URL("https://www.arclinstruments.com"),
  title: {
    default: "ARCL INSTRUMENTS PVT. LTD | Precision Laboratory & Testing Equipment",
    template: "%s | ARCL Instruments",
  },
  description:
    "Leading manufacturer and supplier of certified civil, material, mechanical, soil, concrete, cement, and medical laboratory testing equipment in India. ISO 9001:2015 certified.",
  keywords: [
    "laboratory equipment manufacturer",
    "civil engineering lab equipment",
    "material testing machines",
    "concrete testing equipment",
    "soil testing instruments",
    "ARCL Instruments",
    "Navi Mumbai",
  ],
  authors: [{ name: "ARCL Instruments Pvt. Ltd." }],
  creator: "ARCL Instruments Pvt. Ltd.",
  publisher: "ARCL Instruments Pvt. Ltd.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.arclinstruments.com",
    siteName: "ARCL Instruments Pvt. Ltd.",
    title: "ARCL Instruments | Material & Civil Testing Lab Equipment Manufacturer",
    description:
      "Leading manufacturer and supplier of civil, material, mechanical, soil, concrete, asphalt, cement, and medical laboratory testing instruments in India. ISO 9001:2015 certified.",
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


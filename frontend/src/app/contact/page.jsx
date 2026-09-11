import ContactClient from "../../views/Contact.jsx";

export const metadata = {
  title: "Contact ARCL Instruments | Civil Lab Equipment & Testing Equipment Supplier",
  description:
    "Get in touch with ARCL Instruments Private Limited for instant instrument pricing, factory quotations, custom engineering requirements, technical support, and office visits in Airoli, Navi Mumbai.",
  keywords: [
    "contact ARCL Instruments Private Limited",
    "contact ARCL Instruments",
    "laboratory equipment quote",
    "civil testing machines price India",
    "lab instruments manufacturer contact Navi Mumbai",
    "ARCL phone number email",
  ],
  alternates: {
    canonical: "https://arclinstruments.com/contact",
  },
  openGraph: {
    title: "Contact ARCL Instruments | Civil Lab Equipment & Testing Equipment Supplier",
    description:
      "Get instant factory quotes, technical assistance, and calibration support from ARCL Instruments Private Limited.",
    url: "https://arclinstruments.com/contact",
    siteName: "ARCL Instruments Private Limited",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "Contact ARCL Instruments Private Limited",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact ARCL Instruments | Civil Lab Equipment & Testing Equipment Supplier",
    description:
      "Direct factory pricing and quotes for civil testing machines. Call +91-8169695728 or email arclinstruments@gmail.com.",
    images: ["/assets/LOGO.png"],
  },
};

const contactJsonLd = {
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
          "name": "Contact Us",
          "item": "https://arclinstruments.com/contact",
        },
      ],
    },
    {
      "@type": "ContactPage",
      "@id": "https://arclinstruments.com/contact#webpage",
      "url": "https://arclinstruments.com/contact",
      "name": "Contact ARCL Instruments Private Limited",
      "description":
        "Contact page for ARCL Instruments Private Limited for inquiries, quotation requests, and technical support.",
      "mainEntity": {
        "@type": "LocalBusiness",
        "name": "ARCL Instruments Private Limited",
        "telephone": "+91-8169695728",
        "email": "arclinstruments@gmail.com",
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

export default function ContactRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <ContactClient />
    </>
  );
}


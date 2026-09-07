import ContactClient from "../../views/Contact.jsx";

export const metadata = {
  title: "Contact Us & Get a Quote | ARCL Instruments Pvt. Ltd.",
  description:
    "Get in touch with ARCL Instruments Pvt. Ltd. for instant instrument pricing, factory quotations, custom engineering requirements, technical support, and office visits in Airoli, Navi Mumbai.",
  keywords: [
    "contact ARCL Instruments",
    "laboratory equipment quote",
    "civil testing machines price India",
    "lab instruments manufacturer contact Navi Mumbai",
    "ARCL phone number email",
  ],
  alternates: {
    canonical: "https://www.arclinstruments.com/contact",
  },
  openGraph: {
    title: "Contact ARCL Instruments | Factory Quotation & Technical Inquiries",
    description:
      "Get instant factory quotes, technical assistance, and calibration support from ARCL Instruments Pvt. Ltd.",
    url: "https://www.arclinstruments.com/contact",
    siteName: "ARCL Instruments Pvt. Ltd.",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "Contact ARCL Instruments",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact ARCL Instruments",
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
          "item": "https://www.arclinstruments.com",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Contact Us",
          "item": "https://www.arclinstruments.com/contact",
        },
      ],
    },
    {
      "@type": "ContactPage",
      "@id": "https://www.arclinstruments.com/contact#webpage",
      "url": "https://www.arclinstruments.com/contact",
      "name": "Contact ARCL Instruments Pvt. Ltd.",
      "description":
        "Contact page for ARCL Instruments Pvt. Ltd. for inquiries, quotation requests, and technical support.",
      "mainEntity": {
        "@type": "LocalBusiness",
        "name": "ARCL Instruments Pvt. Ltd.",
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


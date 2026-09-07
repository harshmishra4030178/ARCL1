import CalibrationServicesClient from "../../views/CalibrationServices.jsx";

export const metadata = {
  title:
    "Instrument Calibration & Maintenance Services | ISO/IEC 17025 Compliant | ARCL Instruments",
  description:
    "Certified multi-point instrument calibration, on-site commissioning, load cell calibration, and maintenance services for civil, mechanical, thermal, pressure, and laboratory testing equipment by ARCL Instruments Pvt. Ltd.",
  keywords: [
    "instrument calibration services",
    "laboratory calibration India",
    "NABL traceable calibration certificate",
    "CTM machine calibration",
    "load cell calibration Navi Mumbai",
    "testing machine repair and maintenance",
    "ARCL Instruments",
  ],
  alternates: {
    canonical: "https://www.arclinstruments.com/calibration-services",
  },
  openGraph: {
    title: "NABL Traceable Calibration & Maintenance Services | ARCL Instruments",
    description:
      "Certified calibration and maintenance for compression testing machines, CBR, vicat, ovens, and lab instruments across India.",
    url: "https://www.arclinstruments.com/calibration-services",
    siteName: "ARCL Instruments Pvt. Ltd.",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "ARCL Calibration Services",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calibration & Maintenance Services | ARCL Instruments",
    description: "Multi-point calibration & certification with NABL traceability.",
    images: ["/assets/LOGO.png"],
  },
};

const calibrationJsonLd = {
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
          "name": "Calibration Services",
          "item": "https://www.arclinstruments.com/calibration-services",
        },
      ],
    },
    {
      "@type": "Service",
      "@id": "https://www.arclinstruments.com/calibration-services#service",
      "name": "Laboratory Instrument Calibration & Maintenance Services",
      "serviceType": "Calibration and Maintenance of Civil Testing Equipment",
      "description":
        "Professional NABL-traceable multi-point calibration, on-site commissioning, repair, and annual maintenance contract (AMC) services for laboratory and civil testing instruments.",
      "provider": {
        "@type": "Organization",
        "name": "ARCL Instruments Pvt. Ltd.",
        "url": "https://www.arclinstruments.com",
        "logo": "https://www.arclinstruments.com/assets/LOGO.png",
      },
      "areaServed": {
        "@type": "Country",
        "name": "India",
      },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "price": "Contact for Calibration Quote",
        "availability": "https://schema.org/InStock",
      },
    },
  ],
};

export default function CalibrationServicesRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calibrationJsonLd) }}
      />
      <CalibrationServicesClient />
    </>
  );
}


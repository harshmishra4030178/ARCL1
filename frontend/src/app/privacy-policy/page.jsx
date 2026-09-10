import PrivacyPolicy from "../../views/PrivacyPolicy.jsx";

export const metadata = {
  title: "Privacy Policy | ARCL Instruments Private Limited",
  description:
    "Official Privacy Policy of ARCL Instruments Private Limited. Understand how we collect, protect, and process quotation inquiries, customer data, and technical specifications.",
  keywords: [
    "ARCL privacy policy",
    "data protection ARCL instruments",
    "laboratory equipment inquiries privacy",
    "civil testing instruments privacy",
  ],
  alternates: {
    canonical: "https://arclinstruments.com/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | ARCL Instruments Private Limited",
    description:
      "Official Privacy Policy of ARCL Instruments Private Limited. Data protection and quotation confidentiality standards.",
    url: "https://arclinstruments.com/privacy-policy",
    siteName: "ARCL Instruments Private Limited",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "ARCL Instruments Private Limited Privacy Policy",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | ARCL Instruments Private Limited",
    description: "Official Privacy Policy & Data Protection Standards of ARCL Instruments Private Limited.",
    images: ["/assets/LOGO.png"],
  },
};

export default function PrivacyPolicyRoute() {
  return <PrivacyPolicy />;
}

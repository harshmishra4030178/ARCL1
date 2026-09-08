import PrivacyPolicy from "../../views/PrivacyPolicy.jsx";

export const metadata = {
  title: "Privacy Policy | ARCL Instruments Pvt. Ltd.",
  description:
    "Official Privacy Policy of ARCL Instruments Pvt. Ltd. Understand how we collect, protect, and process quotation inquiries, customer data, and technical specifications.",
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
    title: "Privacy Policy | ARCL Instruments Pvt. Ltd.",
    description:
      "Official Privacy Policy of ARCL Instruments Pvt. Ltd. Data protection and quotation confidentiality standards.",
    url: "https://arclinstruments.com/privacy-policy",
    siteName: "ARCL Instruments Pvt. Ltd.",
    images: [
      {
        url: "/assets/LOGO.png",
        width: 1200,
        height: 630,
        alt: "ARCL Instruments Privacy Policy",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | ARCL Instruments Pvt. Ltd.",
    description: "Official Privacy Policy & Data Protection Standards of ARCL Instruments Pvt. Ltd.",
    images: ["/assets/LOGO.png"],
  },
};

export default function PrivacyPolicyRoute() {
  return <PrivacyPolicy />;
}

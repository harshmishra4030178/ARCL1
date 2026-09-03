import AboutClient from "../../views/About.jsx";

export const metadata = {
  title: "About ARCL Instruments | ISO Certified Testing Machine Manufacturer",
  description:
    "Learn about ARCL Instruments Pvt. Ltd. Leading manufacturer of certified civil engineering, concrete, soil, bitumen, and material testing laboratory instruments.",
  keywords: [
    "about ARCL Instruments",
    "laboratory equipment manufacturer",
    "ISO 9001:2015 certified company",
    "civil lab instruments manufacturer Navi Mumbai",
  ],
  alternates: {
    canonical: "/about",
  },
};

export default function AboutRoute() {
  return <AboutClient />;
}

import CatalogClient from "../../views/CatalogPage.jsx";

export const metadata = {
  title: "Equipment Catalog & PDF Product Brochures | ARCL Instruments",
  description:
    "Download and view technical specification sheets, 1-click printable PDF brochures, and equipment catalogs from ARCL Instruments Pvt. Ltd.",
  keywords: [
    "laboratory equipment catalog",
    "civil testing brochure",
    "testing machine PDF catalog",
    "ARCL Instruments",
  ],
  alternates: {
    canonical: "/catalog",
  },
};

export default function CatalogRoute() {
  return <CatalogClient />;
}

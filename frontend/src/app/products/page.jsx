import ProductListingClient from "../../views/ProductListingPage.jsx";

export const metadata = {
  title: "Testing Instruments & Laboratory Equipment Catalogue",
  description:
    "Explore the complete catalogue of certified laboratory and civil engineering testing equipment by ARCL Instruments Pvt. Ltd. High accuracy testing solutions across India.",
  keywords: [
    "laboratory equipment catalogue",
    "civil testing machines",
    "soil testing",
    "cement testing instruments",
    "concrete testing",
    "ARCL Instruments",
  ],
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsPage() {
  return <ProductListingClient />;
}

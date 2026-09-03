import ProductCatalogPdfClient from "../../../../views/ProductCatalogPdfPage.jsx";

export const metadata = {
  title: "Official Product Catalog & Technical Brochure | ARCL Instruments",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function ProductCatalogPdfRoute({ params }) {
  const resolvedParams = await params;
  return <ProductCatalogPdfClient initialSlug={resolvedParams?.slug} />;
}

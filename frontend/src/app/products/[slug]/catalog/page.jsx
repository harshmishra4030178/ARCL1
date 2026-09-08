import ProductCatalogPdfClient from "../../../../views/ProductCatalogPdfPage.jsx";

export const dynamic = "force-dynamic";

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return "https://arcl1-1.onrender.com/api/v1";
  }
  return "http://localhost:5000/api/v1";
};

async function getProduct(slug) {
  try {
    const BACKEND_URL = getBackendUrl();
    const res = await fetch(`${BACKEND_URL}/client/products/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data || null;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const product = await getProduct(slug);

  return {
    title: product?.name
      ? `${product.name} - Technical Brochure & Catalogue | ARCL Instruments`
      : "Official Product Catalog & Technical Brochure | ARCL Instruments",
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function ProductCatalogPdfRoute({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const product = await getProduct(slug);
  return <ProductCatalogPdfClient initialSlug={slug} initialProduct={product} />;
}

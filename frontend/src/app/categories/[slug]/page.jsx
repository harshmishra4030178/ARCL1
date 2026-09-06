import { redirect } from "next/navigation";
import CategoryProductClient from "../../../views/CategoryProductPage.jsx";

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return "https://arcl1-1.onrender.com/api/v1";
  }
  return "http://localhost:5000/api/v1";
};

async function getCategoryData(slug) {
  try {
    const BACKEND_URL = getBackendUrl();
    const [catRes, prodRes] = await Promise.all([
      fetch(`${BACKEND_URL}/client/categories/${slug}`, { next: { revalidate: 60 } }),
      fetch(`${BACKEND_URL}/client/products/category/${slug}`, { next: { revalidate: 60 } }),
    ]);

    const category = catRes.ok ? (await catRes.json())?.data : null;
    const products = prodRes.ok ? (await prodRes.json())?.data : [];
    return { category, products };
  } catch (error) {
    return { category: null, products: [] };
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const { category } = await getCategoryData(slug);

  const name = category?.name || slug;
  const title = `${name} Testing Equipment & Instruments | ARCL Instruments`;
  const description =
    category?.description?.slice(0, 160) ||
    `Browse certified ${name} testing instruments and machines manufactured by ARCL Instruments Pvt. Ltd.`;

  return {
    title,
    description,
    keywords: [
      name,
      "lab testing equipment",
      "civil testing machines",
      "ARCL Instruments",
    ],
    alternates: {
      canonical: `/categories/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.arclinstruments.com/categories/${slug}`,
      type: "website",
    },
  };
}

export default async function CategoryDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const { category, products } = await getCategoryData(slug);

  // If this category represents 1 single product, instantly redirect on the server with ZERO delay/flicker
  if (products && products.length === 1 && products[0]?.slug) {
    redirect(`/products/${products[0].slug}`);
  }

  const categoryJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category?.name ? `${category.name} Equipment` : `${slug} Equipment`,
    description:
      category?.description ||
      `Explore high precision ${category?.name || slug} manufactured by ARCL Instruments Pvt. Ltd.`,
    url: `https://www.arclinstruments.com/categories/${slug}`,
    provider: {
      "@type": "Organization",
      name: "ARCL Instruments Pvt. Ltd.",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
      <CategoryProductClient initialSlug={slug} />
    </>
  );
}

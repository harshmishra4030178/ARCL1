import CategoryProductClient from "../../../views/CategoryProductPage.jsx";

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/v1`;
  }
  return "http://localhost:3000/api/v1";
};

async function getCategory(slug) {
  try {
    const BACKEND_URL = getBackendUrl();
    const res = await fetch(`${BACKEND_URL}/client/categories/${slug}`, {
      next: { revalidate: 60 },
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
  const category = await getCategory(slug);

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
  const category = await getCategory(slug);

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

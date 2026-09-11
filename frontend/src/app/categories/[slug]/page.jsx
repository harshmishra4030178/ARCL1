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
      fetch(`${BACKEND_URL}/client/categories/${slug}`, { next: { revalidate: 60 } }).catch(() => null),
      fetch(`${BACKEND_URL}/client/products/category/${slug}`, { next: { revalidate: 60 } }).catch(() => null),
    ]);

    const category = catRes && catRes.ok ? (await catRes.json())?.data : null;
    const products = prodRes && prodRes.ok ? (await prodRes.json())?.data : [];
    return { category, products };
  } catch (error) {
    return { category: null, products: [] };
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const { category } = await getCategoryData(slug);

  const name = category?.name || slug?.replace(/-/g, " ");
  let title = `${name} Manufacturer & Supplier | ARCL Instruments`;
  if (slug === "surveying-instruments" || slug === "non-destructive-testing-ndt-equipment") {
    title = `${name} Supplier in Mumbai | ARCL Instruments`;
  }
  const description =
    category?.description?.slice(0, 160) ||
    `Browse certified ${name} manufactured by ARCL Instruments Private Limited. Complying with IS, ASTM, and BS standards with NABL traceable calibration.`;
  const image = category?.image || "https://arclinstruments.com/assets/LOGO.png";

  return {
    title,
    description,
    keywords: [
      name,
      `${name} manufacturer India`,
      `${name} supplier Mumbai`,
      "civil engineering laboratory equipment",
      "material testing machines",
      "ARCL Instruments",
    ],
    alternates: {
      canonical: `https://arclinstruments.com/categories/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://arclinstruments.com/categories/${slug}`,
      siteName: "ARCL Instruments Private Limited",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${name} - ARCL Instruments`,
        },
      ],
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
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

  const categoryName = category?.name || slug?.replace(/-/g, " ");

  const categoryJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://arclinstruments.com",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Products",
            "item": "https://arclinstruments.com/products",
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": categoryName,
            "item": `https://arclinstruments.com/categories/${slug}`,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": `https://arclinstruments.com/categories/${slug}#webpage`,
        "name": `${categoryName} Testing Equipment & Instruments`,
        "description":
          category?.description ||
          `Explore high precision ${categoryName} manufactured by ARCL Instruments Private Limited. Complying with IS/ASTM standards.`,
        "url": `https://arclinstruments.com/categories/${slug}`,
        "provider": {
          "@type": "Organization",
          "name": "ARCL Instruments Private Limited",
          "url": "https://arclinstruments.com",
        },
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": (products || []).map((p, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "name": p.name,
            "url": `https://arclinstruments.com/products/${p.slug}`,
          })),
        },
      },
    ],
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

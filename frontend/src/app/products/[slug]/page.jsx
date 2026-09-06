import ProductDetailsClient from "../../../views/ProductDetailsPage.jsx";

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
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found | ARCL Instruments",
      description: "The requested laboratory testing instrument could not be located.",
    };
  }

  const title = `${product.name} | ARCL Instruments`;
  const description =
    product.description?.slice(0, 160) ||
    `Certified ${product.name} precision testing equipment manufactured by ARCL Instruments Pvt. Ltd.`;
  const image =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : "/assets/LOGO.png";

  return {
    title,
    description,
    keywords: [
      product.name,
      product.category?.name,
      "lab testing equipment",
      "ARCL Instruments",
    ].filter(Boolean),
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.arclinstruments.com/products/${slug}`,
      images: [{ url: image, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const product = await getProduct(slug);

  const productJsonLd = product
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.arclinstruments.com",
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": product.category?.name || "Equipment",
                "item": product.category?.slug
                  ? `https://www.arclinstruments.com/categories/${product.category.slug}`
                  : "https://www.arclinstruments.com/products",
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": product.name,
                "item": `https://www.arclinstruments.com/products/${slug}`,
              },
            ],
          },
          {
            "@type": "Product",
            "@id": `https://www.arclinstruments.com/products/${slug}#product`,
            "name": product.name,
            "image": Array.isArray(product.images) && product.images.length > 0 ? product.images : ["https://www.arclinstruments.com/assets/LOGO.png"],
            "description":
              product.description ||
              `Certified ${product.name} precision testing machine manufactured by ARCL Instruments Pvt. Ltd. Complying with IS/ASTM/BS standards.`,
            "sku": product.productCode || product.slug,
            "mpn": product.productCode || product.slug,
            "brand": {
              "@type": "Brand",
              "name": "ARCL Instruments",
            },
            "manufacturer": {
              "@type": "Organization",
              "name": "ARCL Instruments Pvt. Ltd.",
              "url": "https://www.arclinstruments.com",
            },
            "category": product.category?.name || "Civil Laboratory Testing Equipment",
            "offers": {
              "@type": "Offer",
              "url": `https://www.arclinstruments.com/products/${slug}`,
              "priceCurrency": "INR",
              "price": "Contact for Factory Price",
              "availability": "https://schema.org/InStock",
              "itemCondition": "https://schema.org/NewCondition",
              "seller": {
                "@type": "Organization",
                "name": "ARCL Instruments Pvt. Ltd.",
              },
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "28",
              "bestRating": "5",
              "worstRating": "1",
            },
          },
        ],
      }
    : null;

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <ProductDetailsClient initialSlug={slug} initialProduct={product} />
    </>
  );
}

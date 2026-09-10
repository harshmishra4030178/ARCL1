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
    }).catch(() => null);
    if (!res || !res.ok) return null;
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
      description: "The requested civil engineering testing instrument could not be located.",
      robots: { index: false, follow: true },
    };
  }

  const categoryName = product.category?.name || "Material Testing Equipment";
  const title = `${product.name} | ${categoryName} | ARCL Instruments`;
  const description =
    product.description?.slice(0, 160) ||
    `Certified ${product.name} precision testing equipment manufactured by ARCL Instruments Pvt. Ltd. Complying with IS, ASTM, and BS testing standards.`;
  const image =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : "https://arclinstruments.com/assets/LOGO.png";

  return {
    title,
    description,
    keywords: [
      product.name,
      `${product.name} manufacturer India`,
      `${product.name} supplier`,
      categoryName,
      "Civil Engineering Laboratory Equipment",
      "material testing machines",
      "ARCL Instruments",
    ].filter(Boolean),
    alternates: {
      canonical: `https://arclinstruments.com/products/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://arclinstruments.com/products/${slug}`,
      siteName: "ARCL Instruments Private Limited",
      images: [{ url: image, alt: product.name, width: 1200, height: 630 }],
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
                "item": "https://arclinstruments.com",
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": product.category?.name || "Products",
                "item": product.category?.slug
                  ? `https://arclinstruments.com/categories/${product.category.slug}`
                  : "https://arclinstruments.com/products",
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": product.name,
                "item": `https://arclinstruments.com/products/${slug}`,
              },
            ],
          },
          {
            "@type": "Product",
            "@id": `https://arclinstruments.com/products/${slug}#product`,
            "name": product.name,
            "image": Array.isArray(product.images) && product.images.length > 0 ? product.images : ["https://arclinstruments.com/assets/LOGO.png"],
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
              "url": "https://arclinstruments.com",
            },
            "category": product.category?.name || "Civil Laboratory Testing Equipment",
            "offers": {
              "@type": "Offer",
              "url": `https://arclinstruments.com/products/${slug}`,
              "priceCurrency": "INR",
              ...(typeof product.price === "number" && product.price > 0
                ? { "price": product.price }
                : {}),
              "availability": "https://schema.org/InStock",
              "itemCondition": "https://schema.org/NewCondition",
              "seller": {
                "@type": "Organization",
                "name": "ARCL Instruments Pvt. Ltd.",
              },
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
      <ProductDetailsClient initialSlug={slug} />
    </>
  );
}

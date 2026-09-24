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

    const catJson = catRes && catRes.ok ? await catRes.json() : null;
    const prodJson = prodRes && prodRes.ok ? await prodRes.json() : null;

    const category = catJson?.data || prodJson?.category || null;
    const products = prodJson?.products || prodJson?.data || [];
    return { category, products };
  } catch (error) {
    return { category: null, products: [] };
  }
}

const getCategorySeoData = (categoryName, slug) => {
  const s = (slug || "").toLowerCase();
  const n = categoryName || "Civil Testing Equipment";

  if (s.includes("concrete") || s.includes("ctm") || s.includes("compression") || s.includes("slump") || s.includes("cube")) {
    return {
      standards: ["IS 516", "IS 1199", "IS 9013", "IS 10086", "ASTM C39", "BS 1881"],
      faqs: [
        {
          question: `What standards govern ${n}?`,
          answer: `${n} manufactured by ARCL Instruments complies strictly with Bureau of Indian Standards specifications including IS 516 (Compressive and Flexural Strength), IS 1199 (Workability & Sampling), and ASTM C39 / BS 1881 standards.`,
        },
        {
          question: `Does ARCL Instruments provide NABL traceable calibration for ${n}?`,
          answer: `Yes, all ${n} units including Compression Testing Machines, digital load indicators, and moulds are supplied with factory NABL-traceable calibration test certificates.`,
        },
        {
          question: `What is the warranty and dispatch timeline for ${n}?`,
          answer: `Standard accessories and testing apparatus are dispatched within 24 to 48 hours across Mumbai and pan-India. Heavy machinery includes 12 months comprehensive manufacturer warranty and on-site commissioning.`,
        },
      ],
    };
  }

  if (s.includes("soil") || s.includes("cbr") || s.includes("shear") || s.includes("spt") || s.includes("dcpt") || s.includes("proctor")) {
    return {
      standards: ["IS 2720", "IS 2131", "IS 4968", "ASTM D1883", "ASTM D3080"],
      faqs: [
        {
          question: `Which Indian Standards apply to ${n}?`,
          answer: `${n} complies with IS 2720 series (Soil Testing for Civil Engineering), IS 2131 (Standard Penetration Test), and ASTM D1883 / AASHTO T193 standards for geotechnical investigation and highway subgrade design.`,
        },
        {
          question: `Can ${n} be used for both laboratory and in-situ field testing?`,
          answer: `Yes, ARCL Instruments manufactures laboratory test setups (Motorized CBR, Direct Shear, Triaxial) as well as rugged field testing apparatus (Sand Pouring, Core Cutters, Dynamic Cone Penetrometers).`,
        },
        {
          question: `How can I request a customized technical quotation for ${n}?`,
          answer: `You can click 'Single Quote' or 'WhatsApp Quote' on any product model, or contact our Mumbai sales engineering desk directly at +91-8169695728.`,
        },
      ],
    };
  }

  if (s.includes("bitumen") || s.includes("asphalt") || s.includes("ductility") || s.includes("penetration") || s.includes("marshall") || s.includes("softening")) {
    return {
      standards: ["IS 1201 to IS 1220", "IS 1208", "IS 1203", "ASTM D6927", "ASTM D5"],
      faqs: [
        {
          question: `What testing parameters are evaluated using ${n}?`,
          answer: `${n} evaluates critical binder and asphalt mix properties including ductility elongation (IS 1208), penetration consistency (IS 1203), softening point (IS 1205), and Marshall stability plastic flow (ASTM D6927 / MoRTH).`,
        },
        {
          question: `Are temperature controls automated for ${n}?`,
          answer: `Yes, ARCL ${n} features high-precision digital PID microprocessor controllers and heating/cooling baths to maintain exact testing temperatures required by BIS and ASTM methods.`,
        },
      ],
    };
  }

  if (s.includes("cement") || s.includes("vicat") || s.includes("mortar") || s.includes("soundness") || s.includes("le-chatelier")) {
    return {
      standards: ["IS 4031", "IS 5512", "IS 5513", "IS 10080", "ASTM C191", "EN 196"],
      faqs: [
        {
          question: `Which standard applies to ${n}?`,
          answer: `${n} is manufactured according to IS 4031 (Methods of Physical Tests for Hydraulic Cement), IS 5513 (Vicat Apparatus), and IS 10080 (Mortar Vibrating Machine) specifications.`,
        },
        {
          question: `What accessories are supplied with ${n}?`,
          answer: `Standard supply includes all plungers, needles, split moulds, dashpot assemblies, and operating manuals required for immediate laboratory use.`,
        },
      ],
    };
  }

  if (s.includes("aggregate") || s.includes("sieve") || s.includes("impact") || s.includes("crushing") || s.includes("abrasion")) {
    return {
      standards: ["IS 2386 (Parts 1-8)", "IS 460", "ASTM C136", "BS 812"],
      faqs: [
        {
          question: `What IS codes are relevant for ${n}?`,
          answer: `${n} adheres to IS 2386 (Methods of Test for Aggregates for Concrete) and IS 460 (Test Sieves) for grain size gradation, impact resistance, and crushing strength.`,
        },
        {
          question: `Are test sieves supplied with inspection certificates?`,
          answer: `Yes, ARCL brass and stainless steel test sieves are fabricated with ISI-certified wire cloth and provided with aperture verification calibration certificates.`,
        },
      ],
    };
  }

  if (s.includes("ndt") || s.includes("non-destructive") || s.includes("rebound") || s.includes("ultrasonic") || s.includes("upv")) {
    return {
      standards: ["IS 13311 (Parts 1 & 2)", "ASTM C805", "ASTM C597", "BS 1881-202"],
      faqs: [
        {
          question: `What are the benefits of ${n} for structural audits?`,
          answer: `${n} provides non-invasive, rapid assessment of concrete compressive strength, surface hardness, internal honeycombing, and crack depths without structural damage.`,
        },
        {
          question: `Is on-site calibration available for ${n}?`,
          answer: `Yes, ARCL provides verification anvils, calibration test certificates, and on-site instrument demonstration across Mumbai and Maharashtra.`,
        },
      ],
    };
  }

  // Default fallback
  return {
    standards: ["IS Standards", "ASTM International", "ISO 9001:2015", "NABL Traceable"],
    faqs: [
      {
        question: `Does ARCL Instruments manufacture ${n} in India?`,
        answer: `Yes, ARCL Instruments Private Limited manufactures and supplies certified ${n} with heavy-duty construction, high-precision calibration, and pan-India delivery.`,
      },
      {
        question: `How can I get an official GST quotation for ${n}?`,
        answer: `Select your required models from the catalog and click 'Single Quote' or 'Add to Basket' for a quick formal quotation, or call our sales desk at +91-8169695728.`,
      },
    ],
  };
};

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const { category, products } = await getCategoryData(slug);

  const name = category?.name || slug?.replace(/-/g, " ");
  const seoData = getCategorySeoData(name, slug);
  const standardsText = seoData.standards.join(", ");

  let title = `${name} Manufacturer & Supplier | ARCL Instruments`;
  if (slug === "surveying-instruments" || slug === "non-destructive-testing-ndt-equipment") {
    title = `${name} Supplier in Mumbai | ARCL Instruments`;
  }
  const description =
    category?.description?.slice(0, 160) ||
    `Certified ${name} manufacturer and supplier by ARCL Instruments Private Limited. Complying with ${standardsText} with NABL traceable calibration.`;
  const image = category?.image || "https://arclinstruments.com/assets/LOGO.png";

  return {
    title,
    description,
    keywords: [
      name,
      `${name} manufacturer India`,
      `${name} supplier Mumbai`,
      `${name} testing equipment`,
      ...seoData.standards,
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

  // If this category represents 1 single specific machine item (not a broad classification), redirect to that product
  const broadEquipmentSlugs = [
    "concrete-testing-equipment",
    "soil-testing-equipment",
    "aggregate-testing-equipment",
    "bitumen-testing-equipment",
    "cement-testing-equipment",
    "surveying-instruments",
    "non-destructive-testing-ndt-equipment",
    "laboratory-glassware-accessories",
    "scientific-instruments",
  ];

  if (
    !broadEquipmentSlugs.includes(slug) &&
    products &&
    products.length === 1 &&
    products[0]?.slug &&
    products[0]?.slug !== slug
  ) {
    redirect(`/products/${products[0].slug}`);
  }

  const categoryName = category?.name || slug?.replace(/-/g, " ");
  const seoData = getCategorySeoData(categoryName, slug);

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
          `Explore high precision ${categoryName} manufactured by ARCL Instruments Private Limited. Complying with ${seoData.standards.join(", ")}.`,
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
      {
        "@type": "FAQPage",
        "@id": `https://arclinstruments.com/categories/${slug}#faq`,
        "mainEntity": seoData.faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
      <CategoryProductClient
        initialSlug={slug}
        initialCategory={category}
        initialProducts={products}
        seoData={seoData}
      />
    </>
  );
}


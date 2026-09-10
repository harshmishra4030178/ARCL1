const SITE_URL = "https://arclinstruments.com";

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return "https://arcl1-1.onrender.com/api/v1";
  }
  return "http://localhost:5000/api/v1";
};

// Fallback high-value categories
const FALLBACK_CATEGORIES = [
  "concrete-testing-equipment",
  "soil-testing-equipment",
  "aggregate-testing-equipment",
  "bitumen-testing-equipment",
  "cement-testing-equipment",
  "non-destructive-testing-ndt-equipment",
  "surveying-instruments",
  "laboratory-glassware-accessories",
];

// Fallback high-value technical blogs
const FALLBACK_BLOGS = [
  "is-516-concrete-cube-compressive-strength-test-complete-guide",
  "is-2720-cbr-test-california-bearing-ratio-soil-highway-subgrade",
  "is-1208-bitumen-ductility-test-highway-construction-guide",
  "is-4031-cement-consistency-initial-final-setting-time-vicat-apparatus",
  "importance-of-nabl-calibration-for-civil-testing-laboratories",
];

export default async function sitemap() {
  const BACKEND_URL = getBackendUrl();
  let categories = [];
  let products = [];
  let blogs = [];

  try {
    const [catRes, prodRes, blogRes] = await Promise.all([
      fetch(`${BACKEND_URL}/client/categories`, {
        next: { revalidate: 3600 },
      }).catch(() => null),
      fetch(`${BACKEND_URL}/client/products`, {
        next: { revalidate: 3600 },
      }).catch(() => null),
      fetch(`${BACKEND_URL}/client/blogs`, {
        next: { revalidate: 3600 },
      }).catch(() => null),
    ]);

    if (catRes && catRes.ok) {
      const catData = await catRes.json();
      categories = catData?.data || [];
    }
    if (prodRes && prodRes.ok) {
      const prodData = await prodRes.json();
      products = prodData?.data || [];
    }
    if (blogRes && blogRes.ok) {
      const blogData = await blogRes.json();
      blogs = blogData?.data || [];
    }
  } catch (error) {
    console.warn("Sitemap API fetch warning:", error.message);
  }

  // Core Static SEO Pages
  const staticUrls = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/standards`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/catalog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/calibration-services`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/company-profile`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/civil-lab-equipment-mumbai`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/civil-lab-equipment-navi-mumbai`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/civil-lab-equipment-thane`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamic Categories (with fallback safety)
  const categoryUrls =
    categories.length > 0
      ? categories.map((cat) => ({
          url: `${SITE_URL}/categories/${cat.slug}`,
          lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.9,
        }))
      : FALLBACK_CATEGORIES.map((slug) => ({
          url: `${SITE_URL}/categories/${slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.9,
        }));

  // Dynamic Products
  const productUrls = products.map((prod) => ({
    url: `${SITE_URL}/products/${prod.slug}`,
    lastModified: prod.updatedAt ? new Date(prod.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  // Dynamic Technical Blog Articles (with fallback safety)
  const blogUrls =
    blogs.length > 0
      ? blogs.map((b) => ({
          url: `${SITE_URL}/blog/${b.slug}`,
          lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.85,
        }))
      : FALLBACK_BLOGS.map((slug) => ({
          url: `${SITE_URL}/blog/${slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.85,
        }));

  return [...staticUrls, ...categoryUrls, ...productUrls, ...blogUrls];
}

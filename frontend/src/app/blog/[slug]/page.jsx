import BlogDetailsClient from "../../../views/BlogDetailsPage.jsx";
import { INITIAL_BLOGS } from "../../../data/blogData.js";

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return "https://arcl1-1.onrender.com/api/v1";
  }
  return "http://localhost:5000/api/v1";
};

async function getBlog(slug) {
  try {
    const BACKEND_URL = getBackendUrl();
    const res = await fetch(`${BACKEND_URL}/client/blogs/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.blog) return data.data.blog;
    }
  } catch (error) {
    // fallback to local dataset
  }

  return INITIAL_BLOGS.find((b) => b.slug === slug) || null;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const blog = await getBlog(slug);

  if (!blog) {
    return {
      title: "Article Not Found | ARCL Instruments",
      description: "The requested civil engineering testing guide could not be located.",
    };
  }

  const title = blog.metaTitle || `${blog.title} | ARCL Technical Hub`;
  const description = blog.metaDescription || blog.excerpt?.slice(0, 160);
  const image = blog.featuredImage || "/assets/LOGO.png";

  return {
    title,
    description,
    keywords: [
      blog.title,
      blog.category,
      ...(blog.tags || []),
      ...(blog.relatedStandards || []),
      "ARCL Instruments",
    ],
    alternates: {
      canonical: `https://arclinstruments.com/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://arclinstruments.com/blog/${slug}`,
      siteName: "ARCL Instruments Pvt. Ltd.",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
      type: "article",
      publishedTime: blog.publishedAt,
      authors: [blog.author?.name || "ARCL Instruments"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function SingleBlogPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const blog = await getBlog(slug);

  const blogJsonLd = blog
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
                "name": "Blog",
                "item": "https://arclinstruments.com/blog",
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": blog.title,
                "item": `https://arclinstruments.com/blog/${slug}`,
              },
            ],
          },
          {
            "@type": "BlogPosting",
            "@id": `https://arclinstruments.com/blog/${slug}#article`,
            "headline": blog.title,
            "name": blog.title,
            "description": blog.excerpt,
            "image": [blog.featuredImage || "https://arclinstruments.com/assets/LOGO.png"],
            "datePublished": blog.publishedAt,
            "dateModified": blog.updatedAt || blog.publishedAt,
            "author": {
              "@type": "Person",
              "name": blog.author?.name || "ARCL Technical Team",
              "jobTitle": blog.author?.role || "Civil Testing Specialist",
            },
            "publisher": {
              "@type": "Organization",
              "name": "ARCL Instruments Pvt. Ltd.",
              "url": "https://arclinstruments.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://arclinstruments.com/assets/LOGO.png",
              },
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://arclinstruments.com/blog/${slug}`,
            },
            "articleSection": blog.category,
            "keywords": (blog.tags || []).join(", "),
          },
        ],
      }
    : null;

  return (
    <>
      {blogJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
        />
      )}
      <BlogDetailsClient initialSlug={slug} initialBlog={blog} />
    </>
  );
}

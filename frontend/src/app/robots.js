export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/"],
    },
    sitemap: "https://www.arclinstruments.com/sitemap.xml",
    host: "https://www.arclinstruments.com",
  };
}

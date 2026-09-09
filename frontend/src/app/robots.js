export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/admin/*",
          "/api/",
          "/api/*",
        ],
      },
    ],
    sitemap: "https://arclinstruments.com/sitemap.xml",
    host: "https://arclinstruments.com",
  };
}

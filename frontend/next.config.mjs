/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/concrete-testing-equipment",
        destination: "/categories/concrete-testing-equipment",
      },
      {
        source: "/soil-testing-equipment",
        destination: "/categories/soil-testing-equipment",
      },
      {
        source: "/aggregate-testing-equipment",
        destination: "/categories/aggregate-testing-equipment",
      },
      {
        source: "/cement-testing-equipment",
        destination: "/categories/cement-testing-equipment",
      },
      {
        source: "/bitumen-testing-equipment",
        destination: "/categories/bitumen-testing-equipment",
      },
      {
        source: "/surveying-instruments",
        destination: "/categories/surveying-instruments",
      },
      {
        source: "/ndt-testing-equipment",
        destination: "/categories/non-destructive-testing-ndt-equipment",
      },
    ];
  },
};

export default nextConfig;

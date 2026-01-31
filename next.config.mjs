/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warnings shouldn't block production builds
    ignoreDuringBuilds: false,
  },
  reactStrictMode: true,
};

export default nextConfig;

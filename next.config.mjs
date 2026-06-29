/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prototype: do not block local dev/build on lint config.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;

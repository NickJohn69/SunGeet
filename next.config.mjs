/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['youtubei.js'],
  },
  // Allow other devices on the network to access the dev server
  allowedDevOrigins: ['10.10.28.82', '192.168.56.1', '10.10.28.*'],
};

export default nextConfig;

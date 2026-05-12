/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  // Allow other devices on the network to access the dev server
  // Update this IP if your Wi-Fi IP changes (run ipconfig to find it)
  allowedDevOrigins: ['10.10.28.82', '192.168.56.1', '10.10.28.*'],
};

export default nextConfig;

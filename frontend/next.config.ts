import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const phpPort = process.env.PHP_PORT || "80";
    const phpBaseUrl = process.env.PHP_BASE_URL || `http://localhost:${phpPort}/patient-system`;
    return [
      // Proxy PHP backend served by XAMPP so frontend can call same-origin 
      { source: "/api/login", destination: `${phpBaseUrl}/login.php` },
      { source: "/api/register", destination: `${phpBaseUrl}/register.php` },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const phpPort = process.env.PHP_PORT || "80";
    // Base URL points to the root 'patient-system' folder in htdocs
    const phpBaseUrl = process.env.PHP_BASE_URL || `http://localhost:${phpPort}/patient-system`;

    return [
      // Standalone Files
      { 
        source: "/api/mutation_dataset_visual", 
        destination: `${phpBaseUrl}/mutation_dataset_visual.php` 
      },
      { 
        source: "/api/mutation_gene_frequency", 
        destination: `${phpBaseUrl}/mutation_gene_frequency.php` 
      },
      { 
        source: "/api/mutation_chromosome_distribution", 
        destination: `${phpBaseUrl}/mutation_chromosome_distribution.php` 
      },
      { 
        source: "/api/register", 
        destination: `${phpBaseUrl}/register.php` 
      },
      { 
        source: "/api/predict", 
        destination: `${phpBaseUrl}/predict.php` 
      },

      { 
        source: "/api/login", 
        destination: `${phpBaseUrl}/login.php` 
      },
      { 
        source: "/api/logout", 
        destination: `${phpBaseUrl}/logout.php` 
      },

      { 
        source: "/api/upload_photo", 
        destination: `${phpBaseUrl}/api/upload_photo.php` 
      },
      
      // Proxy static uploads from PHP server
      {
        source: "/patient-system/uploads/:path*",
        destination: `${phpBaseUrl}/uploads/:path*`
      },

      // Catch-All for Controllers 
      { 
        source: "/api/:path*", 
        destination: `${phpBaseUrl}/api/api.php/:path*` 
      },
    ];
  },
};

export default nextConfig;
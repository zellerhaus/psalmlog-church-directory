import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Cache headers for optimal performance
  async headers() {
    return [
      {
        // Static assets (fonts, images) - cache for 1 year
        source: '/:path*.(ico|jpg|jpeg|png|gif|webp|avif|svg|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // JS/CSS bundles - cache for 1 year (they have hashes)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // HTML pages - revalidate frequently
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com https://static.cloudflareinsights.com https://connect.facebook.net https://cdn.amplitude.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://beacon-v2.helpscout.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://apps.apple.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google.com https://*.doubleclick.net",
              "connect-src 'self' https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://cloudflareinsights.com https://*.google.com https://analytics.google.com https://connect.facebook.net https://*.facebook.com https://cdn.amplitude.com https://api.amplitude.com https://beacon-v2.helpscout.net",
              "frame-src https://www.googletagmanager.com https://www.facebook.com https://bid.g.doubleclick.net",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // Sitemap - cache for 1 day
        source: '/churches/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=43200',
          },
        ],
      },
      {
        // robots.txt - cache for 1 day
        source: '/robots.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },

  // Redirects for SEO consistency
  async redirects() {
    return [
      // Redirect trailing slashes to non-trailing
      {
        source: '/churches/:path+/',
        destination: '/churches/:path+',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

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
            // Relaxed CSP to allow GTM to load third-party scripts dynamically
            // Security is maintained via frame-ancestors (clickjacking) and form-action
            // Cloudflare Turnstile requires challenges.cloudflare.com for scripts and frames
            key: 'Content-Security-Policy',
            value: [
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-src https://challenges.cloudflare.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.googletagmanager.com",
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

  // Rewrites for sitemap .xml extensions
  async rewrites() {
    return [
      // Rewrite /churches/sitemaps/alabama/birmingham.xml to /churches/sitemaps/alabama/birmingham
      {
        source: '/churches/sitemaps/:state/:city.xml',
        destination: '/churches/sitemaps/:state/:city',
      },
    ];
  },
};

export default nextConfig;

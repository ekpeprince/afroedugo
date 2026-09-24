import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  workboxOptions: {
    navigateFallbackDenylist: [/^\/__\//],
    importScripts: ["/firebase-messaging-sw.js"]
  }
});

const securityHeaders = [
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Prevent browser XSS filtering vulnerabilities
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Strict Referrer Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Restrict sensitive browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },
  // HTTP Strict Transport Security (HSTS)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Content Security Policy (CSP) to block malicious scripts and inline attacks
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.apis.google.com https://maps.googleapis.com https://www.google.com https://*.google.com https://*.gstatic.com https://*.firebaseapp.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com https://*.gstatic.com data:",
      "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://*.firebasestorage.app https://images.unsplash.com https://lh3.googleusercontent.com https://ui-avatars.com https://maps.googleapis.com https://maps.gstatic.com https://flagsapi.com https://flagcdn.com https://*.google.com https://*.googleusercontent.com",
      "connect-src 'self' https://apis.google.com https://*.apis.google.com https://accounts.google.com https://*.google.com https://*.googleapis.com https://*.gstatic.com https://fonts.gstatic.com https://fonts.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://*.firebasestorage.app https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://fcm.googleapis.com https://studyin.lt https://afroedugo.com https://www.afroedugo.com",
      "frame-src 'self' https://afroedugo-b0b3f.firebaseapp.com https://*.firebaseapp.com https://afroedugo-b0b3f.web.app https://*.web.app https://accounts.google.com https://*.google.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; '),
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable production source maps to avoid leaking source code
  productionBrowserSourceMaps: false,
  // Strip console.log/debug in production builds to keep sensitive data out of logs
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  // Tighten image remote patterns to explicit trusted hosts
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.firebasestorage.app',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'flagsapi.com',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      }
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/__/auth/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://afroedugo-b0b3f.firebaseapp.com https://*.firebaseapp.com https://accounts.google.com https://*.google.com",
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' ? 'https://afroedugo.com' : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://afroedugo-b0b3f.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default withPWA(nextConfig);

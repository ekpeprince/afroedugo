import '../index.css';
import ClientWrapper from '../components/ClientWrapper';

export const metadata = {
  metadataBase: new URL('https://www.afroedugo.com'),
  title: {
    default: 'AfroEduGo | Pan-European Digital Mobility Platform',
    template: '%s | AfroEduGo',
  },
  description:
    "AfroEduGo is Europe's premier digital mobility and higher education platform, streamlining cross-border international student recruitment, verified university admissions, and housing allocation.",
  keywords: [
    'European Higher Education',
    'International Student Mobility',
    'Verified University Admissions',
    'Study in Europe',
    'European Student Housing',
    'AfroEduGo',
  ],
  authors: [{ name: 'AfroEduGo Admissions & Mobility Division' }],
  creator: 'AfroEduGo Enterprise',
  publisher: 'AfroEduGo Enterprise',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.afroedugo.com',
    siteName: 'AfroEduGo',
    title: 'AfroEduGo | Pan-European Digital Mobility & Admissions Platform',
    description:
      'Connecting international scholars with verified European higher education institutions through streamlined admissions and housing allocation networks.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AfroEduGo European Digital Mobility Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AfroEduGo | Pan-European Digital Mobility Platform',
    description:
      'Connecting international scholars with verified European higher education institutions.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'nrmwOLBrsBCBenjesDiCeED-7vqF1go8rY7OJ9HMxqs',
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'AfroEduGo',
    url: 'https://www.afroedugo.com',
    logo: 'https://www.afroedugo.com/logo.png',
    description:
      'Pan-European digital mobility platform connecting international students with verified admissions & housing.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kaunas',
      addressCountry: 'LT',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+37063423845',
      contactType: 'Admissions & Mobility Desk',
      email: 'contact@afroedugo.com',
      availableLanguage: ['English', 'Lithuanian'],
    },
    sameAs: [
      'https://www.linkedin.com/company/afroedugo',
      'https://www.linkedin.com/in/princeekpe',
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#065F46" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AfroEduGo" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}

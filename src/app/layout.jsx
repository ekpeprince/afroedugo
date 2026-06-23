import '../index.css';
import ClientWrapper from '../components/ClientWrapper';

export const metadata = {
  title: 'AfroEduGo | The Ultimate Hub for African Students Studying Abroad',
  description: 'Join the AfroEduGo community. Find affordable housing, discover schools, get visa assistance, and connect with other African students studying globally.',
  openGraph: {
    title: 'AfroEduGo | African Students Guide',
    description: 'Find affordable housing, discover schools, and connect with other African students studying globally.',
    url: 'https://afroedugo.com',
    siteName: 'AfroEduGo',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'AfroEduGo Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AfroEduGo | The Ultimate Hub for African Students',
    description: 'Find affordable housing, discover schools, get visa assistance, and connect with other African students studying globally.',
    images: ['/icon-512.png'],
  },
};

export default function RootLayout({ children }) {
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
      <body className="bg-white text-gray-900">
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}

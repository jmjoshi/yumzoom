import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/useAuth';
import { Navbar } from '@/components/layouts/Navbar';
import { PWAProvider } from '@/components/pwa/PWAProvider';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { MobileBottomNavigation, MobileFloatingActionButton } from '@/components/pwa/MobileBottomNavigation';
import { AdvancedMobileFeatures } from '@/components/pwa/AdvancedMobileFeatures';
import { RoleDebugger } from '@/components/debug/RoleDebugger';
import { QuickRoleDebug } from '@/components/debug/QuickRoleDebug';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ['food', 'restaurant', 'rating', 'reviews', 'family', 'dining', 'mobile app', 'PWA'],
  authors: [{ name: 'YumZoom Team' }],
  creator: 'YumZoom',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
    startupImage: [
      '/icons/apple-splash-2048-2732.png',
      '/icons/apple-splash-1668-2224.png',
      '/icons/apple-splash-1536-2048.png',
      '/icons/apple-splash-1125-2436.png',
      '/icons/apple-splash-1242-2208.png',
      '/icons/apple-splash-750-1334.png',
      '/icons/apple-splash-828-1792.png',
    ],
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icons/safari-pinned-tab.svg',
        color: '#f59e0b',
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    images: [
      {
        url: '/icons/og-image.png',
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - Family Restaurant Reviews`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ['/icons/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-TileColor': '#f59e0b',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="YumZoom" />
        <meta name="application-name" content="YumZoom" />
        <meta name="msapplication-TileColor" content="#f59e0b" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <PWAProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <OfflineIndicator />
              <Navbar />
              <main className="pb-20 md:pb-0">{children}</main>
              <MobileBottomNavigation />
              <MobileFloatingActionButton />
              <AdvancedMobileFeatures />
              <PWAInstallPrompt />
              <RoleDebugger />
              <QuickRoleDebug />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    style: {
                      background: '#059669',
                    },
                  },
                  error: {
                    style: {
                      background: '#DC2626',
                    },
                  },
                }}
              />
            </div>
          </AuthProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAInstaller } from "@/components/pwa/PWAInstaller";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TeamUp - Trouvez vos partenaires sportifs",
    template: "%s | TeamUp"
  },
  description: "Rejoignez la communauté TeamUp pour trouver des partenaires sportifs, créer des événements et partager votre passion du sport.",
  applicationName: "TeamUp",
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo/ios/16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/logo/ios/32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo/ios/64.png', sizes: '64x64', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/images/logo/ios/180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        url: '/images/logo/ios/192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/images/logo/ios/512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  manifest: '/manifest.json',
  themeColor: '#9BD1C0',
  colorScheme: 'light',

  keywords: ['sport', 'événements', 'partenaires', 'communauté', 'fitness', 'teamup', 'tennis', 'football', 'basketball', 'course'],
  authors: [{ name: 'TeamUp', url: 'https://teamup.app' }],
  creator: 'TeamUp',
  publisher: 'TeamUp',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://teamup.app',
    siteName: 'TeamUp',
    title: 'TeamUp - Trouvez vos partenaires sportifs',
    description: 'Rejoignez la communauté TeamUp pour trouver des partenaires sportifs, créer des événements et partager votre passion du sport.',
    images: [
      {
        url: '/images/logo/ios/512.png',
        width: 512,
        height: 512,
        alt: 'TeamUp Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'TeamUp - Trouvez vos partenaires sportifs',
    description: 'Rejoignez la communauté TeamUp pour trouver des partenaires sportifs, créer des événements et partager votre passion du sport.',
    images: ['/images/logo/ios/512.png'],
  },
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
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#9BD1C0',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          {children}
          <PWAInstaller />
        </AuthProvider>
      </body>
    </html>
  );
}

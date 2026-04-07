// File: frontend/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { DM_Serif_Display, Manrope } from 'next/font/google';
import RouteShell from '@/components/route-shell';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'Lovique',
  description: 'Lovique auth and companion dashboard.',
  applicationName: 'Lovique',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lovique',
  },
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/icons/android-192',
        type: 'image/png',
        sizes: '192x192',
      },
    ],
    shortcut: [
      {
        url: '/icons/android-192',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-icon',
        type: 'image/png',
        sizes: '180x180',
      },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/mask-icon.svg',
        color: '#ff8e72',
      },
    ],
  },
};

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#110f18' },
    { media: '(prefers-color-scheme: light)', color: '#f7efe7' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `
    (function () {
      try {
        var key = 'lovique-theme';
        var stored = window.localStorage.getItem(key);
        var theme = stored === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (error) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  `;

  return (
    <html
      lang="en"
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${manrope.variable} ${dmSerifDisplay.variable} min-h-full antialiased`}
    >
      <body className="min-h-full" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <RouteShell>{children}</RouteShell>
      </body>
    </html>
  );
}

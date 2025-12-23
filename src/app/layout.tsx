
import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: '--font-geist-sans', // Keep CSS var name for consistency
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-geist-mono', // Keep CSS var name
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Example weights
});


export const metadata: Metadata = {
  title: 'Tempo Flow',
  description: 'Advanced metronome with tempo sections, subdivisions, and gesture controls for musicians.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tempo Flow',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#008080',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Hydration errors related to extensions modifying the DOM (like Grammarly)
  // are common. suppressHydrationWarning on <html> and <body> helps mitigate
  // React's warnings, though extensions might still alter attributes.
  // The app should still function correctly.
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body 
        className={`${inter.variable} ${robotoMono.variable} antialiased overflow-hidden h-full`}
        suppressHydrationWarning // Also good to have here for body-specific extension mods
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

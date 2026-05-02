import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nook — Loyalty Platform",
  description: "Digital loyalty card platform for modern businesses",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nook",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <head>
        {/* Viewport: cover ensures content fills iPhone notch / Dynamic Island */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1D9E75" />
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* PWA / iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nook" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full antialiased">
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        {children}
        <InstallPrompt />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')});}`,
          }}
        />
      </body>
    </html>
  );
}

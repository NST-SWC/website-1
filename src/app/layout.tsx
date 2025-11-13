import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CODE 4O4 · Build, Learn, Grow",
  description:
    "An immersive developer experience powered by Firebase, collaborative projects, live events, and a gamified member portal.",
  metadataBase: new URL("https://code404.preview"),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192x192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icon-512x512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CODE 4O4",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "CODE 4O4",
    title: "CODE 4O4 · Build, Learn, Grow",
    description:
      "Build, Learn, and Grow with CODE 4O4",
    images: [{ url: "/icon-512x512.svg", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "CODE 4O4",
    description:
      "Build, Learn, and Grow with CODE 4O4",
    images: ["/icon-512x512.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#06b6d4" },
    { media: "(prefers-color-scheme: dark)", color: "#06b6d4" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CODE 4O4" />
        {/* Make manifest & icons explicit to help installability checks */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        <meta name="theme-color" content="#06b6d4" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

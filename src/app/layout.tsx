import type { Metadata } from "next";
import "./globals.css";
import { MemoryProvider } from "@/lib/memory-context";

export const metadata: Metadata = {
  title: "Dayprint — Your life, in prints",
  description: "Personal Memory Workspace & Living Interactive Life Archive",
  metadataBase: new URL("http://localhost:3000"),
  icons: {
    icon: [
      { url: "/icon.svg?v=3", type: "image/svg+xml" },
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/icon-192.png?v=3", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png?v=3", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=3",
  },
  openGraph: {
    title: "Dayprint — Your life, in prints",
    description: "Personal Memory Workspace & Living Interactive Life Archive",
    siteName: "Dayprint",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dayprint — Living Memory Workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dayprint — Your life, in prints",
    description: "Personal Memory Workspace & Living Interactive Life Archive",
    images: ["/og-image.png"],
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
        <link rel="icon" href="/icon.svg?v=3" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico?v=3" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />
      </head>
      <body className="min-h-screen bg-[#F7F2E8] antialiased">
        <MemoryProvider>{children}</MemoryProvider>
      </body>
    </html>
  );
}

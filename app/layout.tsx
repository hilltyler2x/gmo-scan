import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthProvider";

export const metadata: Metadata = {
  title: "GMO Scan — Know What You Eat",
  description:
    "Scan any barcode to check if a product is bioengineered, track your purchases, and build healthier habits.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "GMO Scan", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the notch and home bar; globals.css pads content clear of them.
  viewportFit: "cover",
  themeColor: "#EFEBE1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink font-body min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

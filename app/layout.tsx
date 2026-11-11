import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthProvider";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const DESCRIPTION =
  "Scan any barcode to check if a product is bioengineered (GMO), track your purchases, and build healthier habits.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "GMO Scan — Know What You Eat",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: "GMO Scan — Know What You Eat", description: DESCRIPTION, url: "/", siteName: SITE_NAME, type: "website" },
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

// Tells search engines and AI assistants what GMO Scan is, on every page.
const APP_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  description:
    "Checks whether a packaged food is bioengineered (GMO) from its barcode or ingredient list, using USDA bioengineered disclosures, USDA Organic and Non-GMO Project Verified claims, and the USDA List of Bioengineered Foods.",
  applicationCategory: "HealthApplication",
  operatingSystem: "Any (web browser), iOS, Android",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink font-body min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_JSON_LD) }} />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

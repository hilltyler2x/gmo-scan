import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthProvider";

export const metadata: Metadata = {
  title: "GMO Scan — Know What You Eat",
  description:
    "Scan any barcode to check if a product is bioengineered, track your purchases, and build healthier habits.",
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

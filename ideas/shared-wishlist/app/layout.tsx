import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shared Wishlist",
  description:
    "Share a wishlist with friends and family, claim items to avoid duplicate gifts, and keep the surprise from the owner.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}

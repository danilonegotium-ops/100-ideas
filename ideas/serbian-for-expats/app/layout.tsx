import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Serbian for Expats",
  description:
    "Interactive beginner Serbian lessons for expats in Belgrade and Novi Sad, with saved progress.",
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

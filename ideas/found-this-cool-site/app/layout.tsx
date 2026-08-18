import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Found This Cool Site",
  description:
    "A StumbleUpon-style clone — click a button, land on a cool, useful, or weird real website.",
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

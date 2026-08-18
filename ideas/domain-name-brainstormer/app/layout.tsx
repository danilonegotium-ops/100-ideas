import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Domain Name Brainstormer",
  description:
    "Describe your project in a few keywords — get creative .com/.rs domain name ideas plus a best-effort DNS availability check.",
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

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple Uptime Monitor",
  description: "Emails you the second your website goes down.",
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

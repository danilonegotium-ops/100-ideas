import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Dream Interpreter",
  description:
    "Describe your dream and get a fun, entertainment-only AI interpretation.",
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

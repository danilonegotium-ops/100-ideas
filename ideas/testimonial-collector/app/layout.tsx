import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Testimonial Collector",
  description: "Collect video and text testimonials via a shareable link and embed them anywhere.",
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

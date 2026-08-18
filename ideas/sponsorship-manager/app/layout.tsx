import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sponsorship Manager",
  description: "A CRM for YouTubers and podcasters to manage brand deals and outreach.",
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

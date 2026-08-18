import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pet Playdate Finder",
  description:
    "A \"Tinder\" style app for dogs — find park buddies in your area.",
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

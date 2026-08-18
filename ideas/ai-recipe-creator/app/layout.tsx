import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Recipe Creator",
  description:
    "Type in a few ingredients you have and get a full AI-generated recipe.",
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

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Song Lyric Writer",
  description:
    "Pick a genre and describe a mood or theme — get original verse/chorus song lyrics in that style.",
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

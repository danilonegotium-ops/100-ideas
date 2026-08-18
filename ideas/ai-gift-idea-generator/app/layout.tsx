import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Gift Idea Generator",
  description:
    "Enter a friend's interests and budget, get 5 unique AI-suggested gift ideas.",
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

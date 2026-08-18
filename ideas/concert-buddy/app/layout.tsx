import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concert Buddy",
  description: "Find someone to go to a gig or festival with.",
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

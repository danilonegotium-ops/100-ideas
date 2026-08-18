import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Time Capsule",
  description: "Write a letter to your future self, delivered by email in 5, 10, or any custom number of years.",
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

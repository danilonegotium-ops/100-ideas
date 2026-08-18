import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Riddle Challenge",
  description: "Everyone gets the same riddle every day — race the clock and the world.",
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

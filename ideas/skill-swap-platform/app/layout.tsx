import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skill Swap Platform",
  description: "List what you can teach and what you want to learn, then propose a swap.",
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

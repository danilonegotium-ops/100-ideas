import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cold Outreach Personalizer",
  description:
    "Paste a prospect's bio or profile summary — get a non-generic, specific opening line for a cold outreach email.",
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

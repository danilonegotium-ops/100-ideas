import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Snippet Vault",
  description:
    "A private place to save, tag, and search the code snippets you reuse most.",
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

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zakazi Termin",
  description: "Zakazivanje termina za frizerske i beauty salone, sa email potvrdama.",
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

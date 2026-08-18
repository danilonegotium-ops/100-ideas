import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digitalni Upravnik",
  description:
    "Fond za održavanje, glasanje stanara i digitalna oglasna tabla za stambene zgrade.",
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

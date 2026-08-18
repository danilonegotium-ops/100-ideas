import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vrtić Management Tool",
  description:
    "Evidencija prisustva, dnevni jelovnik i bezbedno deljenje fotografija sa roditeljima.",
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

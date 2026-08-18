import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Automated Invoice Chaser",
  description: "Track invoices, flag overdue ones automatically, and send payment reminders.",
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

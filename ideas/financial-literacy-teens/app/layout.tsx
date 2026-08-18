import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Literacy for Teens",
  description: "Six short lessons on saving, budgeting, investing, credit, and taxes, with quizzes, points, and badges.",
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

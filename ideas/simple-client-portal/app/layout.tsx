import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple Client Portal",
  description:
    "Freelancers share files and project updates with clients — no Jira required.",
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

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Employee Onboarding Checklist",
  description: "HR sends a welcome flow and task list to new hires — no password required.",
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

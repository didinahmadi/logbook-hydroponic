import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Hidro Logbook — Manajemen Hidroponik",
  description: "Kelola batch tanam hidroponik Anda dengan mudah",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={geist.variable}>
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}

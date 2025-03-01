import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LafeAINet-Analyzer",
  description: "AI-powered network quality analyzer for Timor-Leste",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <header className="bg-blue-600 text-white py-4 px-6 shadow-md">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-xl font-semibold">LafeAINet-Analyzer</h1>
            <p className="text-sm text-blue-100">
              Network quality analysis service
            </p>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-6">{children}</main>
        <footer className="border-t bg-white py-4 px-6 text-center text-sm text-gray-500">
          <div className="max-w-6xl mx-auto">
            <p>
              © 2025 LafeAINet - AI-powered connectivity monitoring for
              Timor-Leste
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

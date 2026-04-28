import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
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
  title: "Mystique Haiven",
  description: "Best AI Gallery",
  keywords: ["AI", "Images", "Gallery"],
  verification: {
    google: 'SM2ugtAtEz2ecd3lFxnK4ThFnyHuhhjdTF6Es9cVy_0',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
        <body className="min-h-full flex flex-col">
          <AuthProvider>
            {children}
          </AuthProvider>
        </body>
    </html>
  );
}

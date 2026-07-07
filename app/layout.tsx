import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Script from "next/script"; 
import { Analytics } from "@vercel/analytics/next";
import BottomStickyAd from "@/components/ads/BottomStickyAd";
import Popunder from "@/components/ads/PopunderAd"





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
	keywords: ["AI", "Images", "Gallery", "Porn", "Adult", "Nudes", "Hentai", "Sex", "Free", "Free Porn", "Naked Woman", "Free Sex" ],
	referrer: "no-referrer-when-downgrade",
	  openGraph: {
    images: ['/images/logo.png'], // relative to /public, or full URL
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/logo.png'],
  },
	verification: {
		google: "SM2ugtAtEz2ecd3lFxnK4ThFnyHuhhjdTF6Es9cVy_0",
	},
	other: {
		"google-adsense-account": "ca-pub-2557117316592852",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				<AuthProvider>
					<Navbar />
					{children}
				<BottomStickyAd />
				<Popunder />
				</AuthProvider>
				<Analytics/>
			</body>
		</html>
	);
}
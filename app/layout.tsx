import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Script from "next/script"; // 👈 add this

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
	keywords: ["AI", "Images", "Gallery", "Porn", "Adult", "Nudes", "Hentai", "Sex"],
	referrer: "no-referrer-when-downgrade",
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
				</AuthProvider>

				{/* ✅ PUT SCRIPT HERE (after app render) */}
				<Script id="hilltopads" strategy="afterInteractive">
					{`
						(function(xubz){
							var d = document,
								s = d.createElement('script'),
								l = d.scripts[d.scripts.length - 1];

							s.settings = xubz || {};
							s.src = "//miserly-wrap.com/bTX.VyszdxGdlJ0yYSW/cQ/BeQmr9puwZTURlMkkPZT-crxeOeT/EdytOcTRcqtcNMztE/5aMeTHM_wvMcQk";
							s.async = true;
							s.referrerPolicy = 'no-referrer-when-downgrade';

							l.parentNode.insertBefore(s, l);
						})({})
					`}
				</Script>
			</body>
		</html>
	);
}
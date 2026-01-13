import type { Metadata } from "next";
import { Inter, GFS_Didot, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const didot = GFS_Didot({
  weight: "400",
  subsets: ["greek"],
  variable: "--font-didot",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Konex - Marketplace Micro-Influence B2B",
  description: "Passez à l'échelle avec les nano-influenceurs B2B.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={plusJakarta.variable}>
      <body
        className={`${inter.variable} ${didot.variable} ${plusJakarta.variable} antialiased bg-[#020408] text-slate-300 font-sans selection:bg-blue-500/30 selection:text-blue-200`}
      >
        <div className="bg-noise"></div>
        {children}
      </body>
    </html>
  );
}

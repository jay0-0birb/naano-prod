import type { Metadata } from "next";
import { Inter, GFS_Didot, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
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

// Satoshi is loaded via CSS @import in globals.css

export const metadata: Metadata = {
  title: "naano",
  description: "Passez à l'échelle avec les nano-influenceurs B2B.",
  // Favicon is set via app/favicon.ico (file convention). No icons here so Next/Vercel don't override.
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={plusJakarta.variable}>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap"
          rel="stylesheet"
        />
        {/* Served by route handlers with no-cache so Safari never uses cached triangle */}
        <link rel="apple-touch-icon" href="/apple-touch-icon" />
        <link rel="icon" href="/favicon" type="image/x-icon" sizes="any" />
      </head>
      <body
        className={`${inter.variable} ${didot.variable} ${plusJakarta.variable} antialiased bg-[#020408] text-slate-300 font-sans selection:bg-blue-500/30 selection:text-blue-200`}
        style={
          { "--font-satoshi": "Satoshi, sans-serif" } as React.CSSProperties
        }
      >
        <div className="bg-noise"></div>
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

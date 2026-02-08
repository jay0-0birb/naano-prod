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
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/logo.svg?v=4", type: "image/svg+xml" }],
    apple: { url: "/logo.svg?v=4" },
  },
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
        {/* favicon.ico = naano logo so Safari/Vercel show it instead of default triangle */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.svg?v=4" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg?v=4" />
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

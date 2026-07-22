import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion";
import { I18nProvider } from "@/lib/i18n/provider";
import { getLocale } from "@/lib/i18n/server";
import { site } from "@/core/site";
import "./globals.css";

// Outfit is the Vidcica brand face (mobile uses @expo-google-fonts/outfit).
// A distinctive geometric sans — satisfies the quality bar's "not Inter/system".
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.name,
    description: site.description,
    url: site.url,
    locale: site.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
  },
  robots: { index: true, follow: true },
  // Google Search Console ownership proof (required for the OAuth app / YouTube
  // scope verification). Emits <meta name="google-site-verification" …>.
  verification: { google: "j47WpSBEqnX5rs3T3knaupZDrQoeKR-xvitw4UF8-w0" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
  };

  // Resolve the theme before first paint (stored choice → system preference) so
  // the designed dark tokens apply with no flash. Runs synchronously in <head>.
  const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${outfit.variable} ${geistMono.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          // JSON-LD is static, app-controlled data — safe to inline.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <I18nProvider locale={locale}>
          <MotionProvider>{children}</MotionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

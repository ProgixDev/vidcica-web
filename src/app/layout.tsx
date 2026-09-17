import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion";
import { I18nProvider, LocaleTransition } from "@/lib/i18n/provider";
import { AnalyticsProvider } from "@/lib/analytics/provider";
import { ConsentBanner } from "@/components/consent-banner";
import { getLocale, getPathname, getUrlLocale } from "@/lib/i18n/server";
import { isBilingualDocumentPath, localizedPath } from "@/lib/i18n/routing";
import { site, isIndexableDeploy } from "@/core/site";
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

export async function generateMetadata(): Promise<Metadata> {
  // Canonical/hreflang describe the URL, so they follow the URL locale — not the
  // cookie a signed-in reader may carry.
  const locale = await getUrlLocale();
  const path = await getPathname();
  // Each language is its own URL, each declaring itself canonical and pointing
  // at the other through hreflang. x-default is French: it is the root, and the
  // URL every third party (Google, Meta, TikTok, Play) already holds.
  // The legal pages print both languages on one page, so they get a single
  // canonical URL and no hreflang pair — see isBilingualDocumentPath.
  const alternates = isBilingualDocumentPath(path)
    ? { canonical: localizedPath(path, "fr") }
    : {
        canonical: localizedPath(path, locale),
        languages: {
          fr: localizedPath(path, "fr"),
          en: localizedPath(path, "en"),
          "x-default": localizedPath(path, "fr"),
        },
      };
  return {
    metadataBase: new URL(site.url),
    applicationName: site.name,
    title: {
      default: site.name,
      template: `%s · ${site.name}`,
    },
    description: site.description,
    alternates,
    openGraph: {
      type: "website",
      siteName: site.name,
      title: site.name,
      description: site.description,
      url: localizedPath(path, locale),
      locale: locale === "en" ? "en_US" : site.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: site.name,
      description: site.description,
    },
    // Preview/branch deploys must never be indexed — only the production deploy is.
    robots: isIndexableDeploy ? { index: true, follow: true } : { index: false, follow: false },
    // Google Search Console ownership proof (required for the OAuth app / YouTube
    // scope verification). Emits <meta name="google-site-verification" …>.
    verification: { google: "j47WpSBEqnX5rs3T3knaupZDrQoeKR-xvitw4UF8-w0" },
  };
}

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
          <AnalyticsProvider>
            <MotionProvider>
              <LocaleTransition>{children}</LocaleTransition>
            </MotionProvider>
            {/* Inside I18nProvider: the banner is translated. Renders nothing
                until analytics is configured and unanswered. */}
            <ConsentBanner />
          </AnalyticsProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

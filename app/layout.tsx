import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/language-provider";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  isLocale,
  type Locale,
} from "@/lib/i18n/dictionary";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site-config";
import {
  getSoftwareApplicationJsonLd,
  serializeJsonLd,
} from "@/lib/seo/json-ld";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Fluxis Labs", url: "https://github.com/Marko-Vuchko" }],
  creator: "Fluxis Labs",
  publisher: "Fluxis Labs",
  keywords: [
    "Aura Workspace",
    "Monte Carlo",
    "SaaS simulator",
    "WebGL",
    "FastAPI",
    "Fluxis Labs",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "theme-color": "#05070D",
  },
};

// CSP nonce from proxy.ts is per-request; static shells cannot carry it.
export const dynamic = "force-dynamic";

async function readRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE_KEY)?.value;
  if (raw && isLocale(raw)) {
    return raw;
  }
  return DEFAULT_LOCALE;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await readRequestLocale();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang={locale}
      nonce={nonce}
      className={cn(
        "dark h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
      )}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col"
        nonce={nonce}
        suppressHydrationWarning
      >
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        <script
          id="aura-software-application-jsonld"
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(getSoftwareApplicationJsonLd()),
          }}
        />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AboutPageContent } from "@/features/about/about-page";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  isLocale,
  translate,
} from "@/lib/i18n/dictionary";
import { SITE_NAME, SITE_URL } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE_KEY)?.value;
  const locale = raw && isLocale(raw) ? raw : DEFAULT_LOCALE;

  return {
    title: {
      absolute: translate(locale, "about.metaTitle", { name: SITE_NAME }),
    },
    description: translate(locale, "about.metaDescription"),
    alternates: {
      canonical: `${SITE_URL}/about`,
    },
    openGraph: {
      locale: locale === "sr" ? "sr_RS" : "en_US",
      title: translate(locale, "about.metaTitle", { name: SITE_NAME }),
      description: translate(locale, "about.metaDescription"),
      url: `${SITE_URL}/about`,
    },
  };
}

export default function AboutPage() {
  return <AboutPageContent />;
}

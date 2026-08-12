import {
  GITHUB_PROFILE_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site-config";

/** Schema.org SoftwareApplication payload for the document head. */
export function getSoftwareApplicationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    author: {
      "@type": "Organization",
      name: "Fluxis Labs",
      url: GITHUB_PROFILE_URL,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/** JSON-LD text safe to embed in a script tag under CSP. */
export function serializeJsonLd(payload: Record<string, unknown>): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

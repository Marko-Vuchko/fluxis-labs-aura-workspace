import type { Metadata } from "next";

import { AboutPageContent } from "@/features/about/about-page";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: {
    absolute: `About - ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
};

export default function AboutPage() {
  return <AboutPageContent />;
}

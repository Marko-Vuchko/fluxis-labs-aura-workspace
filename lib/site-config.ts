/**
 * Public site URLs and portfolio copy anchors.
 * Change Fluxis Labs URL in one place - an empty string hides that link everywhere.
 */

/** Agency site. Leave empty until the URL is known (no dead links). */
export const FLUXIS_LABS_URL = "";

export const GITHUB_PROFILE_URL = "https://github.com/Marko-Vuchko";

export const GITHUB_REPO_URL =
  "https://github.com/Marko-Vuchko/fluxis-labs-aura-workspace";

export const SITE_NAME = "Aura Workspace";

export const SITE_TAGLINE = "Spatial Business Simulator";

export const SITE_TITLE = `${SITE_NAME} - ${SITE_TAGLINE}`;

export const SITE_DESCRIPTION =
  "A spatial 3D command center that runs live Monte Carlo SaaS scenarios through a Python engine. Built by Fluxis Labs.";

/**
 * Canonical origin for metadata. Override with NEXT_PUBLIC_SITE_URL in production.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://fluxis-labs-aura-workspace.vercel.app"
).replace(/\/$/, "");

/** Returns a usable Fluxis Labs URL, or null when the placeholder is still empty. */
export function getFluxisLabsUrl(): string | null {
  const url = FLUXIS_LABS_URL.trim();
  return url.length > 0 ? url : null;
}

// The public address of the website. Search engines and AI assistants are
// told about pages at this address (sitemap, robots.txt, canonical links), so
// set NEXT_PUBLIC_SITE_URL in Vercel when GMO Scan moves to its own domain.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://gmo-scan-ke9v.vercel.app").replace(
  /\/$/,
  "",
);

export const SITE_NAME = "GMO Scan";

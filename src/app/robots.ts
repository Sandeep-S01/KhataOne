import type { MetadataRoute } from "next";

import { getPublicAppUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getPublicAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/onboarding/"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}

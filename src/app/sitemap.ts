import type { MetadataRoute } from "next";

import { getPublicAppUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = getPublicAppUrl();
  const lastModified = new Date("2026-09-08");

  return [
    {
      url: appUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${appUrl}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${appUrl}/signup`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${appUrl}/forgot-password`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${appUrl}/reset-password`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${appUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${appUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${appUrl}/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}

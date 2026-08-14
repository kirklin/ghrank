import type { MetadataRoute } from "next";
import { countries, languages, languageSlug, usersMeta } from "~/lib/data";

export const dynamic = "force-static";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ghrank.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const meta = usersMeta();
  const lastModified = meta?.generatedAt ? new Date(meta.generatedAt) : new Date();

  const top: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/repos/`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/countries/`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/languages/`, lastModified, changeFrequency: "weekly", priority: 0.7 },
  ];

  const regions: MetadataRoute.Sitemap = countries().map(c => ({
    url: `${SITE}/c/${c.code.toLowerCase()}/`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const langs: MetadataRoute.Sitemap = languages().map(l => ({
    url: `${SITE}/lang/${languageSlug(l.name)}/`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...top, ...regions, ...langs];
}

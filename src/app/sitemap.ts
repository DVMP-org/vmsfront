import type { MetadataRoute } from "next";
import {
  featureSlugs,
  platformSlugs,
  solutionSlugs,
} from "@/components/marketing/content";
import { marketingSiteUrl } from "@/components/marketing/seo";
import { guides } from "@/components/marketing/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = marketingSiteUrl;
  const pages = [
    "",
    "/product",
    "/features",
    "/use-cases",
    "/pricing",
    "/resources",
    "/contact",
    ...guides.map(({ slug }) => `/resources/guides/${slug}`),
    ...solutionSlugs.map((slug) => `/solutions/${slug}`),
    ...featureSlugs.map((slug) => `/features/${slug}`),
    ...platformSlugs.map((slug) => `/platform/${slug}`),
  ];
  return pages.map((path) => ({
    url: new URL(path ? `${path}/` : "/", base).toString(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority:
      path === "" ? 1 : path === "/product" || path === "/pricing" ? 0.8 : 0.65,
  }));
}

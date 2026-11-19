import type { MetadataRoute } from "next";
import { marketingSiteUrl } from "@/components/marketing/seo";

export default function robots(): MetadataRoute.Robots {
  const base = marketingSiteUrl;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/organization/",
          "/organizations/",
          "/workspace/",
          "/resident/",
          "/profile/",
          "/setup/",
          "/auth/",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", base).toString(),
    host: new URL(base).host,
  };
}

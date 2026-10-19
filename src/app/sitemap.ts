import type { MetadataRoute } from "next";
import { getSiteSeo } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteSeo();
  // 페이지 개수를 추측하거나 메타데이터만을 위해 DB를 조회하지 않는다.
  return site.indexable ? [{ url: site.origin }] : [];
}

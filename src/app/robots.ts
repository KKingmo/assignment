import type { MetadataRoute } from "next";
import { getSiteSeo } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteSeo();
  return {
    // 검색·Preview 페이지의 noindex를 읽을 수 있도록 크롤링은 허용한다.
    rules: { userAgent: "*", allow: "/" },
    ...(site.indexable ? { sitemap: new URL("/sitemap.xml", site.origin).href } : {}),
  };
}

"use client";

import { useEffect } from "react";
import type { SiteSeo } from "@/lib/seo/site";
import type { CatalogParams } from "./catalog-params";
import { getCatalogSeo } from "./catalog-seo";

export function useCatalogMetadata(params: CatalogParams, site: SiteSeo) {
  const { title, description, canonical, robots } = getCatalogSeo(params, site);

  useEffect(() => {
    // Native History 이동은 서버 메타데이터를 다시 요청하지 않으므로 같은 규칙으로 동기화한다.
    document.title = title;
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical);
    const tags = {
      'meta[name="description"]': description,
      'meta[name="robots"]': robots,
      'meta[property="og:title"]': title,
      'meta[property="og:description"]': description,
      'meta[property="og:url"]': canonical,
      'meta[name="twitter:title"]': title,
      'meta[name="twitter:description"]': description,
    };
    for (const [selector, content] of Object.entries(tags)) {
      document.querySelector(selector)?.setAttribute("content", content);
    }
  }, [title, description, canonical, robots]);
}

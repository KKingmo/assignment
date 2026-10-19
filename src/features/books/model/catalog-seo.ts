import type { Metadata } from "next";
import type { SiteSeo } from "@/lib/seo/site";
import { serializeCatalogParams, type CatalogParams } from "./catalog-params";

export function getCatalogSeo(params: CatalogParams, site: SiteSeo) {
  const kind = params.kind === "pass" ? "패스" : params.kind === "single" ? "단품" : "교재";
  const pageSuffix = params.page > 1 ? ` · ${params.page}페이지` : "";
  const title = params.query
    ? `${params.query} 검색 결과${pageSuffix} | Hidden Kice`
    : `Hidden Kice | ${kind} 스토어${pageSuffix}`;
  const description = params.query
    ? `Hidden Kice ${kind}에서 '${params.query}' 검색 결과를 확인하세요.${pageSuffix}`
    : `Hidden Kice ${kind} 스토어에서 실전 대비 교재와 시즌 패스를 확인하세요.${pageSuffix}`;
  const query = serializeCatalogParams(params);
  // Next.js의 루트 canonical과 동일하게 쿼리가 없으면 origin으로 정규화한다.
  const canonical = query ? new URL(`/?${query}`, site.origin).href : site.origin;
  const indexable = site.indexable && !params.query && params.kind === "all";
  return { title, description, canonical, robots: `${indexable ? "index" : "noindex"}, follow` };
}

export function getCatalogMetadata(params: CatalogParams, site: SiteSeo): Metadata {
  const seo = getCatalogSeo(params, site);
  const image = { url: new URL("/images/banners/banner.webp", site.origin).href, width: 2146, height: 733, alt: "Hidden Kice 실전 대비 교재 시리즈" };
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical },
    robots: seo.robots,
    openGraph: { title: seo.title, description: seo.description, url: seo.canonical, siteName: "Hidden Kice", locale: "ko_KR", type: "website", images: [image] },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description, images: [image] },
  };
}

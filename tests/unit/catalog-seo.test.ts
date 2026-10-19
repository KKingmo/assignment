import { afterEach, describe, expect, it, vi } from "vitest";
import { getCatalogMetadata, getCatalogSeo } from "@/features/books/model/catalog-seo";
import { parseCatalogParams } from "@/features/books/model/catalog-params";
import { resolveSiteSeo } from "@/lib/seo/site";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const site = { origin: "https://store.example.test", indexable: true };
const seo = (search = "") => getCatalogSeo(parseCatalogParams(new URLSearchParams(search)), site);

afterEach(() => vi.unstubAllEnvs());

describe("교재 URL의 메타데이터", () => {
  it("첫 페이지와 두 번째 페이지는 제목과 자기 canonical을 구분한다", () => {
    expect(seo().canonical).toBe(site.origin);
    expect(seo("page=2")).toMatchObject({ title: "Hidden Kice | 교재 스토어 · 2페이지", canonical: `${site.origin}/?page=2`, robots: "index, follow" });
  });

  it("기본값·잘못된 값·추적 조건은 canonical에서 제외한다", () => {
    expect(seo("page=-1&kind=unknown&q=++&utm_source=test").canonical).toBe(site.origin);
    expect(seo("page=1&kind=all").canonical).toBe(site.origin);
  });

  it("검색·분류는 정규화한 자기 URL을 유지하되 색인을 제외한다", () => {
    const result = seo("q=++기하++&kind=pass&page=2&q=다른값");
    expect(new URL(result.canonical).searchParams.get("q")).toBe("기하");
    expect(new URL(result.canonical).searchParams.get("kind")).toBe("pass");
    expect(result.robots).toBe("noindex, follow");
    expect(seo("kind=single").robots).toBe("noindex, follow");
    expect(result.title).toBe("기하 검색 결과 · 2페이지 | Hidden Kice");
  });

  it("공유 미리보기의 이미지와 페이지 URL은 같은 절대 주소를 사용한다", () => {
    const metadata = getCatalogMetadata(parseCatalogParams(new URLSearchParams("page=2")), site);
    expect(metadata.openGraph).toMatchObject({ url: `${site.origin}/?page=2`, locale: "ko_KR", images: [{ url: `${site.origin}/images/banners/banner.webp`, width: 2146, height: 733 }] });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });
});

describe("배포 환경의 색인 정책", () => {
  it.each([
    ["https://store.example.test", "production", "production", true],
    ["https://store.example.test", "preview", "production", false],
    ["https://store.example.test", "development", "development", false],
    ["http://localhost:3000", "production", "production", false],
    ["http://127.0.0.1:3100", undefined, "production", false],
    [undefined, undefined, "production", false],
  ])("%s / %s / %s에서 indexable=%s", (siteUrl, vercelEnv, nodeEnv, indexable) => {
    const environment = resolveSiteSeo({ siteUrl, vercelEnv, nodeEnv });
    expect(environment.indexable).toBe(indexable);
    expect(getCatalogSeo(parseCatalogParams(new URLSearchParams()), environment).robots).toBe(`${indexable ? "index" : "noindex"}, follow`);
  });

  it("기준 주소의 경로·쿼리·hash를 제거한다", () => {
    expect(resolveSiteSeo({ siteUrl: "https://store.example.test/path?q=1#catalog" }).origin).toBe(site.origin);
    expect(() => resolveSiteSeo({ siteUrl: "javascript:alert(1)" })).toThrow();
  });

  it("공개 배포는 실제 루트 경로만 sitemap에 포함한다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", site.origin);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(sitemap()).toEqual([{ url: site.origin }]);
    expect(robots()).toEqual({ rules: { userAgent: "*", allow: "/" }, sitemap: `${site.origin}/sitemap.xml` });
  });

  it("Preview는 sitemap을 비우고 noindex를 읽는 크롤링은 허용한다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", site.origin);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(sitemap()).toEqual([]);
    expect(robots()).toEqual({ rules: { userAgent: "*", allow: "/" } });
  });
});

import { test, expect, catalogRoute, fulfillCatalogRequest } from "../support/catalog-fixture";

const origin = process.env.PLAYWRIGHT_BASE_URL
  ? new URL(process.env.PLAYWRIGHT_BASE_URL).origin
  : "https://store.example.test";

test("JavaScript 실행 전에도 페이지별 제목·canonical·공유 미리보기를 제공한다", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    for (const [path, title, canonical, robots] of [
      ["/", "Hidden Kice | 교재 스토어", origin, "index, follow"],
      ["/?page=2", "Hidden Kice | 교재 스토어 · 2페이지", `${origin}/?page=2`, "index, follow"],
      ["/?q=++기하++&kind=pass&page=1&utm_source=test", "기하 검색 결과 | Hidden Kice", `${origin}/?q=%EA%B8%B0%ED%95%98&kind=pass`, "noindex, follow"],
    ]) {
      const response = await page.goto(path);
      expect(response?.ok()).toBe(true);
      await expect(page).toHaveTitle(title);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute("href", canonical);
      await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", robots);
      await expect(page.locator('head meta[property="og:url"]')).toHaveAttribute("content", canonical);
      await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute("content", title);
      await expect(page.locator('head meta[property="og:image"]')).toHaveAttribute("content", `${origin}/images/banners/banner.webp`);
      await expect(page.locator('head meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
      await expect(page.getByRole("article")).toHaveCount(0);
    }
  } finally {
    await context.close();
  }
});

test("CSR 탐색·뒤로 가기·페이지 보정에서도 메타데이터를 URL과 맞춘다", async ({ page }) => {
  await page.goto("/");
  const canonical = page.locator('link[rel="canonical"]');
  const robots = page.locator('meta[name="robots"]');
  await page.getByRole("link", { name: "2페이지", exact: true }).click();
  await expect(page).toHaveTitle("Hidden Kice | 교재 스토어 · 2페이지");
  await expect(canonical).toHaveAttribute("href", `${origin}/?page=2`);
  await page.getByRole("button", { name: "패스", exact: true }).click();
  await expect(robots).toHaveAttribute("content", "noindex, follow");
  await expect(canonical).toHaveAttribute("href", `${origin}/?kind=pass`);
  await page.getByRole("textbox", { name: "교재 검색" }).fill("기하");
  await page.getByRole("textbox", { name: "교재 검색" }).press("Enter");
  await expect(page).toHaveTitle("기하 검색 결과 | Hidden Kice");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "기하 검색 결과 | Hidden Kice");
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveTitle("Hidden Kice | 교재 스토어 · 2페이지");
  await expect(robots).toHaveAttribute("content", "index, follow");
  await page.goto("/?page=99");
  await expect(page).toHaveURL(/page=2$/);
  await expect(canonical).toHaveAttribute("href", `${origin}/?page=2`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${origin}/?page=2`);
});

test("페이지 링크는 실제 href와 새 탭 탐색을 지원한다", async ({ page, context }) => {
  await page.goto("/?q=시즌");
  const next = page.getByRole("link", { name: "2페이지", exact: true });
  await expect(next).toHaveAttribute("href", "/?q=%EC%8B%9C%EC%A6%8C&page=2");
  await context.route(catalogRoute, fulfillCatalogRequest);
  const popupPromise = context.waitForEvent("page");
  await next.click({ modifiers: ["ControlOrMeta"] });
  const popup = await popupPromise;
  try {
    await popup.waitForLoadState("domcontentloaded");
    await expect(popup.getByRole("article")).toHaveCount(6);
    expect(new URL(popup.url()).searchParams.get("page")).toBe("2");
    expect(new URL(popup.url()).searchParams.get("q")).toBe("시즌");
    expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  } finally {
    await popup.close();
  }
});

test("robots는 크롤링을 허용하고 sitemap은 공개 루트 주소만 포함한다", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Allow: /");
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
  expect(await robots.text()).not.toContain("Disallow");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  expect(xml).toContain(`<loc>${origin}</loc>`);
  expect(xml.match(/<loc>/g)).toHaveLength(1);
});

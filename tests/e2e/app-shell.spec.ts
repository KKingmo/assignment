import { expect, test } from "../support/catalog-fixture";

test("한국어 문서와 로컬 Pretendard 폰트를 표시한다", async ({ page }) => {
  const fontResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith(".woff2"),
  );

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("Hidden Kice | 교재 스토어");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(
    page.getByRole("heading", { name: "교재 스토어", level: 1 }),
  ).toBeVisible();

  const loadedFont = await fontResponse;
  expect(loadedFont.ok()).toBe(true);
  expect(new URL(loadedFont.url()).origin).toBe(new URL(page.url()).origin);

  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const font = await page.locator("body").evaluate((body) => ({
    family: getComputedStyle(body).fontFamily,
    loaded: Array.from(document.fonts).some(
      (face) => /pretendard/i.test(face.family) && face.status === "loaded",
    ),
  }));

  expect(font.family).toMatch(/pretendard/i);
  expect(font.loaded).toBe(true);
});

test("교재 이미지와 아이콘을 공개 경로에서 제공한다", async ({ request }) => {
  const assets = [
    ["/images/banners/banner.webp", "image/webp"],
    ["/icons/crosshair.svg", "image/svg+xml"],
    ["/icons/chart-bar.svg", "image/svg+xml"],
    ["/icons/trophy.svg", "image/svg+xml"],
    ["/icons/arrow-right.svg", "image/svg+xml"],
    ["/icons/play.svg", "image/svg+xml"],
    ["/icons/pause.svg", "image/svg+xml"],
    ["/images/books/hidden-kice-book-single.webp", "image/webp"],
    ["/images/books/hidden-kice-book-pass.webp", "image/webp"],
    ["/icons/shopping-cart.svg", "image/svg+xml"],
    ["/icons/caret-left.svg", "image/svg+xml"],
    ["/icons/caret-right.svg", "image/svg+xml"],
    ["/icons/search.svg", "image/svg+xml"],
    ["/icons/bell.svg", "image/svg+xml"],
    ["/icons/user.svg", "image/svg+xml"],
    ["/icons/close.svg", "image/svg+xml"],
  ] as const;

  for (const [path, contentType] of assets) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    expect(response.headers()["content-type"], path).toContain(contentType);
    expect((await response.body()).byteLength, path).toBeGreaterThan(0);
  }
});

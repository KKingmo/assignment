import { expect, test, mockBooks } from "../support/catalog-fixture";

test("1440px에서 시안의 4열 배치와 카드 크기를 유지한다", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(12);
  const grid = page.getByRole("list", { name: "교재 목록", exact: true });
  const gridBox = await grid.boundingBox();
  expect(gridBox?.x).toBe(80);
  expect(gridBox?.width).toBe(1280);
  expect(Math.round(gridBox!.height)).toBe(1365);

  const first = await cards.nth(0).boundingBox();
  const fourth = await cards.nth(3).boundingBox();
  const fifth = await cards.nth(4).boundingBox();
  expect(first?.width).toBe(250);
  expect(first?.y).toBe(719);
  expect(fourth?.y).toBe(first?.y);
  expect(Math.round(fifth!.y - first!.y)).toBe(467);

  const cover = await cards.first().getByRole("img").boundingBox();
  // The 1px border surrounds the 248 × 318 image content box.
  expect(cover?.width).toBe(248);
  expect(cover?.height).toBe(318);
  await expect(page.getByRole("banner")).toHaveCSS("height", "100px");
  await expect(page.getByRole("region", { name: "히든카이스", exact: true })).toHaveCSS("height", "491px");
  await expect(page.getByRole("contentinfo")).toBeVisible();
  expect(errors).toEqual([]);

  await page.screenshot({ path: testInfo.outputPath("store-desktop.png"), fullPage: true });
});

test("메뉴 hover와 키보드 focus, 카드 담기 버튼 표시를 제공한다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: "주 메뉴" });
  await expect(menu.getByRole("button", { name: "스토어", exact: true })).toHaveAttribute("aria-current", "page");
  const challenge = menu.getByRole("button", { name: "챌린지", exact: true });
  await challenge.hover();
  await expect(challenge).toHaveCSS("color", "rgb(127, 119, 221)");

  const card = page.getByRole("article").first();
  const add = card.getByRole("button", { name: /장바구니에 담기/ });
  await expect(add).toHaveCSS("opacity", "0");
  await card.hover();
  await expect(add).toHaveCSS("opacity", "1");
  await page.mouse.move(0, 0);
  await expect(add).toHaveCSS("opacity", "0");
  await add.focus();
  await expect(add).toHaveCSS("opacity", "1");
  await expect(add).toHaveCSS("outline-style", "solid");
  await expect(add).toHaveCSS("outline-width", "2px");
  await expect(add).toBeEnabled();
});

for (const width of [360, 390, 768]) {
  test(`${width}px 터치 화면에서 넘침 없이 상품과 담기 버튼을 표시한다`, async ({ browser, baseURL }, testInfo) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width, height: 844 },
      deviceScaleFactor: 1,
      hasTouch: true,
      isMobile: true,
    });
    try {
      const page = await context.newPage();
      await mockBooks(page);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const cards = page.getByRole("article");
      await expect(cards).toHaveCount(12);
      const expectedColumns = width < 768 ? 2 : 3;
      const first = await cards.nth(0).boundingBox();
      const lastInRow = await cards.nth(expectedColumns - 1).boundingBox();
      const nextRow = await cards.nth(expectedColumns).boundingBox();
      expect(lastInRow?.y).toBe(first?.y);
      expect(nextRow!.y).toBeGreaterThan(first!.y);
      const add = cards.first().getByRole("button", { name: /장바구니에 담기/ });
      await expect(add).toHaveCSS("opacity", "1");
      expect((await add.boundingBox())?.width).toBe(44);
      expect((await add.boundingBox())?.height).toBe(44);
      await expect(page.getByRole("textbox", { name: "교재 검색" })).toBeVisible();
      await expect(page.getByRole("button", { name: "히든카이스 소개", exact: true })).toBeInViewport();
      const banner = page.getByRole("region", { name: "히든카이스", exact: true });
      for (const title of ["실전 적중", "난이도별 구성", "검증된 결과"]) await expect(banner.getByText(title, { exact: true })).toBeVisible();
      const nextBanner = banner.getByRole("button", { name: "다음 배너", exact: true });
      expect((await nextBanner.boundingBox())?.width).toBe(44);
      expect((await nextBanner.boundingBox())?.height).toBe(44);
      await nextBanner.tap();
      await expect(banner.locator("[aria-live]")).toContainText("2 / 5");
      await page.screenshot({ path: testInfo.outputPath(`store-${width}.png`), fullPage: true });
    } finally {
      await context.close();
    }
  });
}

test("단품과 패스의 이미지·분류·할인 가격을 표시한다", async ({ page }) => {
  await page.goto("/");
  const single = page.getByRole("article", { name: "2027 Hidden Kice 시즌5", exact: true });
  await expect(single.getByRole("img")).toHaveAttribute("src", /hidden-kice-book-single/);
  await expect(single.getByText("단품", { exact: true })).toBeVisible();
  await expect(single.getByText("판매가 28,000원", { exact: true })).toBeVisible();
  await expect(single.locator("del")).toHaveCount(0);

  const pass = page.getByRole("article", { name: "시즌4~9 패스(기하패스!!!)", exact: true });
  await expect(pass.getByRole("img")).toHaveAttribute("src", /hidden-kice-book-pass/);
  await expect(pass.getByText("패스", { exact: true })).toBeVisible();
  await expect(pass.locator("del")).toHaveText("정가 180,000원");
  await expect(pass.getByText("7% 할인", { exact: true })).toBeVisible();
  await expect(pass.getByText("판매가 167,400원", { exact: true })).toBeVisible();
});

test("배너 CTA와 바로가기 링크로 교재 영역에 접근한다", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "교재 목록으로 바로가기" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "교재 스토어", exact: true })).toBeFocused();
  await page.getByRole("link", { name: "히든카이스 시리즈 보기" }).click();
  await expect(page).toHaveURL(/#catalog$/);
});

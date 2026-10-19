import type { Page } from "@playwright/test";
import { expect, test } from "../support/catalog-fixture";

const banner = (page: Page) => page.getByRole("region", { name: "히든카이스", exact: true });
const activeSlide = (page: Page) => banner(page).locator('[aria-roledescription="슬라이드"][aria-hidden="false"]');
const counter = (page: Page) => banner(page).locator('[aria-live]');

async function openWithClock(page: Page) {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(12);
  // React·Query의 초기 스케줄링이 끝난 뒤 시간을 멈추고 재생 간격을 새로 시작한다.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 10));
  await banner(page).hover();
  await page.mouse.move(0, 0);
}

test("첨부 배너와 SVG, Pretendard와 할인율 색상을 적용한다", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(activeSlide(page).locator("img")).toHaveAttribute("src", /banners%2Fbanner.webp/);
  expect(await activeSlide(page).locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(banner(page).getByRole("heading")).toHaveCSS("font-size", "64px");
  await expect(banner(page).getByRole("heading")).toHaveCSS("font-weight", "700");
  await expect(activeSlide(page).getByText("모두가 푸는 건 이유가 있습니다")).toHaveCSS("font-size", "48px");
  for (const [label, icon] of [["실전 적중", "crosshair"], ["난이도별 구성", "chart-bar"], ["검증된 결과", "trophy"]]) {
    await expect(activeSlide(page).getByText(label, { exact: true })).toHaveCSS("color", "rgb(250, 98, 47)");
    await expect(activeSlide(page).locator(`span[style*="${icon}.svg"]`)).toHaveCSS("background-color", "rgb(250, 98, 47)");
  }
  await expect(banner(page).getByRole("link")).toHaveCSS("border-color", "rgb(250, 98, 47)");
  const next = banner(page).getByRole("button", { name: "다음 배너", exact: true });
  await next.hover();
  await expect(next).toHaveCSS("color", "rgb(250, 98, 47)");
  await page.mouse.move(0, 0);
  await page.screenshot({ path: testInfo.outputPath("banner-desktop.png") });
});

test("5초마다 5개 번호를 자동 순환하고 자동 변경은 반복 낭독하지 않는다", async ({ page }) => {
  await openWithClock(page);
  await expect(counter(page)).toContainText("1 / 5");
  await expect(counter(page)).toHaveAttribute("aria-live", "off");
  await page.clock.runFor(4_999);
  await expect(counter(page)).toContainText("1 / 5");
  for (const index of [2, 3, 4, 5, 1]) {
    if (index !== 2) {
      // 전환 종료의 React 렌더를 확정한 뒤 다음 자동 재생 시점까지 진행한다.
      await page.clock.runFor(750);
      await expect(banner(page).locator("[inert]")).toHaveCount(4);
    }
    await page.clock.runFor(index === 2 ? 1 : 4_250);
    await expect(counter(page)).toContainText(`${index} / 5`);
  }
});

test("hover·키보드 포커스 중 멈추고 수동 이동은 양끝을 순환한다", async ({ page }) => {
  await openWithClock(page);
  await banner(page).hover();
  await page.clock.runFor(10_000);
  await expect(counter(page)).toContainText("1 / 5");
  await page.mouse.move(0, 0);
  await page.clock.runFor(5_000);
  await expect(counter(page)).toContainText("2 / 5");
  const previous = page.getByRole("button", { name: "이전 배너", exact: true });
  await previous.focus();
  await expect(counter(page)).toHaveAttribute("aria-live", "polite");
  await page.clock.runFor(10_000);
  await expect(counter(page)).toContainText("2 / 5");
  await previous.press("Enter");
  await expect(counter(page)).toContainText("1 / 5");
  await page.clock.runFor(750);
  await previous.press("Enter");
  await expect(counter(page)).toContainText("5 / 5");
  await page.clock.runFor(750);
  await page.getByRole("button", { name: "다음 배너", exact: true }).press("Enter");
  await expect(counter(page)).toContainText("1 / 5");
  await page.clock.runFor(750);
  await expect(banner(page).locator("[inert]")).toHaveCount(4);
  await page.getByRole("textbox", { name: "교재 검색" }).focus();
  // 포커스로 화면이 스크롤된 후 포인터도 배너 밖으로 옮긴다.
  await page.getByRole("textbox", { name: "교재 검색" }).hover();
  await expect(counter(page)).toHaveAttribute("aria-live", "off");
  await page.clock.runFor(5_000);
  await expect(counter(page)).toContainText("2 / 5");
});

test("명시적 정지는 포커스를 옮겨도 유지되며 재개할 수 있다", async ({ page }) => {
  await openWithClock(page);
  await page.getByRole("button", { name: "배너 자동 재생 정지" }).click();
  await page.getByRole("textbox", { name: "교재 검색" }).focus();
  await page.mouse.move(0, 0);
  await page.clock.runFor(10_000);
  await expect(counter(page)).toContainText("1 / 5");
  await page.getByRole("button", { name: "배너 자동 재생 시작" }).click();
  await page.getByRole("textbox", { name: "교재 검색" }).focus();
  await page.getByRole("textbox", { name: "교재 검색" }).hover();
  await expect(counter(page)).toHaveAttribute("aria-live", "off");
  await page.clock.runFor(5_000);
  await expect(counter(page)).toContainText("2 / 5");
});

test("동작 줄이기에서는 정지 상태로 시작하고 사용자가 수동 이동·재생한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openWithClock(page);
  await expect(page.getByRole("button", { name: "배너 자동 재생 시작" })).toBeVisible();
  await page.clock.runFor(10_000);
  await expect(counter(page)).toContainText("1 / 5");
  await page.getByRole("button", { name: "다음 배너", exact: true }).click();
  await expect(counter(page)).toContainText("2 / 5");
  await expect(banner(page).locator("[inert]")).toHaveCount(4);
  expect(await banner(page).evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  await page.getByRole("button", { name: "배너 자동 재생 시작" }).click();
  await page.getByRole("textbox", { name: "교재 검색" }).focus();
  await page.getByRole("textbox", { name: "교재 검색" }).hover();
  await expect(counter(page)).toHaveAttribute("aria-live", "off");
  await page.clock.runFor(5_000);
  await expect(counter(page)).toContainText("3 / 5");
});

test("다음·이전·양끝 순환 시 해당 방향으로 이동하며 조작부 포커스를 유지한다", async ({ page }) => {
  await openWithClock(page);
  const controls = banner(page).getByRole("group", { name: "배너 조작" });
  const controlBox = await controls.boundingBox();
  for (const [button, index, direction] of [
    ["다음 배너", 2, 1], ["이전 배너", 1, -1], ["이전 배너", 5, -1], ["다음 배너", 1, 1],
  ] as const) {
    await controls.getByRole("button", { name: button, exact: true }).click();
    await expect(counter(page)).toContainText(`${index} / 5`);
    await page.clock.runFor(80);
    const active = activeSlide(page);
    expect((await active.boundingBox())!.x * direction).toBeGreaterThan(0);
    await expect(banner(page).locator("[inert]")).toHaveCount(4);
    await expect(banner(page).getByRole("link", { name: "히든카이스 시리즈 보기" })).toHaveCount(1);
    expect(await controls.boundingBox()).toEqual(controlBox);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
    await page.clock.runFor(1_500);
    expect(Math.abs((await active.boundingBox())!.x)).toBeLessThan(1);
    await expect(controls.getByRole("button", { name: button, exact: true })).toBeFocused();
  }
});

test("전환이 끝나기 전의 연속 버튼 클릭도 즉시 선택 번호에 반영한다", async ({ page }) => {
  await openWithClock(page);
  const next = banner(page).getByRole("button", { name: "다음 배너", exact: true });
  await next.click();
  await expect(counter(page)).toContainText("2 / 5");
  await next.click();
  await expect(counter(page)).toContainText("3 / 5");
  await banner(page).getByRole("button", { name: "이전 배너", exact: true }).click();
  await expect(counter(page)).toContainText("2 / 5");
  await page.clock.runFor(1_500);
  expect(Math.abs((await activeSlide(page).boundingBox())!.x)).toBeLessThan(1);
});

for (const width of [500, 905, 1200, 2841]) {
  test(`${width}px에서 배경이 배너 끝까지 이어지고 문구·조작부 여백을 유지한다`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const region = banner(page);
    const bounds = (await region.boundingBox())!;
    const copy = await region.getByRole("heading").evaluate((heading) => {
      const { x, y, width, height } = heading.parentElement!.getBoundingClientRect();
      return { x, y, width, height };
    });
    const artwork = await activeSlide(page).locator("img").evaluate((img: HTMLImageElement) => {
      const { x, y, width, height } = img.parentElement!.getBoundingClientRect();
      return { x, y, width, height };
    });
    const controls = (await region.getByRole("group", { name: "배너 조작" }).boundingBox())!;
    expect(copy.y - bounds.y).toBeGreaterThanOrEqual(40);
    expect(artwork.width).toBe(Math.min(width, 1760));
    if (width < 768) {
      expect(artwork.y - (copy.y + copy.height)).toBeGreaterThanOrEqual(32);
      expect(artwork.x).toBe(0);
      expect(controls.y).toBeGreaterThanOrEqual(artwork.y + artwork.height);
    } else {
      expect(artwork.x).toBeLessThanOrEqual(copy.x);
      expect(artwork.y + artwork.height).toBeCloseTo(bounds.y + bounds.height, 0);
    }
    expect(bounds.y + bounds.height - (controls.y + controls.height)).toBeGreaterThanOrEqual(32);
    const rightInset = width < 768 ? 20 : Math.max(32, (width - 1760) / 2 + 32);
    expect(width - (controls.x + controls.width)).toBeCloseTo(rightInset, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await expect(activeSlide(page).locator("img")).toBeVisible();
    await expect.poll(() => activeSlide(page).locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await region.screenshot({ path: testInfo.outputPath(`carousel-v2-${width}.png`) });
  });
}

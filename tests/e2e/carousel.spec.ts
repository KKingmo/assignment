import type { Page } from "@playwright/test";
import { expect, test } from "../support/catalog-fixture";

const banner = (page: Page) => page.getByRole("region", { name: "히든카이스", exact: true });
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
  await expect(banner(page).locator("img")).toHaveAttribute("src", /banners%2Fbanner.webp/);
  expect(await banner(page).locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(banner(page).getByRole("heading")).toHaveCSS("font-size", "72px");
  await expect(banner(page).getByRole("heading")).toHaveCSS("font-weight", "700");
  await expect(banner(page).getByText("모두가 푸는 건 이유가 있습니다")).toHaveCSS("font-size", "52px");
  for (const [label, icon] of [["실전 적중", "crosshair"], ["난이도별 구성", "chart-bar"], ["검증된 결과", "trophy"]]) {
    await expect(banner(page).getByText(label, { exact: true })).toHaveCSS("color", "rgb(250, 98, 47)");
    await expect(banner(page).locator(`span[style*="${icon}.svg"]`)).toHaveCSS("background-color", "rgb(250, 98, 47)");
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
    await page.clock.runFor(index === 2 ? 1 : 5_000);
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
  await previous.press("Enter");
  await expect(counter(page)).toContainText("5 / 5");
  await page.getByRole("button", { name: "다음 배너", exact: true }).press("Enter");
  await expect(counter(page)).toContainText("1 / 5");
  await page.getByRole("textbox", { name: "교재 검색" }).focus();
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
  await page.mouse.move(0, 0);
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
  await page.getByRole("button", { name: "배너 자동 재생 시작" }).click();
  await page.getByRole("textbox", { name: "교재 검색" }).focus();
  await page.mouse.move(0, 0);
  await page.clock.runFor(5_000);
  await expect(counter(page)).toContainText("3 / 5");
});

import type { CDPSession, Page } from "@playwright/test";
import { expect, test } from "../support/catalog-fixture";

const banner = (page: Page) => page.getByRole("region", { name: "히든카이스", exact: true });
const counter = (page: Page) => banner(page).locator("[aria-live]");
const activeSlide = (page: Page) => banner(page).locator('[aria-roledescription="슬라이드"][aria-hidden="false"]');

async function touchDrag(cdp: CDPSession, from: [number, number], to: [number, number], cancel = false) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from[0], y: from[1], id: 1 }] });
  for (let step = 1; step <= 8; step++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: from[0] + (to[0] - from[0]) * step / 8, y: from[1] + (to[1] - from[1]) * step / 8, id: 1 }],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: cancel ? "touchCancel" : "touchEnd", touchPoints: [] });
}

test("마우스 좌우 드래그로 순환하고 짧은 이동·세로 이동·링크 클릭을 구분한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const y = (await banner(page).boundingBox())!.y + 200;
  async function drag(dx: number, dy = 0) {
    await page.mouse.move(700, y);
    await page.mouse.down();
    await page.mouse.move(700 + dx, y + dy, { steps: 8 });
    await page.mouse.up();
  }
  await drag(-160);
  await expect(counter(page)).toContainText("2 / 5");
  await drag(160);
  await expect(counter(page)).toContainText("1 / 5");
  await drag(160);
  await expect(counter(page)).toContainText("5 / 5");
  await drag(20);
  await drag(-60, 120);
  await expect(counter(page)).toContainText("5 / 5");
  await banner(page).getByRole("link", { name: "히든카이스 시리즈 보기" }).click();
  await expect(page).toHaveURL(/#catalog$/);
  await expect(counter(page)).toContainText("5 / 5");
});

test("CTA 외 문구·아이콘·이미지·여백·조작부에서 손을 떼기 전부터 배너가 따라온다", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(12);
  const region = banner(page);
  const bounds = (await region.boundingBox())!;
  const sources = [
    activeSlide(page).getByRole("heading"),
    activeSlide(page).getByText("상위권이 선택한 문제집, 결과로 증명된 실전 대비서"),
    activeSlide(page).locator('span[style*="crosshair.svg"]'),
    { x: bounds.width * 0.8, y: bounds.y + 200 },
    { x: bounds.width / 4, y: bounds.y + bounds.height - 5 },
    counter(page),
    region.getByRole("button", { name: "다음 배너", exact: true }),
    region.getByRole("button", { name: "배너 자동 재생 시작" }),
  ];
  for (const source of sources) {
    const box = "boundingBox" in source ? (await source.boundingBox())! : null;
    const point = box ? { x: box.x + box.width / 2, y: box.y + box.height / 2 } : source as { x: number; y: number };
    const dx = point.x > bounds.width / 2 ? -800 : 800;
    const before = Number((await activeSlide(page).getAttribute("aria-label"))!.match(/(\d)번째/)![1]);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + dx, point.y, { steps: 8 });
    await expect.poll(async () => (await activeSlide(page).boundingBox())!.x * Math.sign(dx)).toBeGreaterThan(100);
    if (source === sources[0]) await region.screenshot({ path: testInfo.outputPath("carousel-dragging.png") });
    await page.mouse.up();
    const next = dx < 0 ? before % 5 + 1 : (before + 3) % 5 + 1;
    await expect(counter(page)).toContainText(`${next} / 5`);
    await expect.poll(async () => Math.abs((await activeSlide(page).boundingBox())!.x)).toBeLessThan(1);
    await expect(region.getByRole("button", { name: "배너 자동 재생 시작" })).toBeVisible();
  }
  const cta = region.getByRole("link", { name: "히든카이스 시리즈 보기" });
  const ctaBox = (await cta.boundingBox())!;
  await page.mouse.move(ctaBox.x + 30, ctaBox.y + 20);
  await page.mouse.down();
  await page.mouse.move(ctaBox.x + 400, ctaBox.y + 20, { steps: 8 });
  expect(Math.abs((await activeSlide(page).boundingBox())!.x)).toBeLessThan(1);
  await page.mouse.up();
  await cta.click();
  await expect(page).toHaveURL(/#catalog$/);
});

test("전환 애니메이션 도중에도 다시 잡아 반대 방향으로 즉시 움직일 수 있다", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(12);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 10));
  await banner(page).getByRole("button", { name: "다음 배너", exact: true }).click();
  await page.clock.runFor(80);
  await page.mouse.move(900, 350);
  await page.mouse.down();
  const before = (await activeSlide(page).boundingBox())!.x;
  await page.mouse.move(1100, 350, { steps: 8 });
  await page.clock.runFor(50);
  expect((await activeSlide(page).boundingBox())!.x - before).toBeGreaterThan(100);
  await page.mouse.up();
  await page.clock.runFor(1_500);
  expect(Math.abs((await activeSlide(page).boundingBox())!.x)).toBeLessThan(1);
});

test.describe("터치 스와이프", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("좌우 스와이프·양끝 순환·취소를 처리하며 세로 스크롤과 버튼 탭을 유지한다", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 310, y: 650, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 80, y: 650, id: 1 }] });
    await expect.poll(async () => (await activeSlide(page).boundingBox())!.x).toBeLessThan(-100);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(counter(page)).toContainText("2 / 5");
    await touchDrag(cdp, [80, 650], [310, 650]);
    await expect(counter(page)).toContainText("1 / 5");
    await touchDrag(cdp, [80, 650], [310, 650]);
    await expect(counter(page)).toContainText("5 / 5");
    await touchDrag(cdp, [310, 650], [290, 650]);
    await touchDrag(cdp, [310, 650], [80, 650], true);
    await expect(counter(page)).toContainText("5 / 5");
    await touchDrag(cdp, [200, 650], [205, 350]);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    await expect(counter(page)).toContainText("5 / 5");
    await banner(page).getByRole("button", { name: "다음 배너", exact: true }).tap();
    await expect(counter(page)).toContainText("1 / 5");
    await banner(page).getByRole("link", { name: "히든카이스 시리즈 보기" }).tap();
    await expect(page).toHaveURL(/#catalog$/);
    await expect(counter(page)).toContainText("1 / 5");
    await cdp.detach();
  });

  test("손가락을 누른 동안 자동 전환을 멈추고 취소 후 자동 재생을 재개한다", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(page.getByRole("article")).toHaveCount(12);
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 10));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 300, y: 650, id: 1 }] });
    await expect(counter(page)).toHaveAttribute("aria-live", "polite");
    await page.clock.runFor(6_000);
    await expect(counter(page)).toContainText("1 / 5");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
    await expect(counter(page)).toHaveAttribute("aria-live", "off");
    await page.clock.runFor(5_000);
    await expect(counter(page)).toContainText("2 / 5");
    await cdp.detach();
  });
});

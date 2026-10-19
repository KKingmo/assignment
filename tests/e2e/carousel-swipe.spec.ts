import type { CDPSession, Page } from "@playwright/test";
import { expect, test } from "../support/catalog-fixture";

const banner = (page: Page) => page.getByRole("region", { name: "히든카이스", exact: true });
const counter = (page: Page) => banner(page).locator("[aria-live]");

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

test.describe("터치 스와이프", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("좌우 스와이프·양끝 순환·취소를 처리하며 세로 스크롤과 버튼 탭을 유지한다", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const cdp = await page.context().newCDPSession(page);
    await touchDrag(cdp, [310, 650], [80, 650]);
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

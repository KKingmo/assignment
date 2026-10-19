import { test, expect, catalogRoute, fulfillBooks } from "../support/catalog-fixture";
import { bookRows } from "../fixtures/books";

test("초기 HTML에는 상품을 넣지 않고 브라우저 응답 후 표시한다", async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route(catalogRoute, async (route) => {
    await pending;
    await fulfillBooks(route);
  });
  const response = await page.goto("/");
  expect(await response!.text()).not.toContain(bookRows[0].title);
  const skeleton = page.getByRole("status", { name: "교재를 불러오는 중" });
  await expect(skeleton).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  const before = await skeleton.locator("li").first().boundingBox();
  release();
  await expect(page.getByRole("article")).toHaveCount(12);
  await expect(page.getByRole("status")).toHaveText("전체 18개");
  const after = await page.getByRole("article").first().boundingBox();
  expect(after?.y).toBe(before?.y);
  expect(after?.width).toBe(before?.width);
});

test("빈 응답은 오류와 구별해 표시한다", async ({ page }) => {
  await page.route(catalogRoute, (route) => fulfillBooks(route, [], 0));
  await page.goto("/");
  await expect(page.getByText("등록된 교재가 없습니다.")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("전체 0개");
  await expect(page.getByRole("region", { name: "교재 스토어", exact: true }).getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "교재 페이지" })).toHaveCount(0);
});

test("실패 시 자동 반복 요청 없이 사용자의 재시도로 복구한다", async ({ page }) => {
  let requests = 0;
  await page.route(catalogRoute, async (route) => {
    requests += 1;
    if (requests === 1) {
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Unavailable" }) });
    } else {
      await fulfillBooks(route);
    }
  });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "교재 스토어", exact: true }).getByRole("alert")).toContainText("교재를 불러오지 못했어요.");
  expect(requests).toBe(1);
  await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(12);
  await expect(page.getByRole("region", { name: "교재 스토어", exact: true }).getByRole("alert")).toHaveCount(0);
  expect(requests).toBe(2);
});

test("전체 개수 누락을 빈 결과로 표시하지 않는다", async ({ page }) => {
  await page.route(catalogRoute, (route) => route.fulfill({ json: bookRows }));
  await page.goto("/");
  await expect(page.getByRole("region", { name: "교재 스토어", exact: true }).getByRole("alert")).toBeVisible();
  await expect(page.getByText("전체 0개")).toHaveCount(0);
});

test("표지 로딩에 실패해도 카드 크기와 가격을 유지한다", async ({ page }) => {
  await page.route("**/_next/image?*", (route) => route.abort());
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const card = page.getByRole("article").first();
  const fallback = card.getByRole("img", { name: /표지 이미지 없음/ });
  await expect(fallback).toBeVisible();
  expect((await fallback.boundingBox())?.height).toBe(318);
  await expect(card.getByText("판매가 28,000원", { exact: true })).toBeVisible();
});

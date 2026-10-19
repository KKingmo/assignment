import { chromium, type Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, expect, catalogRoute, fulfillCatalogRequest, mockBooks } from "../support/catalog-fixture";
import { allBookRows, fixtureBooks } from "../fixtures/books";
import { CART_STORAGE_KEY } from "../../src/features/cart/model/cart";

const [single, pass] = fixtureBooks;
const cartTrigger = (page: Page) => page.getByRole("button", { name: /^장바구니(, 총 \d+개)?$/ });
const panel = (page: Page) => page.getByRole("dialog", { name: "장바구니", exact: true });
async function add(page: Page, title: string) {
  await page.getByRole("article", { name: title, exact: true }).getByRole("button", { name: /장바구니에 담기$/ }).click();
}

test("담기·재담기·수량·합계·삭제·비우기를 연결하고 최소 수량을 지킨다", async ({ page }) => {
  let cartRequests = 0;
  page.on("request", (request) => { if (request.url().includes("/rest/v1/books?") && new URL(request.url()).searchParams.has("id")) cartRequests += 1; });
  await page.goto("/");
  await cartTrigger(page).click();
  await expect(panel(page).getByText("장바구니가 비어 있어요")).toBeVisible();
  expect(cartRequests).toBe(0);
  await panel(page).getByRole("button", { name: "계속 쇼핑하기" }).click();
  await add(page, single.title);
  await expect(page.getByText("장바구니에 담았습니다", { exact: true })).toBeVisible();
  await add(page, single.title);
  await expect(page.getByText("수량이 추가되었습니다", { exact: true })).toBeVisible();
  await add(page, pass.title);
  await expect(cartTrigger(page)).toHaveAccessibleName("장바구니, 총 3개");
  await cartTrigger(page).click();
  const drawer = panel(page);
  const singleLine = drawer.getByRole("article", { name: single.title, exact: true });
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toHaveText("합계223,400원");
  await expect(singleLine.getByLabel("수량", { exact: true })).toHaveText("2");
  await expect(singleLine.getByLabel("상품 금액")).toHaveText("56,000원");
  await singleLine.getByRole("button", { name: /수량 줄이기$/ }).click();
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toHaveText("합계195,400원");
  await expect(singleLine.getByRole("button", { name: /수량 줄이기$/ })).toBeDisabled();
  await singleLine.getByRole("button", { name: /수량 늘리기$/ }).click();
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toHaveText("합계223,400원");
  expect(cartRequests).toBe(1);
  await drawer.getByRole("button", { name: `${pass.title} 삭제`, exact: true }).click();
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toHaveText("합계56,000원");
  await expect(drawer.getByRole("article")).toHaveCount(1);
  await drawer.getByRole("button", { name: "장바구니 비우기" }).click();
  await expect(drawer.getByText("장바구니가 비어 있어요")).toBeVisible();
  await drawer.getByRole("button", { name: "장바구니 닫기", exact: true }).click();
  await expect(cartTrigger(page)).toHaveAccessibleName("장바구니");
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), CART_STORAGE_KEY)).toEqual({ version: 1, items: [] });
});

test("패널의 키보드 포커스·Escape·배경 닫기와 검색 URL을 유지한다", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?q=2027&kind=single");
  await add(page, single.title);
  const before = page.url();
  await cartTrigger(page).click();
  const drawer = panel(page);
  const close = drawer.getByRole("button", { name: "장바구니 닫기", exact: true });
  await expect(close).toBeFocused();
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toContainText("28,000원");
  await page.keyboard.press("Shift+Tab");
  await expect(drawer.getByRole("button", { name: "계속 쇼핑하기" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.screenshot({ path: testInfo.outputPath("cart-desktop.png") });
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(cartTrigger(page)).toBeFocused();
  expect(page.url()).toBe(before);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await cartTrigger(page).click();
  await page.mouse.click(20, 200);
  await expect(drawer).toHaveCount(0);
  await expect(cartTrigger(page)).toBeFocused();
});

test("페이지 밖 상품도 조회하고 새로고침 후 ID·수량만으로 복원한다", async ({ page }) => {
  await page.goto("/?page=2");
  const last = allBookRows.at(-1)!;
  await add(page, last.title);
  await page.getByRole("button", { name: "이전 페이지" }).click();
  await add(page, single.title);
  await page.reload();
  await expect(cartTrigger(page)).toHaveAccessibleName("장바구니, 총 2개");
  await cartTrigger(page).click();
  await expect(panel(page).getByRole("article", { name: last.title, exact: true })).toBeVisible();
  await expect(panel(page).getByRole("group", { name: "장바구니 합계" })).toContainText("68,000원");
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), CART_STORAGE_KEY);
  expect(saved).toEqual({ version: 1, items: [{ bookId: last.id, quantity: 1 }, { bookId: single.id, quantity: 1 }] });
});

test("전용 브라우저 프로필을 닫고 다시 실행해도 장바구니가 복원된다", async ({ baseURL }) => {
  const profile = await mkdtemp(join(tmpdir(), "hidden-kice-cart-"));
  let context = await chromium.launchPersistentContext(profile, { baseURL, viewport: { width: 1440, height: 1000 } });
  try {
    let page = context.pages()[0];
    await mockBooks(page);
    await page.goto("/");
    await add(page, single.title);
    await add(page, single.title);
    await expect(cartTrigger(page)).toHaveAccessibleName("장바구니, 총 2개");
    await context.close();
    context = await chromium.launchPersistentContext(profile, { baseURL, viewport: { width: 1440, height: 1000 } });
    page = context.pages()[0];
    await mockBooks(page);
    await page.goto("/");
    await expect(cartTrigger(page)).toHaveAccessibleName("장바구니, 총 2개");
    await cartTrigger(page).click();
    await expect(panel(page).getByRole("group", { name: "장바구니 합계" })).toContainText("56,000원");
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test("패널을 열 때마다 현재 가격을 조회하고 실패 시 기존 금액을 확정 표시하지 않는다", async ({ page }) => {
  let price = 28000;
  let fail = false;
  let hold = false;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  let requests = 0;
  await page.route(catalogRoute, async (route) => {
    if (!new URL(route.request().url()).searchParams.has("id")) return fulfillCatalogRequest(route);
    requests += 1;
    if (hold) await pending;
    if (fail) return route.fulfill({ status: 503, json: { message: "Unavailable" } });
    return route.fulfill({ json: [{ ...allBookRows[0], sale_price: price }] });
  });
  await page.goto("/");
  await add(page, single.title);
  await cartTrigger(page).click();
  const drawer = panel(page);
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toContainText("28,000원");
  await drawer.getByRole("button", { name: "장바구니 닫기", exact: true }).click();
  price = 10000; hold = true;
  await cartTrigger(page).click();
  await expect(drawer.getByRole("status")).toHaveText("현재 상품 정보와 가격을 확인하고 있어요.");
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toHaveCount(0);
  release(); hold = false;
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toContainText("10,000원");
  await drawer.getByRole("button", { name: /수량 늘리기$/ }).click();
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toContainText("20,000원");
  expect(requests).toBe(2);
  await drawer.getByRole("button", { name: "장바구니 닫기", exact: true }).click();
  fail = true;
  await cartTrigger(page).click();
  await expect(drawer.getByRole("alert")).toContainText("상품 정보를 불러오지 못했어요.");
  expect(requests).toBe(3);
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toHaveCount(0);
  fail = false; price = 15000;
  await drawer.getByRole("button", { name: "상품 정보 다시 시도" }).click();
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toContainText("30,000원");
  expect(requests).toBe(4);
});

test("조회에서 누락된 교재는 소계에서 제외하고 직접 삭제할 수 있다", async ({ page }) => {
  await page.route(catalogRoute, async (route) => {
    if (new URL(route.request().url()).searchParams.has("id")) return route.fulfill({ json: [allBookRows[0]] });
    return fulfillCatalogRequest(route);
  });
  await page.goto("/");
  await add(page, single.title); await add(page, pass.title);
  await cartTrigger(page).click();
  const drawer = panel(page);
  await expect(drawer.getByRole("group", { name: "확인된 상품 소계" })).toContainText("28,000원");
  await expect(drawer.getByText("확인할 수 없는 교재 1종은 금액에 포함되지 않았습니다.")).toBeVisible();
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toHaveCount(0);
  const missing = drawer.getByRole("article", { name: "확인할 수 없는 교재 2", exact: true });
  await expect(missing.getByRole("button", { name: /수량 늘리기$/ })).toBeDisabled();
  await missing.getByRole("button", { name: /삭제$/ }).click();
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toContainText("28,000원");
  await expect(drawer.getByRole("article")).toHaveCount(1);
});

test("오프라인에서 다시 열면 이전 합계를 확정 표시하지 않고 연결 후 갱신한다", async ({ page, context }) => {
  await page.goto("/");
  await add(page, single.title);
  await cartTrigger(page).click();
  const drawer = panel(page);
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toContainText("28,000원");
  await drawer.getByRole("button", { name: "장바구니 닫기", exact: true }).click();
  await context.setOffline(true);
  try {
    await cartTrigger(page).click();
    await expect(drawer.getByRole("status")).toHaveText("네트워크 연결을 기다리고 있어요.");
    await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toHaveCount(0);
  } finally { await context.setOffline(false); }
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toContainText("28,000원");
});

test("손상된 저장 데이터는 정리하고 유효한 상품·수량 한도는 유지한다", async ({ page }) => {
  await page.addInitScript(({ key, id }) => localStorage.setItem(key, JSON.stringify({ version: 1, items: [
    { bookId: id, quantity: 98 }, { bookId: id, quantity: 1 }, { bookId: "invalid", quantity: 1 },
  ] })), { key: CART_STORAGE_KEY, id: single.id });
  await page.goto("/");
  await expect(cartTrigger(page)).toHaveAccessibleName("장바구니, 총 99개");
  await add(page, single.title);
  await expect(page.getByText("상품은 최대 99개까지 담을 수 있습니다.")).toBeVisible();
  await cartTrigger(page).click();
  const drawer = panel(page);
  await expect(drawer.getByRole("button", { name: /수량 늘리기$/ })).toBeDisabled();
  await expect(drawer.getByText("저장된 장바구니에서 복원할 수 없는 항목을 정리했습니다.")).toBeVisible();
  await drawer.getByRole("button", { name: /수량 줄이기$/ }).click();
  await expect(drawer.getByRole("button", { name: /수량 늘리기$/ })).toBeEnabled();
  await expect(drawer.getByLabel("수량", { exact: true })).toHaveText("98");
});

test("JSON 손상과 저장소 접근 실패가 화면 사용을 막지 않는다", async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, "broken");
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException("Quota exceeded", "QuotaExceededError");
      return original.call(this, name, value);
    };
  }, CART_STORAGE_KEY);
  await page.goto("/");
  await add(page, single.title);
  await expect(page.getByText("장바구니에 담았습니다 이 브라우저에 보관하지 못했습니다.", { exact: true })).toBeVisible();
  await cartTrigger(page).click();
  await expect(panel(page).getByRole("alert")).toContainText("브라우저에 장바구니를 보관하지 못했어요.");
  await expect(panel(page).getByRole("group", { name: "장바구니 합계" })).toContainText("28,000원");
  await panel(page).getByRole("button", { name: /수량 늘리기$/ }).click();
  await expect(panel(page).getByRole("group", { name: "장바구니 합계" })).toContainText("56,000원");
});

for (const width of [360, 390]) {
  test(`${width}px 장바구니에서 수량과 삭제 버튼을 터치할 수 있고 가로로 넘치지 않는다`, async ({ browser, baseURL }, testInfo) => {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    try {
      const page = await context.newPage();
      await mockBooks(page);
      await page.goto("/");
      await add(page, pass.title);
      await cartTrigger(page).click();
      const drawer = panel(page);
      await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toContainText("167,400원");
      await drawer.getByRole("button", { name: /수량 늘리기$/ }).tap();
      await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toContainText("334,800원");
      expect((await drawer.boundingBox())?.width).toBe(width);
      expect(await drawer.evaluate((element) => element.scrollWidth)).toBe(width);
      const increase = await drawer.getByRole("button", { name: /수량 늘리기$/ }).boundingBox();
      expect(increase?.width).toBe(44); expect(increase?.height).toBe(44);
      await page.screenshot({ path: testInfo.outputPath(`cart-${width}.png`) });
      await drawer.getByRole("button", { name: /삭제$/ }).tap();
      await expect(drawer.getByText("장바구니가 비어 있어요")).toBeVisible();
    } finally { await context.close(); }
  });
}

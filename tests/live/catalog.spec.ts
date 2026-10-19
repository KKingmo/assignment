import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { allBookRows, bookRows } from "../fixtures/books";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

test.beforeAll(() => {
  if (!url || !key) throw new Error("Live tests require Supabase public environment variables.");
});

test("실제 Supabase의 첫 12개와 총 18개를 CSR로 표시한다", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  const catalogResponse = page.waitForResponse((response) =>
    response.url().startsWith(`${url}/rest/v1/books?`) && response.request().method() === "GET",
  );
  const html = await page.goto("/");
  expect(await html!.text()).not.toContain(bookRows[0].title);
  const response = await catalogResponse;
  expect(response.status()).toBe(206);
  expect(response.headers()["content-range"]).toBe("0-11/18");
  expect(await response.json()).toEqual(bookRows);
  await expect(page.getByRole("article")).toHaveCount(12);
  await expect(page.getByRole("status")).toHaveText("전체 18개");
  for (const row of bookRows) {
    const card = page.getByRole("article", { name: row.title, exact: true });
    await expect(card).toBeVisible();
    await expect(card.getByRole("img")).toHaveAttribute("src", new RegExp(row.cover_path.split("/").at(-1)!));
    await expect(card.getByText(`판매가 ${(row.sale_price ?? row.list_price).toLocaleString("ko-KR")}원`, { exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("store-live.png"), fullPage: true });
});

test("공개 키로 18개 조회가 가능하고 추가·수정·삭제는 거부된다", async ({ request }) => {
  const headers = { apikey: key! };
  const endpoint = `${url}/rest/v1/books`;
  const response = await request.get(`${endpoint}?select=*&order=sort_order.asc,id.asc`, { headers });
  expect(response.status()).toBe(200);
  const rows = await response.json();
  expect(rows).toHaveLength(18);
  expect(rows.filter((row: { kind: string }) => row.kind === "single")).toHaveLength(12);
  expect(rows.filter((row: { kind: string }) => row.kind === "pass")).toHaveLength(6);
  expect(rows).toEqual(allBookRows);

  // 권한이 잘못 설정되어도 유효한 행을 만들거나 기존 데이터를 변경하지 않는다.
  const absentId = "00000000-0000-0000-0000-000000000000";
  expect(rows.some((row: { id: string }) => row.id === absentId)).toBe(false);
  const insert = await request.post(endpoint, { headers, data: { title: "Permission check" } });
  const update = await request.patch(`${endpoint}?id=eq.${absentId}`, { headers, data: { title: "Permission check" } });
  const remove = await request.delete(`${endpoint}?id=eq.${absentId}`, { headers });
  for (const denied of [insert, update, remove]) {
    expect([401, 403]).toContain(denied.status());
    expect(await denied.json()).toMatchObject({ code: "42501" });
  }
});

test("실제 DB에서 두 번째 페이지·분류·문자 부분 검색이 일치한다", async ({ page }) => {
  await page.goto("/?page=2");
  await expect(page.getByRole("article")).toHaveCount(6);
  for (const row of allBookRows.slice(12)) await expect(page.getByRole("article", { name: row.title, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "패스", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("전체 6개");
  await expect(page.getByRole("article").getByText("패스", { exact: true })).toHaveCount(6);
  const input = page.getByRole("textbox", { name: "교재 검색" });
  await input.fill("(미적분, 확통)");
  await input.press("Enter");
  await expect(page.getByRole("article")).toHaveCount(4);
  await page.getByRole("button", { name: "검색어 초기화", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("전체 6개");
  await page.getByRole("button", { name: "단품", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(12);
  await input.fill("hidden kice");
  await input.press("Enter");
  await expect(page.getByRole("status")).toHaveText("전체 12개");
  // SQL/정규식 특수문자가 전체 일치나 오류로 확장되지 않는다.
  for (const query of ["%", "_", "*", "\\", ".", "["]) {
    await input.fill(query);
    await input.press("Enter");
    await expect(page.getByRole("status")).toHaveText("전체 0개");
    await expect(page.getByText("검색 조건에 맞는 교재가 없습니다.")).toBeVisible();
    expect(new URL(page.url()).searchParams.get("q")).toBe(query);
  }
});

test("실제 416 응답을 정확한 개수로 복구해 마지막 페이지와 빈 결과를 구분한다", async ({ page }) => {
  const rangeError = page.waitForResponse((response) => response.url().includes("/rest/v1/books?") && response.status() === 416);
  await page.goto("/?page=99");
  expect((await rangeError).status()).toBe(416);
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(page.getByRole("article")).toHaveCount(6);
  await expect(page.getByRole("status")).toHaveText("전체 18개");
  await page.goto("/?q=없는교재&kind=pass&page=99");
  await expect(page.getByText("검색 조건에 맞는 교재가 없습니다.")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("전체 0개");
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  expect(new URL(page.url()).searchParams.get("kind")).toBe("pass");
});

test("실제 ID 조회로 목록 밖 교재의 장바구니 합계와 새로고침 복구를 확인한다", async ({ page }, testInfo) => {
  const last = allBookRows.at(-1)!;
  const pass = allBookRows[1];
  const cart = page.getByRole("button", { name: /^장바구니(, 총 \d+개)?$/ });
  await page.goto("/?page=2");
  const addLast = page.getByRole("article", { name: last.title, exact: true }).getByRole("button", { name: /장바구니에 담기$/ });
  await addLast.click(); await addLast.click();
  await page.getByRole("button", { name: "이전 페이지" }).click();
  await page.getByRole("article", { name: pass.title, exact: true }).getByRole("button", { name: /장바구니에 담기$/ }).click();
  const response = page.waitForResponse((result) => result.url().startsWith(`${url}/rest/v1/books?`) && new URL(result.url()).searchParams.has("id"));
  await cart.click();
  const data = await response;
  expect(data.status()).toBe(200);
  expect((await data.json()).map((row: { id: string }) => row.id).sort()).toEqual([last.id, pass.id].sort());
  const drawer = page.getByRole("dialog", { name: "장바구니", exact: true });
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toContainText("247,400원");
  await expect(drawer.getByRole("article", { name: last.title, exact: true }).getByLabel("수량", { exact: true })).toHaveText("2");
  await page.reload();
  await expect(cart).toHaveAccessibleName("장바구니, 총 3개");
  await cart.click();
  await expect(drawer.getByRole("group", { name: "장바구니 합계" })).toContainText("247,400원");
  await page.screenshot({ path: testInfo.outputPath("cart-live.png") });
});

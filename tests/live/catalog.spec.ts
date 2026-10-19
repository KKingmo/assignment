import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { bookRows } from "../fixtures/books";

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
  expect(rows.slice(0, 12)).toEqual(bookRows);

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

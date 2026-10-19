import type { Page } from "@playwright/test";
import { test, expect } from "../support/catalog-fixture";

async function openWithPausedClock(page: Page, path = "/") {
  await page.clock.install();
  await page.goto(path);
  await expect(page.getByRole("article").first()).toBeVisible();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1_000));
  return page.getByRole("textbox", { name: "교재 검색" });
}

function watchSearches(page: Page) {
  const queries: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/rest/v1/books" && request.method() === "GET") queries.push(url.searchParams.get("title") ?? "");
  });
  return queries;
}

async function expectResult(page: Page, text: string) {
  // 네트워크 응답 후 Query 알림 타이머도 진행해야 화면에 결과가 반영된다.
  await expect.poll(async () => {
    await page.clock.runFor(1);
    return page.getByRole("status").textContent();
  }).toBe(text);
}

test("입력을 멈춘 뒤 300ms에 마지막 검색어만 조회하고 필터를 유지하며 1페이지로 이동한다", async ({ page }) => {
  const input = await openWithPausedClock(page, "/?page=2");
  const queries = watchSearches(page);
  await input.fill("시");
  await page.clock.runFor(200);
  await input.fill("시즌");
  await page.clock.runFor(299);
  expect(queries).toEqual([]);
  expect(new URL(page.url()).searchParams.get("page")).toBe("2");
  await page.clock.runFor(1);
  await expect(page).toHaveURL(/\?q=%EC%8B%9C%EC%A6%8C$/);
  await expectResult(page, "전체 18개");
  await expect(page.getByRole("article")).toHaveCount(12);
  expect(queries).toEqual(["imatch.시즌"]);
  await page.getByRole("button", { name: "패스", exact: true }).click();
  await expectResult(page, "전체 6개");
  await input.fill("기하");
  await page.clock.runFor(300);
  await expectResult(page, "전체 2개");
  expect(new URL(page.url()).searchParams.get("kind")).toBe("pass");
});

for (const action of ["Enter", "검색 버튼"] as const) {
  test(`${action}: 대기 없이 검색하고 X는 예약된 검색까지 즉시 초기화한다`, async ({ page }) => {
    const input = await openWithPausedClock(page, "/?kind=pass");
    const queries = watchSearches(page);
    await input.fill("기하");
    if (action === "Enter") await input.press("Enter");
    else await page.getByRole("button", { name: "검색 실행", exact: true }).click();
    await expectResult(page, "전체 2개");
    await page.clock.runFor(1_000);
    expect(queries).toEqual(["imatch.기하"]);
    await input.fill("찾지 않을 검색어");
    await page.clock.runFor(100);
    await page.getByRole("button", { name: "검색어 초기화", exact: true }).click();
    await expectResult(page, "전체 6개");
    await page.clock.runFor(1_000);
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    expect(new URL(page.url()).search).toBe("?kind=pass");
    expect(queries).not.toContain("imatch.찾지 않을 검색어");
  });
}

test("한글 조합이 끝나지 않아도 포커스를 유지한 채 300ms 후 검색하고 이어서 입력할 수 있다", async ({ page }) => {
  const input = await openWithPausedClock(page);
  const queries = watchSearches(page);
  const ime = await page.context().newCDPSession(page);
  await input.focus();
  // 브라우저의 실제 조합 영역을 유지한다. compositionend나 blur를 보내지 않는다.
  await ime.send("Input.imeSetComposition", { text: "기", selectionStart: 1, selectionEnd: 1 });
  await page.clock.runFor(200);
  await ime.send("Input.imeSetComposition", { text: "기하", selectionStart: 2, selectionEnd: 2 });
  await page.clock.runFor(299);
  expect(queries).toEqual([]);
  await page.clock.runFor(1);
  await expectResult(page, "전체 2개");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("기하");
  expect(queries).toEqual(["imatch.기하"]);

  // 검색 후에도 조합 영역에 이어 입력할 수 있어야 한다.
  await ime.send("Input.imeSetComposition", { text: "시즌", selectionStart: 2, selectionEnd: 2 });
  await page.clock.runFor(300);
  await expectResult(page, "전체 18개");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("시즌");
  expect(queries).toEqual(["imatch.기하", "imatch.시즌"]);
  await ime.send("Input.insertText", { text: "시즌" });
  await page.clock.runFor(1_000);
  expect(queries).toHaveLength(2);
  await ime.detach();
});

test("자동 검색은 이력을 늘리지 않고 뒤로 가기 전에 예약한 검색을 취소한다", async ({ page }) => {
  const input = await openWithPausedClock(page, "/?q=시즌");
  await page.getByRole("button", { name: "패스", exact: true }).click();
  await expectResult(page, "전체 6개");
  const historyLength = await page.evaluate(() => history.length);
  await input.fill("기");
  await page.clock.runFor(300);
  await expectResult(page, "전체 2개");
  await input.fill("기하");
  await page.clock.runFor(300);
  await expect(page).toHaveURL(/q=%EA%B8%B0%ED%95%98&kind=pass$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await input.fill("취소할 검색");
  await page.goBack();
  await expect(input).toHaveValue("시즌");
  await page.clock.runFor(1_000);
  await expect(page).toHaveURL(/\?q=%EC%8B%9C%EC%A6%8C$/);
  await expect(page.getByRole("article")).toHaveCount(12);
  await page.goForward();
  await expect(input).toHaveValue("기하");
  await page.clock.resume();
  await page.reload();
  await expect(input).toHaveValue("기하");
  await expect(page.getByRole("status")).toHaveText("전체 2개");
});

test("대기 중 분류를 바꾸면 최신 입력도 반영하고 이전 검색을 다시 실행하지 않는다", async ({ page }) => {
  const input = await openWithPausedClock(page, "/?page=2");
  const queries = watchSearches(page);
  await input.fill("기하");
  await page.getByRole("button", { name: "패스", exact: true }).click();
  await expectResult(page, "전체 2개");
  await expect(input).toHaveValue("기하");
  await page.clock.runFor(1_000);
  expect(new URL(page.url()).searchParams.get("kind")).toBe("pass");
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  expect(queries).toEqual(["imatch.기하"]);
});

test("자동 검색은 입력 중 공백을 보존하고 직접 지운 빈 입력도 검색에 반영한다", async ({ page }) => {
  const input = await openWithPausedClock(page, "/?kind=single");
  await input.fill("hidden ");
  await page.clock.runFor(300);
  await expect(page).toHaveURL(/q=hidden&kind=single$/);
  await expect(input).toHaveValue("hidden ");
  await input.pressSequentially("kice");
  await page.clock.runFor(300);
  await expect(input).toHaveValue("hidden kice");
  await expect(page).toHaveURL(/q=hidden\+kice&kind=single$/);
  await input.fill("");
  await page.clock.runFor(300);
  await expect(page).toHaveURL(/\?kind=single$/);
  await expect(page.getByRole("article")).toHaveCount(12);
});

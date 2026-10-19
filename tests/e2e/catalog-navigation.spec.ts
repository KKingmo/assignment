import { test, expect, catalogRoute, fulfillCatalogRequest } from "../support/catalog-fixture";

test("결과 개수가 같은 검색을 연속 제출해도 다음 입력을 잃지 않는다", async ({ page }) => {
  await page.goto("/?kind=single");
  await expect(page.getByRole("status")).toHaveText("전체 12개");
  await page.getByRole("textbox", { name: "교재 검색" }).fill("hidden kice");
  // 같은 브라우저 이벤트 안에서 검색 직후 입력을 이어 지연된 URL 렌더링을 재현한다.
  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>("#book-search")!;
    const form = input.form!;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    form.requestSubmit();
    setValue.call(input, "%");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const input = page.getByRole("textbox", { name: "교재 검색" });
  await expect(page).toHaveURL(/q=hidden\+kice&kind=single$/);
  await expect(input).toHaveValue("%");
  await input.press("Enter");
  await expect(page.getByRole("status")).toHaveText("전체 0개");
  expect(new URL(page.url()).searchParams.get("q")).toBe("%");
});

test("전체 12+6개를 이동하고 검색·분류·X 초기화를 함께 적용한다", async ({ page }) => {
  const requests: URL[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/rest/v1/books?")) requests.push(new URL(request.url()));
  });
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(12);
  await expect(page.getByRole("link", { name: "이전 페이지" })).toBeDisabled();
  await page.getByRole("link", { name: "다음 페이지" }).click();
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(page.getByRole("article")).toHaveCount(6);
  await expect(page.getByRole("region", { name: "교재 스토어", exact: true })).toBeFocused();
  await expect(page.getByRole("textbox", { name: "교재 검색" })).toBeInViewport();
  await expect(page.getByRole("link", { name: "2페이지", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "다음 페이지" })).toBeDisabled();

  await page.getByRole("button", { name: "패스", exact: true }).click();
  await expect(page).toHaveURL(/\?kind=pass$/);
  await expect(page.getByRole("status")).toHaveText("전체 6개");
  expect(requests.filter((url) => url.searchParams.get("kind") === "eq.pass").every((url) => url.searchParams.get("offset") === "0")).toBe(true);
  await expect(page.getByRole("navigation", { name: "교재 페이지" })).toHaveCount(0);
  const input = page.getByRole("textbox", { name: "교재 검색" });
  await input.fill("  (미적분, 확통)  ");
  await expect(page).toHaveURL(/\?kind=pass$/);
  await expect(page.getByRole("article")).toHaveCount(6);
  await input.press("Enter");
  await expect(input).toHaveValue("(미적분, 확통)");
  await expect(page.getByRole("article")).toHaveCount(4);
  await expect(page.getByRole("status")).toHaveText("전체 4개");
  expect(new URL(page.url()).searchParams.get("q")).toBe("(미적분, 확통)");
  await page.getByRole("button", { name: "검색어 초기화", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(page).toHaveURL(/\?kind=pass$/);
  await expect(page.getByRole("article")).toHaveCount(6);
  await page.getByRole("button", { name: "단품", exact: true }).click();
  await expect(page).toHaveURL(/\?kind=single$/);
  await expect(page.getByRole("article")).toHaveCount(12);
  await expect(page.getByRole("status")).toHaveText("전체 12개");
});

test("검색 버튼·뒤로·앞으로·새로고침이 입력과 목록 조건을 복원한다", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "교재 검색" });
  await expect(input).toBeEnabled();
  await input.fill("기하");
  await page.getByRole("button", { name: "검색 실행", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(2);
  await page.getByRole("button", { name: "패스", exact: true }).click();
  await expect(page.getByRole("button", { name: "패스", exact: true })).toHaveAttribute("aria-pressed", "true");
  await input.fill("아직 적용하지 않은 검색어");
  await page.goBack();
  await expect(input).toHaveValue("기하");
  await expect(page.getByRole("button", { name: "전체", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.goBack();
  await expect(input).toHaveValue("");
  await expect(page.getByRole("article")).toHaveCount(12);
  await page.goForward();
  await expect(input).toHaveValue("기하");
  await page.goForward();
  await page.reload();
  await expect(input).toHaveValue("기하");
  await expect(page.getByRole("button", { name: "패스", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("article")).toHaveCount(2);
});

test("모바일에서 빈 검색 조건을 초기화하고 다시 탐색할 수 있다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?q=없는교재&kind=single");
  await expect(page.getByText("검색 조건에 맞는 교재가 없습니다.")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("전체 0개");
  await expect(page.getByRole("navigation", { name: "교재 페이지" })).toHaveCount(0);
  await page.getByRole("button", { name: "검색 조건 초기화", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("textbox", { name: "교재 검색" })).toHaveValue("");
  await expect(page.getByRole("article")).toHaveCount(12);
  await page.getByRole("link", { name: "다음 페이지" }).click();
  await expect(page.getByRole("article")).toHaveCount(6);
  await page.getByRole("link", { name: "이전 페이지" }).click();
  await expect(page.getByRole("article")).toHaveCount(12);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("잘못된 URL은 정규화하고 초과 페이지는 히스토리를 추가하지 않고 보정한다", async ({ page }) => {
  await page.goto("/?page=-1&kind=unknown&q=++");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("article")).toHaveCount(12);
  await page.getByRole("link", { name: "2페이지", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(6);
  await page.goto("/?kind=pass&page=99");
  await expect(page).toHaveURL(/\?kind=pass$/);
  await expect(page.getByRole("article")).toHaveCount(6);
  await page.goBack();
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(page.getByRole("link", { name: "2페이지", exact: true })).toHaveAttribute("aria-current", "page");
  await page.goto("/?page=99");
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(page.getByRole("article")).toHaveCount(6);
});

test("0건의 초과 페이지도 검색 조건을 유지하며 1페이지로 정리한다", async ({ page }) => {
  await page.goto("/?q=없는교재&kind=pass&page=99");
  await expect(page.getByText("검색 조건에 맞는 교재가 없습니다.")).toBeVisible();
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  expect(new URL(page.url()).searchParams.get("kind")).toBe("pass");
  await expect(page.getByRole("textbox", { name: "교재 검색" })).toHaveValue("없는교재");
});

test("분류를 빠르게 바꿔도 늦은 이전 응답이 현재 목록을 덮지 않는다", async ({ page }) => {
  let release!: () => void;
  let delivered!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const done = new Promise<void>((resolve) => { delivered = resolve; });
  await page.route(catalogRoute, async (route) => {
    if (new URL(route.request().url()).searchParams.get("kind") === "eq.pass") {
      await pending;
      await fulfillCatalogRequest(route);
      delivered();
    } else await fulfillCatalogRequest(route);
  });
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(12);
  const passRequest = page.waitForRequest((request) => request.url().includes("kind=eq.pass"));
  const aborted = page.waitForEvent("requestfailed", { predicate: (request) => request.url().includes("kind=eq.pass") });
  await page.getByRole("button", { name: "패스", exact: true }).click();
  await passRequest;
  await expect(page.getByRole("status", { name: "교재를 불러오는 중" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await page.getByRole("button", { name: "단품", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(12);
  release();
  await done;
  await aborted;
  await expect(page).toHaveURL(/\?kind=single$/);
  await expect(page.getByRole("status")).toHaveText("전체 12개");
  await expect(page.getByRole("article").getByText("단품", { exact: true })).toHaveCount(12);
});

test("검색 실패 후 같은 검색·분류로 재시도하며 이전 목록을 표시하지 않는다", async ({ page }) => {
  let attempts = 0;
  await page.route(catalogRoute, async (route) => {
    if (new URL(route.request().url()).searchParams.has("title") && ++attempts === 1) {
      await route.fulfill({ status: 503, json: { message: "Unavailable" } });
    } else await fulfillCatalogRequest(route);
  });
  await page.goto("/?kind=pass");
  await expect(page.getByRole("article")).toHaveCount(6);
  await page.getByRole("textbox", { name: "교재 검색" }).fill("기하");
  await page.getByRole("button", { name: "검색 실행", exact: true }).click();
  await expect(page.getByRole("region", { name: "교재 스토어", exact: true }).getByRole("alert")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  expect(attempts).toBe(1);
  await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(2);
  expect(attempts).toBe(2);
  expect(new URL(page.url()).searchParams.get("kind")).toBe("pass");
  expect(new URL(page.url()).searchParams.get("q")).toBe("기하");
});

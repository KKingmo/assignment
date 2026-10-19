import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Database } from "../../src/lib/supabase/database.types";
import { bookRows } from "../fixtures/books";

vi.mock("../../src/lib/supabase/browser", () => ({
  getBrowserSupabase: () => createClient<Database>("https://catalog.test", "public-test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { retry: false },
  }),
}));

import { DEFAULT_CATALOG_PARAMS } from "../../src/features/books/model/catalog-params";
import { getBooks, toBook } from "../../src/features/books/api/get-books";

afterEach(() => vi.unstubAllGlobals());

describe("교재 Data API 계약", () => {
  it("필요 컬럼·정확한 개수·안정된 정렬과 페이지 범위를 요청한다", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(bookRows), {
      headers: { "content-type": "application/json", "content-range": "12-17/18" },
    }));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    const result = await getBooks({ ...DEFAULT_CATALOG_PARAMS, page: 2 }, signal);
    const [url, init] = fetch.mock.calls[0];
    const params = new URL(url).searchParams;
    expect(params.get("select")).toBe("id,title,kind,cover_path,list_price,sale_price,sort_order");
    expect(params.get("order")).toBe("sort_order.asc,id.asc");
    expect(params.get("offset")).toBe("12");
    expect(params.get("limit")).toBe("12");
    expect(new Headers(init.headers).get("prefer")).toBe("count=exact");
    expect(init.signal).toBe(signal);
    expect(result.totalCount).toBe(18);
    expect(result.items[0]).toEqual({
      id: bookRows[0].id, title: bookRows[0].title, kind: "single",
      coverPath: bookRows[0].cover_path, listPrice: 28000, salePrice: null,
    });
  });

  it("할인가 0원을 null로 바꾸지 않는다", () => {
    expect(toBook({ ...bookRows[0], sale_price: 0 }).salePrice).toBe(0);
  });

  it("알 수 없는 분류를 단품으로 오인하지 않는다", () => {
    expect(() => toBook({ ...bookRows[0], kind: "unknown" })).toThrow();
  });

  it("조회 실패를 빈 목록으로 바꾸지 않는다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Denied", code: "42501" }), { status: 403 })));
    await expect(getBooks()).rejects.toMatchObject({ code: "42501" });
  });

  it("개수가 누락된 응답을 거부한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]")));
    await expect(getBooks()).rejects.toThrow("total count");
  });

  it("분류와 일반 문자 부분 검색을 요청하고 정규식 문법을 허용하지 않는다", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("[]", { headers: { "content-range": "*/0" } }));
    vi.stubGlobal("fetch", fetch);
    const query = "시즌 (미적분, 확통) %_*\\.^$[]{}+?|";
    await getBooks({ query, kind: "pass", page: 1 });
    const search = new URL(fetch.mock.calls[0][0]).searchParams;
    expect(search.get("kind")).toBe("eq.pass");
    expect(search.get("title")).toBe("imatch.시즌 \\(미적분, 확통\\) %_\\*\\\\\\.\\^\\$\\[\\]\\{\\}\\+\\?\\|");
    const literal = new RegExp(search.get("title")!.slice("imatch.".length), "i");
    expect(literal.test(`앞 ${query} 뒤`)).toBe(true);
    expect(literal.test("시즌 다른 교재")).toBe(false);
  });

  it.each([0, 6, 18])("범위 초과만 동일 필터의 HEAD 요청으로 %s개를 복원한다", async (total) => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "PGRST103", message: "Range not satisfiable" }), { status: 416 }))
      .mockResolvedValueOnce(new Response(null, { headers: { "content-range": `*/${total}` } }));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    await expect(getBooks({ query: "시즌", kind: "pass", page: 99 }, signal)).resolves.toEqual({ items: [], totalCount: total });
    expect(fetch).toHaveBeenCalledTimes(2);
    const [url, init] = fetch.mock.calls[1];
    const params = new URL(url).searchParams;
    expect(init.method).toBe("HEAD");
    expect(init.signal).toBe(signal);
    expect(params.get("kind")).toBe("eq.pass");
    expect(params.get("title")).toBe("imatch.시즌");
    expect(params.has("offset")).toBe(false);
    expect(params.has("limit")).toBe(false);
  });

  it.each(["denied", "missing-count"])("범위 복구의 %s도 0건으로 감추지 않는다", async (failure) => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "PGRST103" }), { status: 416 }))
      .mockResolvedValueOnce(failure === "denied" ? new Response(null, { status: 403 }) : new Response(null));
    vi.stubGlobal("fetch", fetch);
    await expect(getBooks({ ...DEFAULT_CATALOG_PARAMS, page: 99 })).rejects.toBeDefined();
  });

  it.each([0, -1, 1.5, NaN])("유효하지 않은 페이지 %s를 요청하지 않는다", async (page) => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(getBooks({ ...DEFAULT_CATALOG_PARAMS, page })).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});

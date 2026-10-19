import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Database } from "../../src/lib/supabase/database.types";
import { bookRows } from "../fixtures/books";

vi.mock("../../src/lib/supabase/browser", () => ({
  getBrowserSupabase: () => createClient<Database>("https://catalog.test", "public-test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
}));

import { getBooks, toBook } from "../../src/features/books/api/get-books";

afterEach(() => vi.unstubAllGlobals());

describe("교재 Data API 계약", () => {
  it("필요 컬럼·정확한 개수·안정된 정렬과 페이지 범위를 요청한다", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(bookRows), {
      headers: { "content-type": "application/json", "content-range": "12-17/18" },
    }));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    const result = await getBooks(2, signal);
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

  it.each([0, -1, 1.5, NaN])("유효하지 않은 페이지 %s를 요청하지 않는다", async (page) => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(getBooks(page)).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});

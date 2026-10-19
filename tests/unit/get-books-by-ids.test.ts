import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bookRows } from "../fixtures/books";

vi.mock("../../src/lib/supabase/browser", () => ({
  getBrowserSupabase: () => createClient("https://cart.test", "public-test-key", { auth: { persistSession: false }, db: { retry: false } }),
}));
import { getBooksByIds } from "../../src/features/books/api/get-books-by-ids";
afterEach(() => vi.unstubAllGlobals());

describe("장바구니 상품 조회", () => {
  it("중복 없는 ID 목록을 한 번에 조회하며 목록 검색·페이지 조건을 섞지 않는다", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(bookRows.slice(0, 2))));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    const books = await getBooksByIds([bookRows[0].id, bookRows[1].id, bookRows[0].id], signal);
    const [url, init] = fetch.mock.calls[0];
    const params = new URL(url).searchParams;
    expect(params.get("id")).toBe(`in.(${bookRows[0].id},${bookRows[1].id})`);
    expect([...params.keys()].sort()).toEqual(["id", "select"]);
    expect(init.signal).toBe(signal);
    expect(books).toHaveLength(2);
    expect(books[1].salePrice).toBe(167400);
  });

  it("빈 장바구니는 요청하지 않는다", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect(await getBooksByIds([])).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("존재하지 않는 ID와 실패를 구분한다", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response("[]"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "42501", message: "Denied" }), { status: 403 }))
      .mockResolvedValueOnce(new Response("null"));
    vi.stubGlobal("fetch", fetch);
    expect(await getBooksByIds([bookRows[0].id])).toEqual([]);
    await expect(getBooksByIds([bookRows[0].id])).rejects.toMatchObject({ code: "42501" });
    await expect(getBooksByIds([bookRows[0].id])).rejects.toThrow("missing rows");
  });
});

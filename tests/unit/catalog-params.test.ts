import { describe, expect, it } from "vitest";
import { changeCatalogParams, DEFAULT_CATALOG_PARAMS, lastCatalogPage, parseCatalogParams, serializeCatalogParams } from "../../src/features/books/model/catalog-params";

describe("교재 URL 조건", () => {
  it("기본값은 생략하고 다른 URL 조건은 보존한다", () => {
    const original = new URLSearchParams("utm_source=test&kind=all&page=1&q=");
    expect(serializeCatalogParams(parseCatalogParams(original), original)).toBe("utm_source=test");
    expect(original.get("page")).toBe("1");
  });

  it.each(["0", "-1", "1.5", "NaN", "Infinity", "1e2", " 2 ", "9007199254740991", "999999999999999999999999999"])("잘못된 페이지 %s는 1로 정리한다", (page) => {
    expect(parseCatalogParams(new URLSearchParams({ page })).page).toBe(1);
  });

  it("검색어를 정리하고 허용한 분류와 양의 정수 페이지를 복원한다", () => {
    expect(parseCatalogParams(new URLSearchParams("q=++시즌5++&kind=pass&page=02"))).toEqual({ query: "시즌5", kind: "pass", page: 2 });
    expect(parseCatalogParams(new URLSearchParams("kind=unknown"))).toEqual(DEFAULT_CATALOG_PARAMS);
    expect(parseCatalogParams(new URLSearchParams({ q: "가".repeat(101) })).query).toHaveLength(100);
    const truncated = parseCatalogParams(new URLSearchParams({ q: `${"가".repeat(99)} 나` }));
    expect(parseCatalogParams(new URLSearchParams(serializeCatalogParams(truncated)))).toEqual(truncated);
  });

  it("한글·특수문자 검색을 URL에서 왕복하고 중복 조건을 제거한다", () => {
    const params = { query: "시즌 (미적분, 확통) %_*\\&+", kind: "single" as const, page: 2 };
    const serialized = serializeCatalogParams(params, new URLSearchParams("q=old&q=other&page=9"));
    expect(parseCatalogParams(new URLSearchParams(serialized))).toEqual(params);
    expect(new URLSearchParams(serialized).getAll("q")).toHaveLength(1);
  });

  it("검색과 분류 변경은 기존 조건을 유지하면서 페이지를 함께 초기화한다", () => {
    const current = { query: "시즌", kind: "pass" as const, page: 2 };
    expect(changeCatalogParams(current, { type: "search", query: "  2027 " })).toEqual({ query: "2027", kind: "pass", page: 1 });
    expect(changeCatalogParams(current, { type: "kind", kind: "single" })).toEqual({ query: "시즌", kind: "single", page: 1 });
    expect(changeCatalogParams(current, { type: "search", query: "" })).toEqual({ query: "", kind: "pass", page: 1 });
    expect(changeCatalogParams(current, { type: "page", page: 3 })).toEqual({ ...current, page: 3 });
    expect(changeCatalogParams(current, { type: "reset" })).toEqual(DEFAULT_CATALOG_PARAMS);
  });

  it.each([[0, 1], [6, 1], [12, 1], [13, 2], [18, 2]])("%s개 결과의 마지막 페이지는 %s다", (total, last) => {
    expect(lastCatalogPage(total)).toBe(last);
  });
});

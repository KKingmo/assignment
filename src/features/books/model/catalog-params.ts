import { BOOKS_PAGE_SIZE, type BookKind } from "./book";

export const MAX_QUERY_LENGTH = 100;
// 시작과 끝 offset을 모두 안전한 정수로 유지한다.
export const MAX_CATALOG_PAGE = Math.floor(Number.MAX_SAFE_INTEGER / BOOKS_PAGE_SIZE);
export type CatalogParams = { query: string; kind: BookKind | "all"; page: number };
export const DEFAULT_CATALOG_PARAMS: CatalogParams = { query: "", kind: "all", page: 1 };
export type CatalogChange =
  | { type: "search"; query: string }
  | { type: "kind"; kind: CatalogParams["kind"] }
  | { type: "page"; page: number }
  | { type: "reset" };

export function normalizeQuery(query: string) {
  return query.trim().slice(0, MAX_QUERY_LENGTH).trim();
}

export function parseCatalogParams(search: URLSearchParams): CatalogParams {
  const kind = search.get("kind");
  const rawPage = search.get("page") ?? "1";
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : NaN;
  return {
    query: normalizeQuery(search.get("q") ?? ""),
    kind: kind === "pass" || kind === "single" ? kind : "all",
    page: Number.isSafeInteger(page) && page >= 1 && page <= MAX_CATALOG_PAGE ? page : 1,
  };
}

export function changeCatalogParams(current: CatalogParams, change: CatalogChange): CatalogParams {
  switch (change.type) {
    case "search": return { ...current, query: normalizeQuery(change.query), page: 1 };
    case "kind": return { ...current, kind: change.kind, page: 1 };
    case "page": return { ...current, page: change.page };
    case "reset": return { ...DEFAULT_CATALOG_PARAMS };
  }
}

export function serializeCatalogParams(params: CatalogParams, original = new URLSearchParams()) {
  const search = new URLSearchParams(original);
  for (const name of ["q", "kind", "page"]) search.delete(name);
  if (params.query) search.set("q", params.query);
  if (params.kind !== "all") search.set("kind", params.kind);
  if (params.page !== 1) search.set("page", String(params.page));
  return search.toString();
}

export function lastCatalogPage(totalCount: number) {
  return Math.max(1, Math.ceil(totalCount / BOOKS_PAGE_SIZE));
}

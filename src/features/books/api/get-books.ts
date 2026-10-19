import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { Database } from "@/lib/supabase/database.types";
import { BOOKS_PAGE_SIZE, type Book } from "../model/book";
import { DEFAULT_CATALOG_PARAMS, MAX_CATALOG_PAGE, type CatalogParams } from "../model/catalog-params";

export type BooksPage = { items: Book[]; totalCount: number };
type BookRow = Database["public"]["Tables"]["books"]["Row"];

export function toBook(row: BookRow): Book {
  if (row.kind !== "single" && row.kind !== "pass") {
    throw new Error("Unsupported book kind.");
  }

  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    coverPath: row.cover_path,
    listPrice: row.list_price,
    salePrice: row.sale_price,
  };
}

function filteredBooks(params: CatalogParams, head = false) {
  const request = getBrowserSupabase().from("books")
    .select("id,title,kind,cover_path,list_price,sale_price,sort_order", { count: "exact", head });
  if (params.kind !== "all") request.eq("kind", params.kind);
  if (params.query) {
    // 정규식 문법을 이스케이프해 %, _, *와 역슬래시도 입력 그대로 찾는다.
    const literal = params.query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    request.filter("title", "imatch", literal);
  }
  return request;
}

export async function getBooks(params: CatalogParams = DEFAULT_CATALOG_PARAMS, signal?: AbortSignal): Promise<BooksPage> {
  const { page } = params;
  if (!Number.isSafeInteger(page) || page < 1 || page > MAX_CATALOG_PAGE) {
    throw new Error("Page must be a positive integer.");
  }

  const from = (page - 1) * BOOKS_PAGE_SIZE;
  const request = filteredBooks(params)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .range(from, from + BOOKS_PAGE_SIZE - 1);

  if (signal) request.abortSignal(signal);
  const { data, error, count, status } = await request;

  // PostgREST는 범위 초과 시 count 없이 416을 반환한다. 동일 필터의 개수로만 복구한다.
  if (status === 416 && error?.code === "PGRST103" && page > 1) {
    const countRequest = filteredBooks(params, true);
    if (signal) countRequest.abortSignal(signal);
    const result = await countRequest;
    if (result.error) throw result.error;
    if (result.count === null) throw new Error("The catalog response is missing its total count.");
    return { items: [], totalCount: result.count };
  }

  if (error) throw error;
  if (data === null || count === null) {
    throw new Error("The catalog response is missing rows or its total count.");
  }

  return { items: data.map(toBook), totalCount: count };
}

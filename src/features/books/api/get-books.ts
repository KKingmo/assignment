import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { Database } from "@/lib/supabase/database.types";
import { BOOKS_PAGE_SIZE, type Book } from "../model/book";

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

export async function getBooks(page = 1, signal?: AbortSignal): Promise<BooksPage> {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error("Page must be a positive integer.");
  }

  const from = (page - 1) * BOOKS_PAGE_SIZE;
  const request = getBrowserSupabase()
    .from("books")
    .select("id,title,kind,cover_path,list_price,sale_price,sort_order", { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .range(from, from + BOOKS_PAGE_SIZE - 1);

  if (signal) request.abortSignal(signal);
  const { data, error, count } = await request;

  if (error) throw error;
  if (data === null || count === null) {
    throw new Error("The catalog response is missing rows or its total count.");
  }

  return { items: data.map(toBook), totalCount: count };
}

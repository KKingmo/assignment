import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { Book } from "../model/book";
import { toBook } from "./get-books";

export async function getBooksByIds(ids: string[], signal?: AbortSignal): Promise<Book[]> {
  if (ids.length === 0) return [];
  const request = getBrowserSupabase().from("books")
    .select("id,title,kind,cover_path,list_price,sale_price,sort_order")
    .in("id", [...new Set(ids)]);
  if (signal) request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  if (data === null) throw new Error("The cart response is missing rows.");
  return data.map(toBook);
}

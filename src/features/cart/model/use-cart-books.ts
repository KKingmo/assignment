"use client";

import { useQuery } from "@tanstack/react-query";
import { getBooksByIds } from "@/features/books/api/get-books-by-ids";
import type { CartItem } from "./cart";

export function useCartBooks(items: CartItem[]) {
  const ids = items.map((item) => item.bookId).sort();
  return useQuery({
    queryKey: ["books", "cart", ids],
    queryFn: ({ signal }) => getBooksByIds(ids, signal),
    enabled: ids.length > 0,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

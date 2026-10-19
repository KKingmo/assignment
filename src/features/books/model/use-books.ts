"use client";

import { useQuery } from "@tanstack/react-query";
import { getBooks } from "../api/get-books";
import { BOOKS_PAGE_SIZE } from "./book";
import type { CatalogParams } from "./catalog-params";

export function useBooks(params: CatalogParams) {
  return useQuery({
    queryKey: ["books", "list", { ...params, pageSize: BOOKS_PAGE_SIZE }],
    queryFn: ({ signal }) => getBooks(params, signal),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

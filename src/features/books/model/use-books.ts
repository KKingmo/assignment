"use client";

import { useQuery } from "@tanstack/react-query";
import { getBooks } from "../api/get-books";
import { BOOKS_PAGE_SIZE } from "./book";

export function useBooks(page = 1) {
  return useQuery({
    queryKey: ["books", "list", { page, pageSize: BOOKS_PAGE_SIZE }],
    queryFn: ({ signal }) => getBooks(page, signal),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

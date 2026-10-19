"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { changeCatalogParams, parseCatalogParams, serializeCatalogParams, type CatalogChange } from "./catalog-params";

function writeSearch(search: string, replace = false) {
  const url = new URL(window.location.href);
  url.search = search;
  if (url.href === window.location.href) return;
  const href = `${url.pathname}${url.search}${url.hash}`;
  if (replace) window.history.replaceState(null, "", href);
  else window.history.pushState(null, "", href);
}

export function useCatalogParams() {
  const search = useSearchParams().toString();
  const params = parseCatalogParams(new URLSearchParams(search));
  const normalized = serializeCatalogParams(params, new URLSearchParams(search));

  useEffect(() => {
    if (new URLSearchParams(window.location.search).toString() === search) writeSearch(normalized, true);
  }, [search, normalized]);

  const changeParams = useCallback((change: CatalogChange) => {
    // 연속 조작에서도 아직 렌더링되지 않은 최신 URL 조건을 유지한다.
    const current = new URLSearchParams(window.location.search);
    writeSearch(serializeCatalogParams(changeCatalogParams(parseCatalogParams(current), change), current));
  }, []);

  const replacePage = useCallback((page: number) => {
    const current = new URLSearchParams(window.location.search);
    if (current.toString() !== search) return;
    writeSearch(serializeCatalogParams({ ...parseCatalogParams(current), page }, current), true);
  }, [search]);

  return { params, search, changeParams, replacePage };
}

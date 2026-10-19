"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useCatalogParams } from "../model/use-catalog-params";
import { lastCatalogPage } from "../model/catalog-params";
import { useBooks } from "../model/use-books";
import { BookGrid } from "./book-grid";
import { BookGridSkeleton } from "./book-grid-skeleton";
import { CatalogPagination } from "./catalog-pagination";
import { CatalogToolbar } from "./catalog-toolbar";
import styles from "./catalog.module.css";

export function BookCatalog() {
  const { params, search, changeParams, replacePage } = useCatalogParams();
  const { data, isPending, isError, isFetching, refetch } = useBooks(params);
  const lastPage = data ? lastCatalogPage(data.totalCount) : undefined;
  const correctingPage = lastPage !== undefined && params.page > lastPage;
  const filtered = params.query !== "" || params.kind !== "all";

  useEffect(() => {
    if (correctingPage) replacePage(lastPage!);
  }, [correctingPage, lastPage, replacePage]);

  function changePage(page: number) {
    changeParams({ type: "page", page });
    const catalog = document.getElementById("catalog");
    catalog?.focus({ preventScroll: true });
    catalog?.scrollIntoView({ block: "start" });
  }

  return (
    <>
      <CatalogToolbar params={params} search={search} onChange={changeParams} />
      {isPending || correctingPage ? <BookGridSkeleton /> : null}
      {isError ? (
        <div role="alert" className={styles.feedback}>
          <p>{data ? "교재 정보를 새로 불러오지 못했어요. 이전 정보를 표시합니다." : "교재를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."}</p>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
            {isFetching ? "다시 불러오는 중…" : "다시 시도"}
          </Button>
        </div>
      ) : null}
      {data && !correctingPage ? (
        <>
          <p role="status" className={styles.resultCount}>전체 {data.totalCount}개</p>
          {data.items.length === 0 ? (
            <div className={styles.feedback}>
              <p>{filtered ? "검색 조건에 맞는 교재가 없습니다." : "등록된 교재가 없습니다."}</p>
              {filtered ? <Button variant="outline" onClick={() => changeParams({ type: "reset" })}>검색 조건 초기화</Button> : null}
            </div>
          ) : (
            <>
              <BookGrid books={data.items} />
              <CatalogPagination totalCount={data.totalCount} page={params.page} onPageChange={changePage} />
            </>
          )}
        </>
      ) : null}
    </>
  );
}

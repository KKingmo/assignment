"use client";

import { Button } from "@/components/ui/button";
import { useBooks } from "../model/use-books";
import { BookGrid } from "./book-grid";
import { BookGridSkeleton } from "./book-grid-skeleton";
import { CatalogPagination } from "./catalog-pagination";
import styles from "./catalog.module.css";

export function BookCatalog() {
  const { data, isPending, isError, isFetching, refetch } = useBooks();

  if (isPending) return <BookGridSkeleton />;

  return (
    <>
      {isError ? (
        <div role="alert" className={styles.feedback}>
          <p>{data ? "교재 정보를 새로 불러오지 못했어요. 이전 정보를 표시합니다." : "교재를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."}</p>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
            {isFetching ? "다시 불러오는 중…" : "다시 시도"}
          </Button>
        </div>
      ) : null}
      {data ? (
        <>
          <p role="status" className={styles.resultCount}>전체 {data.totalCount}개</p>
          {data.items.length === 0 ? (
            <div className={styles.feedback}><p>등록된 교재가 없습니다.</p></div>
          ) : (
            <>
              <BookGrid books={data.items} />
              <CatalogPagination totalCount={data.totalCount} />
            </>
          )}
        </>
      ) : null}
    </>
  );
}

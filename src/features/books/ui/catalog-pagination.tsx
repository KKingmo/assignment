import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { lastCatalogPage } from "../model/catalog-params";
import styles from "./catalog.module.css";

type CatalogPaginationProps = { totalCount: number; page: number; onPageChange: (page: number) => void };

export function CatalogPagination({ totalCount, page, onPageChange }: CatalogPaginationProps) {
  const pageCount = lastCatalogPage(totalCount);
  if (pageCount < 2) return null;
  return (
    <nav aria-label="교재 페이지" className={styles.pagination}>
      <IconButton icon="caret-left" label="이전 페이지" size="sm" variant="outline" disabled={page === 1} onClick={() => onPageChange(page - 1)} />
      {Array.from({ length: pageCount }, (_, index) => (
        <Button key={index} variant={index + 1 === page ? "primary" : "outline"} aria-label={`${index + 1}페이지`} aria-current={index + 1 === page ? "page" : undefined} onClick={() => onPageChange(index + 1)}>{index + 1}</Button>
      ))}
      <IconButton icon="caret-right" label="다음 페이지" size="sm" variant="outline" disabled={page === pageCount} onClick={() => onPageChange(page + 1)} />
    </nav>
  );
}

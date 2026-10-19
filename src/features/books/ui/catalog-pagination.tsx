import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { BOOKS_PAGE_SIZE } from "../model/book";
import styles from "./catalog.module.css";

export function CatalogPagination({ totalCount }: { totalCount: number }) {
  const pageCount = Math.ceil(totalCount / BOOKS_PAGE_SIZE);
  if (pageCount < 2) return null;
  return (
    <nav aria-label="교재 페이지" className={styles.pagination}>
      <IconButton icon="caret-left" label="이전 페이지" size="sm" variant="outline" disabled />
      {Array.from({ length: pageCount }, (_, index) => (
        <Button key={index} variant={index === 0 ? "primary" : "outline"} aria-label={`${index + 1}페이지`} aria-current={index === 0 ? "page" : undefined} aria-disabled="true">{index + 1}</Button>
      ))}
      <IconButton icon="caret-right" label="다음 페이지" size="sm" variant="outline" aria-disabled="true" />
    </nav>
  );
}

import type { MouseEvent, ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { lastCatalogPage, serializeCatalogParams, type CatalogParams } from "../model/catalog-params";
import styles from "./catalog.module.css";

type CatalogPaginationProps = { totalCount: number; params: CatalogParams; search: string; onPageChange: (page: number) => void };

export function CatalogPagination({ totalCount, params, search, onPageChange }: CatalogPaginationProps) {
  const pageCount = lastCatalogPage(totalCount);
  if (pageCount < 2) return null;

  function pageLink(page: number, label: string, children: ReactNode, disabled = false) {
    if (disabled) return <span className={styles.pageLink} role="link" aria-label={label} aria-disabled="true">{children}</span>;
    const query = serializeCatalogParams({ ...params, page }, new URLSearchParams(search));
    function navigate(event: MouseEvent<HTMLAnchorElement>) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      onPageChange(page);
    }
    return (
      <a className={styles.pageLink} href={query ? `/?${query}` : "/"} aria-label={label} aria-current={page === params.page ? "page" : undefined} onClick={navigate}>
        {children}
      </a>
    );
  }

  return (
    <nav aria-label="교재 페이지" className={styles.pagination}>
      {pageLink(params.page - 1, "이전 페이지", <Icon name="caret-left" size="sm" />, params.page === 1)}
      {Array.from({ length: pageCount }, (_, index) => <span key={index}>{pageLink(index + 1, `${index + 1}페이지`, index + 1)}</span>)}
      {pageLink(params.page + 1, "다음 페이지", <Icon name="caret-right" size="sm" />, params.page === pageCount)}
    </nav>
  );
}

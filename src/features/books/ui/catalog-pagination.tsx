import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import styles from "./catalog.module.css";

export function CatalogPagination() {
  return (
    <nav aria-label="교재 페이지" className={styles.pagination}>
      <IconButton icon="caret-left" label="이전 페이지" size="sm" variant="outline" disabled />
      <Button aria-label="1페이지" aria-current="page" aria-disabled="true">1</Button>
      <Button variant="outline" aria-label="2페이지" aria-disabled="true">2</Button>
      <IconButton icon="caret-right" label="다음 페이지" size="sm" variant="outline" aria-disabled="true" />
    </nav>
  );
}

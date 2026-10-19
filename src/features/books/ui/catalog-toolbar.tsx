import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { TextField } from "@/components/ui/text-field";
import styles from "./catalog.module.css";

export function CatalogToolbar() {
  return (
    <div className={styles.toolbar}>
      <TextField
        id="book-search"
        label="교재 검색"
        placeholder="검색"
        readOnly
        aria-disabled="true"
        className={styles.search}
        leading={<IconButton label="검색 실행" icon="search" size="sm" aria-disabled="true" />}
        trailing={<IconButton label="검색어 초기화" icon="close" size="sm" aria-disabled="true" />}
      />
      <div className={styles.filters} role="group" aria-label="교재 분류">
        {["전체", "패스", "단품"].map((kind, index) => (
          <Button variant="ghost" aria-pressed={index === 0} aria-disabled="true" key={kind}>
            {kind}
          </Button>
        ))}
      </div>
    </div>
  );
}

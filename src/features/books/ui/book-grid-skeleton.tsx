import { BOOKS_PAGE_SIZE } from "../model/book";
import styles from "./catalog.module.css";

export function BookGridSkeleton() {
  return (
    <div role="status" aria-label="교재를 불러오는 중">
      <span className="sr-only">교재를 불러오는 중입니다.</span>
      <ul className={styles.grid} aria-hidden="true">
        {Array.from({ length: BOOKS_PAGE_SIZE }, (_, index) => (
          <li key={index} className={styles.card}>
            <div className={`${styles.cover} ${styles.skeleton}`} />
            <div className={`${styles.skeletonLine} ${styles.skeleton}`} />
            <div className={`${styles.skeletonPrice} ${styles.skeleton}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

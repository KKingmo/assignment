import type { Book } from "../model/book";
import { BookCard } from "./book-card";
import styles from "./catalog.module.css";

export function BookGrid({ books }: { books: Book[] }) {
  return (
    <ul className={styles.grid} aria-label="교재 목록">
      {books.map((book) => <li key={book.id}><BookCard book={book} /></li>)}
    </ul>
  );
}

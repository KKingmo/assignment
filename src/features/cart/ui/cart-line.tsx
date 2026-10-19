"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Book } from "@/features/books/model/book";
import { formatWon, getBookPrice } from "@/features/books/model/book-price";
import { MAX_CART_QUANTITY, type CartItem } from "../model/cart";
import styles from "./cart.module.css";

type CartLineProps = {
  item: CartItem;
  book?: Book;
  index: number;
  pricesReady: boolean;
  onQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
};

export function CartLine({ item, book, index, pricesReady, onQuantity, onRemove }: CartLineProps) {
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const unavailable = pricesReady && !book;
  const title = book?.title ?? (unavailable ? `확인할 수 없는 교재 ${index + 1}` : `교재 ${index + 1}`);
  return (
    <li>
      <article className={styles.line} aria-label={title}>
        <div className={styles.cover}>
          {book && failedCover !== book.coverPath ? <Image src={book.coverPath} alt={book.title} fill sizes="80px" onError={() => setFailedCover(book.coverPath)} />
            : <span className={styles.coverFallback}>{unavailable ? "교재 없음" : "교재"}</span>}
        </div>
        <div className={styles.lineContent}>
          <div className={styles.lineHeading}>
            <h3>{title}</h3>
            <Button variant="ghost" className={styles.remove} aria-label={`${title} 삭제`} onClick={() => onRemove(item.bookId)}>삭제</Button>
          </div>
          {book ? <p className={styles.muted}>{book.kind === "pass" ? "패스" : "단품"}{pricesReady ? ` · ${formatWon(getBookPrice(book).amount)}` : ""}</p> : null}
          {unavailable ? <p className={styles.warning}>현재 목록에서 찾을 수 없어 합계에서 제외했어요.</p> : null}
          <div className={styles.lineBottom}>
            <div className={styles.quantity} role="group" aria-label={`${title} 수량`}>
              <Button variant="ghost" aria-label={`${title} 수량 줄이기`} disabled={item.quantity <= 1 || unavailable} onClick={() => onQuantity(item.bookId, item.quantity - 1)}>−</Button>
              <span aria-label="수량">{item.quantity}</span>
              <Button variant="ghost" aria-label={`${title} 수량 늘리기`} disabled={item.quantity >= MAX_CART_QUANTITY || unavailable} onClick={() => onQuantity(item.bookId, item.quantity + 1)}>+</Button>
            </div>
            {pricesReady && book ? <strong className={styles.lineAmount} aria-label="상품 금액">{formatWon(getBookPrice(book).amount * item.quantity)}</strong> : null}
          </div>
          {item.quantity === MAX_CART_QUANTITY ? <p className={styles.muted}>최대 {MAX_CART_QUANTITY}개까지 담을 수 있어요.</p> : null}
        </div>
      </article>
    </li>
  );
}

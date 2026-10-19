"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import type { Book } from "../model/book";
import { formatWon, getBookPrice } from "../model/book-price";
import styles from "./catalog.module.css";

export function BookCard({ book }: { book: Book }) {
  const price = getBookPrice(book);
  const [failedCover, setFailedCover] = useState<string | null>(null);

  return (
    <article className={styles.card} aria-labelledby={`book-${book.id}`}>
      <div className={styles.cover}>
        {failedCover === book.coverPath ? (
          <div className={styles.imageFallback} role="img" aria-label={`${book.title} 표지 이미지 없음`}>
            <span>표지 이미지를<br />준비하고 있어요</span>
          </div>
        ) : <Image
          src={book.coverPath}
          alt={book.title}
          fill
          sizes="(max-width: 599px) calc((100vw - 60px) / 2), (max-width: 767px) 250px, (max-width: 1099px) 30vw, 250px"
          className={styles.coverImage}
          onError={() => setFailedCover(book.coverPath)}
        />}
        <IconButton
          icon="shopping-cart"
          label={`${book.title} 장바구니에 담기`}
          variant="floating"
          aria-disabled="true"
          className={styles.addToCart}
        />
      </div>
      <div className={styles.details}>
        <Badge>{book.kind === "pass" ? "패스" : "단품"}</Badge>
        <h2 id={`book-${book.id}`} className={styles.title}>{book.title}</h2>
        <div className={styles.prices}>
          {price.originalAmount !== null ? (
            <del className={styles.originalPrice}>
              <span className="sr-only">정가 </span>{formatWon(price.originalAmount)}
            </del>
          ) : null}
          <p className={styles.salePrice}>
            {price.discountPercent > 0 ? (
              <span className={styles.discount}>{price.discountPercent}%<span className="sr-only"> 할인</span></span>
            ) : null}
            <span><span className="sr-only">판매가 </span>{formatWon(price.amount)}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

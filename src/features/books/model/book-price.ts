import type { Book } from "./book";

export function getBookPrice(book: Pick<Book, "listPrice" | "salePrice">) {
  const amount = book.salePrice ?? book.listPrice;
  const discounted = book.listPrice > 0 && amount < book.listPrice;

  return {
    amount,
    originalAmount: discounted ? book.listPrice : null,
    discountPercent: discounted
      ? Math.round(((book.listPrice - amount) / book.listPrice) * 100)
      : 0,
  };
}

const wonFormatter = new Intl.NumberFormat("ko-KR");

export function formatWon(amount: number) {
  return `${wonFormatter.format(amount)}원`;
}

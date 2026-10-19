import type { Book } from "@/features/books/model/book";
import { getBookPrice } from "@/features/books/model/book-price";

export const MAX_CART_QUANTITY = 99;
export const CART_STORAGE_KEY = "hidden-kice.cart.v1";
export type CartItem = { bookId: string; quantity: number };
export type PersistedCart = { version: 1; items: CartItem[] };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isBookId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function validQuantity(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= MAX_CART_QUANTITY;
}

export function restoreCart(raw: string | null): { items: CartItem[]; repaired: boolean } {
  if (raw === null) return { items: [], repaired: false };
  try {
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== "object" || !("version" in saved) || saved.version !== 1 || !("items" in saved) || !Array.isArray(saved.items)) {
      return { items: [], repaired: true };
    }
    const quantities = new Map<string, number>();
    let repaired = false;
    for (const item of saved.items) {
      if (!item || !isBookId(item.bookId) || !validQuantity(item.quantity)) {
        repaired = true;
        continue;
      }
      const id = item.bookId.toLowerCase();
      const previous = quantities.get(id) ?? 0;
      if (previous > 0) repaired = true;
      quantities.set(id, Math.min(previous + item.quantity, MAX_CART_QUANTITY));
    }
    return { items: Array.from(quantities, ([bookId, quantity]) => ({ bookId, quantity })), repaired };
  } catch {
    return { items: [], repaired: true };
  }
}

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify({ version: 1, items: items.map(({ bookId, quantity }) => ({ bookId, quantity })) } satisfies PersistedCart);
}

export function addCartItem(items: CartItem[], bookId: string): { items: CartItem[]; result: "added" | "increased" | "limit" | "invalid" } {
  if (!isBookId(bookId)) return { items, result: "invalid" };
  const id = bookId.toLowerCase();
  const existing = items.find((item) => item.bookId === id);
  if (existing && existing.quantity >= MAX_CART_QUANTITY) return { items, result: "limit" };
  return existing
    ? { items: items.map((item) => item.bookId === id ? { ...item, quantity: item.quantity + 1 } : item), result: "increased" }
    : { items: [...items, { bookId: id, quantity: 1 }], result: "added" };
}

export function setCartQuantity(items: CartItem[], bookId: string, quantity: number): CartItem[] {
  if (!validQuantity(quantity)) return items;
  return items.map((item) => item.bookId === bookId ? { ...item, quantity } : item);
}

export function getCartTotal(items: CartItem[], books: Book[]) {
  const byId = new Map(books.map((book) => [book.id, book]));
  let amount = 0;
  let missingCount = 0;
  for (const item of items) {
    const book = byId.get(item.bookId);
    if (book) amount += getBookPrice(book).amount * item.quantity;
    else missingCount += 1;
  }
  return { amount, missingCount };
}

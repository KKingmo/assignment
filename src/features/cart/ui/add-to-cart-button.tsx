"use client";

import { IconButton } from "@/components/ui/icon-button";
import { useCart } from "../model/cart-provider";

export function AddToCartButton({ bookId, title, className }: { bookId: string; title: string; className?: string }) {
  const { ready, addItem } = useCart();
  return <IconButton icon="shopping-cart" label={`${title} 장바구니에 담기`} variant="floating" className={className} disabled={!ready} onClick={() => addItem(bookId)} />;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { createCartStore, type CartStore } from "./cart-store";
import { MAX_CART_QUANTITY } from "./cart";
import { IconButton } from "@/components/ui/icon-button";
import styles from "../ui/cart.module.css";

type CartContextValue = { store: CartStore; addItem: (bookId: string) => void };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createCartStore());
  const [notice, setNotice] = useState<{ message: string; id: number } | null>(null);
  useEffect(() => { store.restore(); }, [store]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const addItem = useCallback((bookId: string) => {
    const result = store.add(bookId);
    if (result === "invalid" || result === "not-ready") return;
    const message = result === "limit" ? `상품은 최대 ${MAX_CART_QUANTITY}개까지 담을 수 있습니다.`
      : result === "increased" ? "수량이 추가되었습니다" : "장바구니에 담았습니다";
    const storageMessage = store.getSnapshot().storageError ? " 이 브라우저에 보관하지 못했습니다." : "";
    setNotice((previous) => ({ message: message + storageMessage, id: (previous?.id ?? 0) + 1 }));
  }, [store]);
  const value = useMemo(() => ({ store, addItem }), [store, addItem]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <div className={styles.toastRegion} aria-live="polite" aria-atomic="true">
        {notice ? <div className={styles.toast} key={notice.id}>
          <span>{notice.message}</span>
          <IconButton icon="close" label="장바구니 알림 닫기" size="sm" onClick={() => setNotice(null)} />
        </div> : null}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("CartProvider is required.");
  const { store, addItem } = context;
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return { ...state, store, addItem, totalQuantity: state.items.reduce((sum, item) => sum + item.quantity, 0) };
}

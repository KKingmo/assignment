"use client";

import { useCallback, useState } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { useCart } from "../model/cart-provider";
import { CartPanel } from "./cart-panel";
import styles from "./cart.module.css";

export function CartButton() {
  const { ready, totalQuantity } = useCart();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return <>
    <div className={styles.trigger}>
      <IconButton icon="shopping-cart" label={totalQuantity ? `장바구니, 총 ${totalQuantity}개` : "장바구니"} disabled={!ready} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} />
      {totalQuantity > 0 ? <span className={styles.count} aria-hidden="true">{totalQuantity > 99 ? "99+" : totalQuantity}</span> : null}
    </div>
    {open ? <CartPanel onClose={close} /> : null}
  </>;
}

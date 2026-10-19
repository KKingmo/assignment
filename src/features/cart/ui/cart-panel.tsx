"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { formatWon } from "@/features/books/model/book-price";
import { getCartTotal } from "../model/cart";
import { useCart } from "../model/cart-provider";
import { useCartBooks } from "../model/use-cart-books";
import { CartLine } from "./cart-line";
import styles from "./cart.module.css";

export function CartPanel({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { items, totalQuantity, store, storageError, repaired } = useCart();
  const query = useCartBooks(items);
  const pricesReady = query.isSuccess && !query.isFetching && !query.isPaused;
  const books = query.data ?? [];
  const byId = new Map(books.map((book) => [book.id, book]));
  const total = getCartTotal(items, books);

  useEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog ref={dialog} className={styles.panel} aria-labelledby="cart-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
      <header className={styles.panelHeader}>
        <div><h2 id="cart-title">장바구니</h2><p className={styles.muted}>총 {totalQuantity}개</p></div>
        <IconButton icon="close" label="장바구니 닫기" onClick={onClose} />
      </header>
      <div className={styles.panelBody}>
        {storageError ? <p role="alert" className={styles.notice}>브라우저에 장바구니를 보관하지 못했어요. 현재 화면에서는 사용할 수 있지만 다시 열면 유지되지 않을 수 있습니다.</p> : null}
        {repaired ? <p className={styles.notice}>저장된 장바구니에서 복원할 수 없는 항목을 정리했습니다.</p> : null}
        {items.length === 0 ? <div className={styles.empty}>
          <Icon name="shopping-cart" /><h3>장바구니가 비어 있어요</h3><p>마음에 드는 교재를 담아 보세요.</p>
        </div> : <>
          <div className={styles.listToolbar}><span>{items.length}종의 교재</span><Button variant="ghost" onClick={() => store.clear()}>장바구니 비우기</Button></div>
          {query.isPaused ? <p role="status" className={styles.notice}>네트워크 연결을 기다리고 있어요.</p>
            : query.isPending || query.isFetching ? <p role="status" className={styles.notice}>현재 상품 정보와 가격을 확인하고 있어요.</p> : null}
          {query.isError && !query.isFetching ? <div role="alert" className={styles.notice}>
            <p>상품 정보를 불러오지 못했어요. 금액을 확인하려면 다시 시도해 주세요.</p>
            <Button variant="outline" onClick={() => void query.refetch()}>상품 정보 다시 시도</Button>
          </div> : null}
          <ul className={styles.items} aria-label="장바구니 상품">
            {items.map((item, index) => <CartLine key={item.bookId} item={item} book={byId.get(item.bookId)} index={index} pricesReady={pricesReady} onQuantity={store.setQuantity} onRemove={store.remove} />)}
          </ul>
        </>}
      </div>
      <footer className={styles.panelFooter}>
        {items.length > 0 ? pricesReady ? <>
          <div className={styles.total} role="group" aria-label={total.missingCount ? "확인된 상품 소계" : "장바구니 합계"}>
            <span>{total.missingCount ? "확인된 상품 소계" : "합계"}</span><strong>{formatWon(total.amount)}</strong>
          </div>
          {total.missingCount ? <p className={styles.warning}>확인할 수 없는 교재 {total.missingCount}종은 금액에 포함되지 않았습니다.</p> : null}
        </> : <p className={styles.muted}>합계는 상품 정보 확인 후 표시됩니다.</p> : null}
        <Button variant="outline" onClick={onClose}>계속 쇼핑하기</Button>
      </footer>
    </dialog>
  );
}

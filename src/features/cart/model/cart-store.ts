import { addCartItem, CART_STORAGE_KEY, restoreCart, serializeCart, setCartQuantity, type CartItem } from "./cart";

type CartSnapshot = { items: CartItem[]; ready: boolean; storageError: boolean; repaired: boolean };
type CartStorage = Pick<Storage, "getItem" | "setItem">;
const INITIAL_SNAPSHOT: CartSnapshot = { items: [], ready: false, storageError: false, repaired: false };

// Provider별 인스턴스. 서버 렌더링 중에는 브라우저 저장소에 접근하지 않는다.
export function createCartStore(getStorage: () => CartStorage = () => window.localStorage) {
  let snapshot = INITIAL_SNAPSHOT;
  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) listener();
  }

  function save(items: CartItem[]) {
    let storageError = false;
    try { getStorage().setItem(CART_STORAGE_KEY, serializeCart(items)); }
    catch { storageError = true; }
    snapshot = { ...snapshot, items, storageError };
    emit();
  }

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => INITIAL_SNAPSHOT,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    restore() {
      if (snapshot.ready) return;
      try {
        const raw = getStorage().getItem(CART_STORAGE_KEY);
        const restored = restoreCart(raw);
        snapshot = { ...restored, ready: true, storageError: false };
        // 읽기와 검증 이후에만 손상된 형식·중복·불필요한 필드를 정리한다.
        if (raw !== null && raw !== serializeCart(restored.items)) save(restored.items);
        else emit();
      } catch {
        snapshot = { ...snapshot, ready: true, storageError: true };
        emit();
      }
    },
    add(bookId: string) {
      if (!snapshot.ready) return "not-ready" as const;
      const changed = addCartItem(snapshot.items, bookId);
      if (changed.items !== snapshot.items) save(changed.items);
      return changed.result;
    },
    setQuantity(bookId: string, quantity: number) {
      if (snapshot.ready) save(setCartQuantity(snapshot.items, bookId, quantity));
    },
    remove(bookId: string) {
      if (snapshot.ready) save(snapshot.items.filter((item) => item.bookId !== bookId));
    },
    clear() {
      if (snapshot.ready) save([]);
    },
  };
}

export type CartStore = ReturnType<typeof createCartStore>;

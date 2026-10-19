import { describe, expect, it, vi } from "vitest";
import { addCartItem, CART_STORAGE_KEY, getCartTotal, restoreCart, serializeCart, setCartQuantity } from "../../src/features/cart/model/cart";
import { createCartStore } from "../../src/features/cart/model/cart-store";
import { fixtureBooks } from "../fixtures/books";

const [single, pass] = fixtureBooks;

describe("장바구니 규칙", () => {
  it("처음 담은 상품과 재담기를 구분하며 기존 배열을 변경하지 않는다", () => {
    const first = addCartItem([], single.id);
    expect(first.result).toBe("added");
    const second = addCartItem(first.items, single.id);
    expect(second).toEqual({ result: "increased", items: [{ bookId: single.id, quantity: 2 }] });
    expect(first.items).toEqual([{ bookId: single.id, quantity: 1 }]);
  });

  it("99개에서 재담기를 막고 알 수 없는 ID는 추가하지 않는다", () => {
    const items = [{ bookId: single.id, quantity: 99 }];
    expect(addCartItem(items, single.id)).toEqual({ items, result: "limit" });
    expect(addCartItem(items, "not-uuid")).toEqual({ items, result: "invalid" });
  });

  it.each([0, -1, 100, 1.5, NaN, Infinity])("잘못된 수량 %s는 현재 수량을 유지한다", (quantity) => {
    const items = [{ bookId: single.id, quantity: 2 }];
    expect(setCartQuantity(items, single.id, quantity)).toBe(items);
  });

  it("수량을 바꾸고 현재 판매가로 합계를 구하며 누락 상품을 별도로 센다", () => {
    const original = [{ bookId: single.id, quantity: 1 }, { bookId: pass.id, quantity: 1 }];
    const items = setCartQuantity(original, single.id, 2);
    expect(getCartTotal(items, [single, pass])).toEqual({ amount: 223400, missingCount: 0 });
    expect(getCartTotal(items, [{ ...single, salePrice: 10000 }])).toEqual({ amount: 20000, missingCount: 1 });
    expect(getCartTotal(items, [{ ...single, salePrice: 0 }])).toEqual({ amount: 0, missingCount: 1 });
    expect(original[0].quantity).toBe(1);
  });
});

describe("장바구니 저장 형식", () => {
  it("버전·ID·수량만 저장하고 가격 등 응답 필드는 제외한다", () => {
    const input = [{ bookId: single.id, quantity: 2, title: single.title, price: 28000 }];
    const raw = serializeCart(input);
    expect(JSON.parse(raw)).toEqual({ version: 1, items: [{ bookId: single.id, quantity: 2 }] });
    expect(restoreCart(raw)).toEqual({ items: [{ bookId: single.id, quantity: 2 }], repaired: false });
    expect(restoreCart(null)).toEqual({ items: [], repaired: false });
  });

  it.each(["broken", "null", "[]", '{"version":2,"items":[]}', '{"version":1,"items":{}}'])("손상된 형식 %s는 복구 안내와 빈 상태를 반환한다", (raw) => {
    expect(restoreCart(raw)).toEqual({ items: [], repaired: true });
  });

  it("잘못된 항목은 제외하고 대소문자가 다른 중복 ID는 99개 이내로 합친다", () => {
    const raw = JSON.stringify({ version: 1, items: [
      null, "invalid", { bookId: "invalid", quantity: 1 }, { bookId: pass.id, quantity: "2" },
      { bookId: pass.id, quantity: 0 }, { bookId: pass.id, quantity: 100 },
      { bookId: single.id.toUpperCase(), quantity: 98 }, { bookId: single.id, quantity: 2 }, { bookId: pass.id, quantity: 3 },
    ] });
    expect(restoreCart(raw)).toEqual({ items: [{ bookId: single.id, quantity: 99 }, { bookId: pass.id, quantity: 3 }], repaired: true });
  });
});

describe("브라우저 보관 경계", () => {
  function storage(raw: string | null) {
    return { getItem: vi.fn(() => raw), setItem: vi.fn() };
  }

  it("서버와 복구 전에는 저장소에 접근하거나 빈 상태를 덮어쓰지 않는다", () => {
    const saved = storage(serializeCart([{ bookId: single.id, quantity: 3 }]));
    const store = createCartStore(() => saved);
    expect(store.getServerSnapshot().ready).toBe(false);
    expect(store.add(pass.id)).toBe("not-ready");
    expect(saved.getItem).not.toHaveBeenCalled();
    expect(saved.setItem).not.toHaveBeenCalled();
    store.restore();
    store.restore();
    expect(store.getSnapshot().items).toEqual([{ bookId: single.id, quantity: 3 }]);
    expect(saved.getItem).toHaveBeenCalledTimes(1);
    expect(saved.setItem).not.toHaveBeenCalled();
  });

  it("연속 담기·수량·삭제·비우기를 즉시 반영하고 구독을 해제한다", () => {
    const saved = storage(null);
    const store = createCartStore(() => saved);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.restore();
    store.add(single.id);
    store.add(single.id);
    store.add(pass.id);
    store.setQuantity(single.id, 3);
    store.remove(pass.id);
    expect(store.getSnapshot().items).toEqual([{ bookId: single.id, quantity: 3 }]);
    expect(saved.setItem).toHaveBeenLastCalledWith(CART_STORAGE_KEY, serializeCart([{ bookId: single.id, quantity: 3 }]));
    const count = listener.mock.calls.length;
    unsubscribe();
    store.clear();
    expect(listener).toHaveBeenCalledTimes(count);
    expect(saved.setItem).toHaveBeenLastCalledWith(CART_STORAGE_KEY, serializeCart([]));
  });

  it("손상 항목을 정리하되 복원 가능한 상품은 보존한다", () => {
    const saved = storage(JSON.stringify({ version: 1, items: [{ bookId: single.id, quantity: 2 }, { bookId: "bad", quantity: 1 }] }));
    const store = createCartStore(() => saved);
    store.restore();
    expect(store.getSnapshot().repaired).toBe(true);
    expect(saved.setItem).toHaveBeenCalledWith(CART_STORAGE_KEY, serializeCart([{ bookId: single.id, quantity: 2 }]));
  });

  it("읽기가 거부되면 저장하지 않고 현재 화면의 사용을 허용한다", () => {
    const saved = { getItem: vi.fn(() => { throw new Error("Denied"); }), setItem: vi.fn() };
    const store = createCartStore(() => saved);
    store.restore();
    expect(store.getSnapshot()).toMatchObject({ ready: true, storageError: true, items: [] });
    expect(saved.setItem).not.toHaveBeenCalled();
  });

  it("저장 실패 때도 메모리의 수량을 유지하고 다음 저장 성공 시 오류를 해제한다", () => {
    const saved = storage(null);
    saved.setItem.mockImplementationOnce(() => { throw new Error("Quota exceeded"); });
    const store = createCartStore(() => saved);
    store.restore();
    store.add(single.id);
    expect(store.getSnapshot()).toMatchObject({ storageError: true, items: [{ bookId: single.id, quantity: 1 }] });
    store.add(single.id);
    expect(store.getSnapshot()).toMatchObject({ storageError: false, items: [{ bookId: single.id, quantity: 2 }] });
  });

  it("Provider 인스턴스 간 장바구니 상태를 공유하지 않는다", () => {
    const first = createCartStore(() => storage(null));
    const second = createCartStore(() => storage(null));
    first.restore(); second.restore(); first.add(single.id);
    expect(second.getSnapshot().items).toEqual([]);
  });
});

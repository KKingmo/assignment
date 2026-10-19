import { expect, test } from "vitest";
import { formatWon, getBookPrice } from "@/features/books/model/book-price";

test.each([
  { name: "할인이 없으면 정가", listPrice: 28000, salePrice: null, expected: { amount: 28000, originalAmount: null, discountPercent: 0 } },
  { name: "패스의 할인 판매가", listPrice: 180000, salePrice: 167400, expected: { amount: 167400, originalAmount: 180000, discountPercent: 7 } },
  { name: "할인율 반올림", listPrice: 30000, salePrice: 28000, expected: { amount: 28000, originalAmount: 30000, discountPercent: 7 } },
  { name: "판매가 0원을 정가로 대체하지 않음", listPrice: 10000, salePrice: 0, expected: { amount: 0, originalAmount: 10000, discountPercent: 100 } },
  { name: "정가 0원에서 0으로 나누지 않음", listPrice: 0, salePrice: 0, expected: { amount: 0, originalAmount: null, discountPercent: 0 } },
  { name: "정가와 판매가가 같으면 할인 표시 없음", listPrice: 40000, salePrice: 40000, expected: { amount: 40000, originalAmount: null, discountPercent: 0 } },
])("$name", ({ listPrice, salePrice, expected }) => {
  expect(getBookPrice({ listPrice, salePrice })).toEqual(expected);
});

test.each([
  { amount: 0, expected: "0원" },
  { amount: 28000, expected: "28,000원" },
  { amount: 167400, expected: "167,400원" },
])("$amount원을 한국어 가격으로 표시한다", ({ amount, expected }) => {
  expect(formatWon(amount)).toBe(expected);
});

import type { Book } from "../../src/features/books/model/book";

// seed와 대조하는 고정 데이터. 앱의 런타임에는 사용하지 않는다.
export const allFixtureBooks: Book[] = [
  {
    "id": "93fefe57-3102-585b-938d-e3f6426d3724",
    "title": "2027 Hidden Kice 시즌5",
    "kind": "single",
    "coverPath": "/images/books/hidden-kice-book-single.webp",
    "listPrice": 28000,
    "salePrice": null
  },
  {
    "id": "03fa7ace-208b-5673-8518-edccc79b74bf",
    "title": "시즌4~9 패스(기하패스!!!)",
    "kind": "pass",
    "coverPath": "/images/books/hidden-kice-book-pass.webp",
    "listPrice": 180000,
    "salePrice": 167400
  },
  {
    "id": "2eb61043-e00a-50f9-8f7a-3164bb10afb3",
    "title": "시즌1~3 패스(미적분, 확통)",
    "kind": "pass",
    "coverPath": "/images/books/hidden-kice-book-pass.webp",
    "listPrice": 120000,
    "salePrice": 114000
  },
  {
    "id": "ad9d9338-3204-5635-9c5e-eac23de875ef",
    "title": "시즌1~9 패스(미적분, 확통)",
    "kind": "pass",
    "coverPath": "/images/books/hidden-kice-book-pass.webp",
    "listPrice": 300000,
    "salePrice": 270000
  },
  {
    "id": "7b53230c-73c5-5a7e-b9f7-54286bff8ef7",
    "title": "2027 Hidden Kice 시즌4",
    "kind": "single",
    "coverPath": "/images/books/hidden-kice-book-single.webp",
    "listPrice": 28000,
    "salePrice": null
  },
  {
    "id": "7de4c88a-fa8b-5b24-bb65-b53fe78cee7e",
    "title": "2027 Hidden Kice 시즌3",
    "kind": "single",
    "coverPath": "/images/books/hidden-kice-book-single.webp",
    "listPrice": 40000,
    "salePrice": null
  },
  {
    "id": "209f6005-91a0-5b39-b17f-409b75129029",
    "title": "2027 Hidden Kice 시즌2",
    "kind": "single",
    "coverPath": "/images/books/hidden-kice-book-single.webp",
    "listPrice": 40000,
    "salePrice": null
  },
  {
    "id": "bdd7e4d6-8e9d-5c6b-8a79-3de1b8530e36",
    "title": "2027 Hidden Kice 시즌1",
    "kind": "single",
    "coverPath": "/images/books/hidden-kice-book-single.webp",
    "listPrice": 40000,
    "salePrice": null
  },
  {
    "id": "decd7fa3-6f47-59b7-99ee-fce3f12723e5",
    "title": "시즌6~7 패스(미적분, 확통)",
    "kind": "pass",
    "coverPath": "/images/books/hidden-kice-book-pass.webp",
    "listPrice": 76000,
    "salePrice": 68400
  },
  {
    "id": "2186eb17-39af-5b83-9d78-1f788a2ac07e",
    "title": "2026 Hidden Kice 시즌7",
    "kind": "single",
    "coverPath": "/images/books/hidden-kice-book-single.webp",
    "listPrice": 40000,
    "salePrice": null
  },
  {
    "id": "a30d7b06-cf11-5be9-a7b3-3faa0b9ef940",
    "title": "2026 Hidden Kice 시즌6",
    "kind": "single",
    "coverPath": "/images/books/hidden-kice-book-single.webp",
    "listPrice": 36000,
    "salePrice": null
  },
  {
    "id": "19a43b4f-ab6f-50a5-8988-d7886d4e0d21",
    "title": "시즌1~7 패스(미적분, 확통)",
    "kind": "pass",
    "coverPath": "/images/books/hidden-kice-book-pass.webp",
    "listPrice": 268000,
    "salePrice": 241200
  },
  {
    "id": "deac2826-e03f-5d12-ad54-a81906679e2e",
    "title": "시즌1~5 패스(미적분, 확통, 기하)",
    "kind": "pass",
    "coverPath": "/images/books/hidden-kice-book-pass.webp",
    "listPrice": 192000,
    "salePrice": 172800
  },
  {
    "id": "f74e9f23-df4d-57f1-9163-1d6bfdb8940d",
    "title": "2026 Hidden Kice 시즌5",
    "kind": "single",
    "coverPath": "/images/books/hidden-kice-book-single.webp",
    "listPrice": 36000,
    "salePrice": null
  },
  {
    "id": "b2dbe358-c56d-5e3b-ae71-1f79c3926f97",
    "title": "2026 Hidden Kice 시즌4",
    "kind": "single",
    "coverPath": "/images/books/hidden-kice-book-single.webp",
    "listPrice": 40000,
    "salePrice": null
  },
  {
    "id": "ca088ebc-8a0f-5ecc-843a-29b8cf70eee4",
    "title": "2026 Hidden Kice 시즌3",
    "kind": "single",
    "coverPath": "/images/books/hidden-kice-book-single.webp",
    "listPrice": 36000,
    "salePrice": null
  },
  {
    "id": "0c2c30c4-7f08-509c-a065-fb81c9cd23a5",
    "title": "2026 Hidden Kice 시즌2",
    "kind": "single",
    "coverPath": "/images/books/hidden-kice-book-single.webp",
    "listPrice": 40000,
    "salePrice": null
  },
  {
    "id": "7abe0afa-fb13-59f8-b47f-5fd4bf1f32f4",
    "title": "2026 Hidden Kice 시즌1",
    "kind": "single",
    "coverPath": "/images/books/hidden-kice-book-single.webp",
    "listPrice": 40000,
    "salePrice": null
  }
];

export const fixtureBooks = allFixtureBooks.slice(0, 12);
export const allBookRows = allFixtureBooks.map((book, index) => ({
  id: book.id,
  title: book.title,
  kind: book.kind,
  cover_path: book.coverPath,
  list_price: book.listPrice,
  sale_price: book.salePrice,
  sort_order: index + 1,
}));
export const bookRows = allBookRows.slice(0, 12);

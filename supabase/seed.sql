-- Catalog seed: 12 single products and 6 passes.
-- Prices are integer KRW; sale_price=null means no discount.
-- Products share cover images by kind.
-- Stable IDs allow re-running this seed without duplicate products.

insert into public.books (id, title, kind, cover_path, list_price, sale_price, sort_order)
values
  ('93fefe57-3102-585b-938d-e3f6426d3724', '2027 Hidden Kice 시즌5', 'single', '/images/books/hidden-kice-book-single.webp', 28000, null, 1),
  ('03fa7ace-208b-5673-8518-edccc79b74bf', '시즌4~9 패스(기하패스!!!)', 'pass', '/images/books/hidden-kice-book-pass.webp', 180000, 167400, 2),
  ('2eb61043-e00a-50f9-8f7a-3164bb10afb3', '시즌1~3 패스(미적분, 확통)', 'pass', '/images/books/hidden-kice-book-pass.webp', 120000, 114000, 3),
  ('ad9d9338-3204-5635-9c5e-eac23de875ef', '시즌1~9 패스(미적분, 확통)', 'pass', '/images/books/hidden-kice-book-pass.webp', 300000, 270000, 4),
  ('7b53230c-73c5-5a7e-b9f7-54286bff8ef7', '2027 Hidden Kice 시즌4', 'single', '/images/books/hidden-kice-book-single.webp', 28000, null, 5),
  ('7de4c88a-fa8b-5b24-bb65-b53fe78cee7e', '2027 Hidden Kice 시즌3', 'single', '/images/books/hidden-kice-book-single.webp', 40000, null, 6),
  ('209f6005-91a0-5b39-b17f-409b75129029', '2027 Hidden Kice 시즌2', 'single', '/images/books/hidden-kice-book-single.webp', 40000, null, 7),
  ('bdd7e4d6-8e9d-5c6b-8a79-3de1b8530e36', '2027 Hidden Kice 시즌1', 'single', '/images/books/hidden-kice-book-single.webp', 40000, null, 8),
  ('decd7fa3-6f47-59b7-99ee-fce3f12723e5', '시즌6~7 패스(미적분, 확통)', 'pass', '/images/books/hidden-kice-book-pass.webp', 76000, 68400, 9),
  ('2186eb17-39af-5b83-9d78-1f788a2ac07e', '2026 Hidden Kice 시즌7', 'single', '/images/books/hidden-kice-book-single.webp', 40000, null, 10),
  ('a30d7b06-cf11-5be9-a7b3-3faa0b9ef940', '2026 Hidden Kice 시즌6', 'single', '/images/books/hidden-kice-book-single.webp', 36000, null, 11),
  ('19a43b4f-ab6f-50a5-8988-d7886d4e0d21', '시즌1~7 패스(미적분, 확통)', 'pass', '/images/books/hidden-kice-book-pass.webp', 268000, 241200, 12),
  ('deac2826-e03f-5d12-ad54-a81906679e2e', '시즌1~5 패스(미적분, 확통, 기하)', 'pass', '/images/books/hidden-kice-book-pass.webp', 192000, 172800, 13),
  ('f74e9f23-df4d-57f1-9163-1d6bfdb8940d', '2026 Hidden Kice 시즌5', 'single', '/images/books/hidden-kice-book-single.webp', 36000, null, 14),
  ('b2dbe358-c56d-5e3b-ae71-1f79c3926f97', '2026 Hidden Kice 시즌4', 'single', '/images/books/hidden-kice-book-single.webp', 40000, null, 15),
  ('ca088ebc-8a0f-5ecc-843a-29b8cf70eee4', '2026 Hidden Kice 시즌3', 'single', '/images/books/hidden-kice-book-single.webp', 36000, null, 16),
  ('0c2c30c4-7f08-509c-a065-fb81c9cd23a5', '2026 Hidden Kice 시즌2', 'single', '/images/books/hidden-kice-book-single.webp', 40000, null, 17),
  ('7abe0afa-fb13-59f8-b47f-5fd4bf1f32f4', '2026 Hidden Kice 시즌1', 'single', '/images/books/hidden-kice-book-single.webp', 40000, null, 18)
on conflict (id) do update set
  title = excluded.title,
  kind = excluded.kind,
  cover_path = excluded.cover_path,
  list_price = excluded.list_price,
  sale_price = excluded.sale_price,
  sort_order = excluded.sort_order;

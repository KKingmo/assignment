-- Public demo catalog. Cart contents stay in the browser.
create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  kind text not null check (kind in ('single', 'pass')),
  cover_path text not null check (length(btrim(cover_path)) > 0),
  list_price integer not null check (list_price >= 0),
  sale_price integer check (sale_price >= 0 and sale_price <= list_price),
  sort_order integer not null default 0
);

alter table public.books enable row level security;

-- Explicit grants complement RLS; the browser can only read this table.
revoke all on table public.books from public, anon, authenticated;
grant select on table public.books to anon;

create policy "Public catalog is readable"
  on public.books
  for select
  to anon
  using (true);

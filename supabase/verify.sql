-- SQL Editor에서 실행하는 카탈로그와 권한 점검. 데이터를 변경하지 않는다.
select
  count(*) as total_books,
  count(*) filter (where kind = 'single') as singles,
  count(*) filter (where kind = 'pass') as passes,
  (select relrowsecurity from pg_class where oid = 'public.books'::regclass) as rls_enabled,
  has_table_privilege('anon', 'public.books', 'SELECT') as anon_select,
  has_table_privilege('anon', 'public.books', 'INSERT') as anon_insert,
  has_table_privilege('anon', 'public.books', 'UPDATE') as anon_update,
  has_table_privilege('anon', 'public.books', 'DELETE') as anon_delete,
  has_table_privilege('authenticated', 'public.books', 'SELECT') as authenticated_select
from public.books;

select policyname, roles, cmd, qual from pg_policies
where schemaname = 'public' and tablename = 'books';

select conname, pg_get_constraintdef(oid) as definition from pg_constraint
where conrelid = 'public.books'::regclass;

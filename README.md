# Hidden Kice

Next.js와 Supabase를 사용하는 교재 스토어 프로젝트다. 디자인 토큰·공통 UI와 반응형 화면을 구성하고, 브라우저에서 Supabase의 교재 목록을 조회한다. 기능별 진행 상태는 [구현 계획](docs/implementation-plan.md), 모듈 책임과 데이터 흐름은 [아키텍처](docs/architecture.md), 토큰과 컴포넌트 적용 기준은 [디자인 시스템](docs/design-system.md)에서 관리한다.

헤더·배너·검색 영역·상품 카드·페이지 이동·푸터를 표시한다. Supabase의 교재 18개를 검색·분류하고 12개 단위로 탐색한다. 검색 조건과 페이지를 URL에 저장해 새로고침·뒤로 가기에서도 복원한다. 로딩·빈 결과·조회 실패·재시도·이미지 실패 상태를 제공한다. 장바구니 담기·수량·합계·삭제와 같은 브라우저의 보관을 제공한다. 캐러셀 동작과 SEO 확장은 아직 연결하지 않았다. 배너는 기존 교재 이미지로 구성한 임시 그래픽으로 원본 이미지 교체가 남아 있다.

## 실행 환경

- Node.js 22.16.0 (`.node-version`)
- npm 10.9.2
- Next.js 16.4.2, React 19.3.1, TypeScript 6.0.3

```bash
npm ci
cp .env.example .env.local
# .env.local에 Supabase 프로젝트 URL과 publishable key를 입력한다.
npm run dev
```

기본 개발 주소는 `http://localhost:3000`이다. fnm을 사용한다면 설치 전에 `fnm use`로 프로젝트의 Node 버전을 선택한다.

```bash
npm run build
npm run start
```

위 명령은 프로덕션 빌드와 실행을 담당한다.

## 환경변수

`.env.example`을 바탕으로 `.env.local`을 구성한다. 환경변수가 없으면 앱 셸은 표시되지만 교재 영역에는 조회 실패 안내가 나타난다.

| 변수 | 용도 |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | 상품 DB의 프로젝트 URL |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | 공개 조회용 키 |
| NEXT_PUBLIC_SITE_URL | 배포 주소와 메타데이터 기준 URL |

로컬 환경변수 파일은 Git에서 제외한다. 브라우저에는 공개용 publishable key만 사용하며 `secret`이나 `service_role` 키를 넣지 않는다. `NEXT_PUBLIC_` 값은 빌드 시 포함되므로 변경 후 개발 서버를 다시 시작하거나 재빌드한다.

## DB 준비

1. Supabase 프로젝트를 생성하고 Data API를 활성화한다.
2. SQL Editor에서 `supabase/migrations/202610190001_create_books.sql`을 한 번 실행한다.
3. `supabase/seed.sql`을 실행한다. 고정 UUID를 기준으로 upsert하므로 재실행해도 상품이 중복되지 않는다.
4. `supabase/verify.sql`로 총 18개·단품 12개·패스 6개, RLS 활성화와 공개 키의 읽기 전용 권한을 확인한다.
5. 프로젝트의 URL과 publishable key를 `.env.local`에 설정한다.

`public.books`는 익명 사용자의 SELECT만 허용하고 INSERT·UPDATE·DELETE는 거부한다. 가격은 원 단위 정수로 저장하며, 할인가는 정가 이하만 허용한다. DB 타입은 `src/lib/supabase/database.types.ts`에 정의하고 실제 컬럼·null 허용 여부와 대조했다. 스키마 변경 시 migration과 타입을 함께 갱신한다.

교재 요청은 `BookCatalog → useBooks → getBooks → Supabase Data API`로 흐른다. `getBooks`가 snake_case 응답을 화면용 `Book`으로 바꾸며, 정확한 전체 개수와 `sort_order, id` 정렬을 요청한다. 초기 HTML에는 상품 데이터가 포함되지 않는다. 캐시는 60초간 신선한 상태로 유지하고, 조회 시간은 15초로 제한한다. 창 포커스 복귀 시 자동 조회와 Query·SDK의 자동 재시도는 끈다.

## 교재 탐색

- 검색어 입력 후 Enter 또는 검색 버튼으로 조회한다. X는 검색어와 페이지를 초기화하고 분류를 유지한다.
- 전체·패스·단품 분류를 바꾸면 검색어를 유지하며 1페이지로 이동한다.
- `/?q=기하&kind=pass`처럼 URL로 조건을 공유한다. 기본값은 생략한다.
- 전체 개수를 기준으로 페이지를 보정하며 조회 실패와 빈 결과를 구분한다. 조건별 캐시와 요청 취소로 이전 응답이 새 목록을 덮지 않게 한다.

## 장바구니

- 상품 이미지 하단의 버튼으로 담고, 같은 상품은 수량을 늘린다. 수량은 1~99개다.
- 헤더 버튼에서 오른쪽 패널을 열어 수량·합계·개별 삭제·전체 비우기를 사용한다.
- localStorage에는 버전·상품 ID·수량만 저장한다. 새로고침과 같은 브라우저 프로필의 재실행 후 복원한다.
- 패널을 열 때마다 ID 목록으로 현재 상품 정보를 조회한다. 실패·오프라인에는 합계를 확정 표시하지 않고, 누락 상품은 소계에서 제외해 안내한다.
- 손상된 저장 데이터와 보관 실패를 처리한다. 브라우저 데이터 삭제나 다른 기기 사이의 동기화는 지원하지 않는다.

## 정적 자산

Pretendard Variable은 `next/font/local`로 제공한다. 폰트 파일과 라이선스는 `src/app/fonts`에 포함한다. SVG 아이콘은 `public/icons`, 단품·패스 이미지는 `public/images/books`에서 제공한다.

## 검증

```bash
npm run lint
npm run typecheck
npm run test:unit
npx playwright install chromium
npm run test:e2e
# 실제 Supabase가 설정된 환경에서 별도로 실행
npm run test:e2e:live
```

`test:e2e`는 실제 DB와 무관한 테스트용 URL·키로 빌드하고 Data API 응답을 가로채 Chromium 테스트를 실행한다. `test:e2e:live`는 실제 환경변수로 다시 빌드하며 응답을 가로채지 않는다. 두 명령은 각각 전용 로컬 서버를 실행하므로 순서대로 실행한다. 동일 포트의 다른 서버를 재사용하지 않는다. HTML 결과와 실패 시 trace·스크린샷은 Git에서 제외한다.

| 명령 | 검증 범위 | 현재 결과 |
| --- | --- | --- |
| npm run lint | Next.js·TypeScript 규칙 | 통과 |
| npm run typecheck | 라우트 타입 생성과 타입 검사 | 통과 |
| npm run test:unit | 가격·URL·API 계약, 장바구니 수량·합계·복구·보관 실패 | 67개 통과 |
| npm run test:e2e | 목록 탐색·실패 복구, 장바구니·가격 갱신·브라우저 재실행·접근성·모바일 | 33개 통과 |
| npm run test:e2e:live | 실제 목록·검색·장바구니 ID 조회와 합계·보관, 공개 키 권한 | 5개 통과 |

단위 테스트는 `tests/unit/**/*.test.ts`에서 탐색한다. 실제 연결 테스트는 `tests/live`에 두며 seed가 적용된 프로젝트를 대상으로 실행한다. 쓰기 거부 검증은 불완전한 INSERT와 존재하지 않는 UUID에 대한 UPDATE·DELETE를 사용해 기존 교재를 변경하지 않는다.

브라우저 검증은 Chromium의 1440px 데스크톱과 768·390·360px 터치 화면을 기준으로 한다. 캡처는 육안 비교용이며 픽셀 스냅샷 비교는 포함하지 않는다. 장바구니는 520px 데스크톱 패널과 390·360px 터치 화면에서 검증한다. 보관 테스트는 전용 임시 브라우저 프로필을 실제로 종료한 뒤 재실행하며, 테스트 종료 후 해당 프로필을 정리한다. 캐러셀·SEO 정책과 배포 환경 검증은 각 기능 구현에 맞춰 추가한다.

### 의존성 점검

2026-10-19 기준 `npm audit --omit=dev` 결과는 취약점 0건이다. 전체 의존성에는 ESLint의 `braces` 의존 경로에서 high 경고 5건이 남아 있다. `braces`의 수정 버전은 배포되지 않았으며, 자동 수정이 제안하는 Next.js ESLint 설정의 메이저 다운그레이드는 적용하지 않았다.

ESLint 9와 TypeScript 6은 현재 Next.js ESLint 플러그인의 호환 범위에 맞춰 고정했다. 플러그인의 지원 범위와 수정 버전을 확인한 뒤 함께 갱신한다.

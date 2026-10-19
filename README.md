# Assignment

Next.js와 Supabase를 사용하는 교재 스토어 프로젝트다. 디자인 토큰·공통 UI와 반응형 화면을 구성하고, 브라우저에서 Supabase의 교재 목록을 조회한다. 기능별 진행 상태는 [구현 계획](docs/implementation-plan.md), 모듈 책임과 데이터 흐름은 [아키텍처](docs/architecture.md), 토큰과 컴포넌트 적용 기준은 [디자인 시스템](docs/design-system.md)에서 관리한다.

저장소: [KKingmo/assignment](https://github.com/KKingmo/assignment). 로컬 프로덕션 모드의 통합 검증을 완료했으며 Vercel 배포와 공개 주소 검증은 8단계에서 진행한다.

헤더·배너·검색 영역·상품 카드·페이지 이동·푸터를 표시한다. Supabase의 교재 18개를 검색·분류하고 12개 단위로 탐색한다. 검색 조건과 페이지를 URL에 저장해 새로고침·뒤로 가기에서도 복원한다. 로딩·빈 결과·조회 실패·재시도·이미지 실패 상태를 제공한다. 장바구니 담기·수량·합계·삭제와 같은 브라우저의 보관을 제공한다. 배너는 5개 번호를 자동·수동으로 순환하며 hover·포커스·동작 줄이기 설정을 처리한다. 페이지별 서버 메타데이터와 탐색 URL의 색인 정책을 제공한다.

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

| 변수                                 | 용도                            |
| ------------------------------------ | ------------------------------- |
| NEXT_PUBLIC_SUPABASE_URL             | 상품 DB의 프로젝트 URL          |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | 공개 조회용 키                  |
| NEXT_PUBLIC_SITE_URL                 | 배포 주소와 메타데이터 기준 URL |

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

## 캐러셀과 SEO

배너는 동일 이미지와 문구를 사용하며 1~5의 현재 번호를 표시한다. 5초 간격 자동 재생, 이전·다음 순환, 정지·재개를 제공한다. 마우스를 올리거나 내부 요소에 포커스를 두면 잠시 멈추고, 브라우저 탭이 숨겨진 동안에도 재생하지 않는다. 동작 줄이기 설정에서는 정지 상태로 시작한다.

데스크톱에서는 배너 전체에 이어지는 배경 위에 문구를 배치하고 모바일에서는 문구 아래로 교재 이미지를 옮긴다. 조작부는 오른쪽 아래에 배치한다. Embla Carousel로 터치·마우스 이동을 실시간 반영하며 세로 스크롤과 구분한다. CTA를 제외한 배너 전체에서 드래그를 시작할 수 있고 전환 중 재조작도 가능하다. 조작부의 클릭과 키보드 기능은 유지하며 동작 줄이기 설정에서는 추가 관성 없이 정렬한다.

제목·설명·canonical·Open Graph·Twitter 미리보기는 서버 HTML에 포함한다. 페이지 번호를 제목과 canonical에 반영하고, 검색·분류 URL에는 `noindex, follow`를 적용한다. Native History로 이동할 때도 같은 메타데이터 규칙을 사용한다. 페이지 번호는 실제 `href`를 가진 링크이며 새 탭으로 열 수 있다.

`NEXT_PUBLIC_SITE_URL`에는 최종 공개 주소를 설정한다. 공개 주소를 사용하는 Production 빌드만 기본 목록을 색인 대상으로 두며, 개발 환경·로컬 주소·Vercel Preview는 색인에서 제외한다. robots.txt는 noindex를 읽도록 크롤링을 허용하고 sitemap에는 공개 루트 주소만 넣는다. Preview·로컬 환경의 sitemap은 비어 있다. 상품 개수 확인이나 SEO를 위한 서버 상품 조회는 하지 않는다.

교재 본문은 CSR이므로 검색 엔진의 JavaScript 렌더링 여부에 따라 색인에 제약이 있다. 상품별 검색 노출이나 상세 페이지의 구조화 데이터는 포함하지 않는다.

## 정적 자산

Pretendard Variable은 `next/font/local`로 제공한다. 폰트 파일과 라이선스는 `src/app/fonts`에 포함한다. SVG 아이콘은 `public/icons`, 단품·패스 이미지는 `public/images/books`, 배너는 `public/images/banners`에서 제공한다. 배너 이미지 영역은 미리 확보하고 `next/image`로 첫 화면 이미지를 preload한다.

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

`test:e2e`는 실제 DB와 무관한 테스트용 Supabase URL·키, `https://store.example.test` 기준 주소로 빌드하고 Data API 응답을 가로채 Chromium 테스트를 실행한다. `test:e2e:live`는 실제 환경변수로 다시 빌드하며 응답을 가로채지 않는다. 두 명령은 각각 전용 로컬 서버를 실행하므로 순서대로 실행한다. 동일 포트의 다른 서버를 재사용하지 않는다. HTML 결과와 실패 시 trace·스크린샷은 Git에서 제외한다.

2026-10-19 실행 결과다. 환경·시나리오·검증 범위는 [통합 검증 기록](docs/verification.md)에 정리했다. 두 Playwright 명령은 각각 프로덕션 빌드와 서버 시작을 포함하며 모두 성공했다.

| 명령                  | 검증 범위                                                          | 현재 결과 |
| --------------------- | ------------------------------------------------------------------ | --------- |
| npm run lint          | Next.js·TypeScript 규칙                                            | 통과      |
| npm run typecheck     | 라우트 타입 생성과 타입 검사                                       | 통과      |
| npm run test:unit     | 가격·URL·API 계약, 장바구니·보관 실패, 메타데이터·환경별 색인 규칙 | 80개 통과 |
| npm run test:e2e      | 목록·장바구니·보관·실패 복구, 캐러셀·서버 HTML SEO·접근성·모바일   | 53개 통과 |
| npm run test:e2e:live | 실제 목록·검색·장바구니 ID 조회와 합계·보관, 공개 키 권한          | 5개 통과  |

단위 테스트는 `tests/unit/**/*.test.ts`에서 탐색한다. 실제 연결 테스트는 `tests/live`에 두며 seed가 적용된 프로젝트를 대상으로 실행한다. 쓰기 거부 검증은 불완전한 INSERT와 존재하지 않는 UUID에 대한 UPDATE·DELETE를 사용해 기존 교재를 변경하지 않는다.

검증 브라우저는 Chromium이며 모바일은 터치 에뮬레이션을 사용한다. 화면 캡처는 육안 확인용으로, 픽셀 스냅샷 비교나 실기기 검증은 포함하지 않는다. Preview 색인 정책은 단위 테스트로 검증하며 실제 배포 주소와 공유 미리보기는 배포 후 확인한다.

### 의존성 점검

2026-10-19 기준 `npm audit --omit=dev` 결과는 취약점 0건이다. 전체 의존성에는 ESLint의 `braces` 의존 경로에서 high 경고 5건이 남아 있다. `braces`의 수정 버전은 배포되지 않았으며, 자동 수정이 제안하는 Next.js ESLint 설정의 메이저 다운그레이드는 적용하지 않았다.

ESLint 9와 TypeScript 6은 현재 Next.js ESLint 플러그인의 호환 범위에 맞춰 고정했다. 플러그인의 지원 범위와 수정 버전을 확인한 뒤 함께 갱신한다.

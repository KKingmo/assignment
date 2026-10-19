# Assignment | 교재 스토어

**[서비스 바로가기](https://assignment-seven-livid.vercel.app)** · [GitHub](https://github.com/KKingmo/assignment)

Figma 시안을 바탕으로 구현한 Next.js 교재 스토어입니다. Supabase의 교재 18개를 CSR로 조회하며, 검색·분류·페이지 이동부터 장바구니 보관까지 연결했습니다. 데스크톱 화면과 기본 반응형, 디자인 토큰, 키보드 조작, 로딩·오류 복구를 함께 구성했습니다.

[아키텍처와 데이터 흐름](docs/architecture.md) · [디자인 시스템](docs/design-system.md) · [검증 기록](docs/verification.md) · [구현 계획](docs/implementation-plan.md)

## 주요 기능

| 영역 | 구현 내용 |
| --- | --- |
| 교재 탐색 | 전체·패스·단품 분류, 300ms 디바운스 자동 검색, Enter·검색 버튼 즉시 조회, X 초기화, 12개 단위 페이지 이동 |
| 상태 복원 | 검색어·분류·페이지를 URL에 반영하고 새로고침·뒤로 가기에서 복원 |
| 장바구니 | 상품 담기와 토스트, 수량 변경·합계·개별 삭제·전체 비우기, 같은 브라우저의 재실행 후 복원 |
| 캐러셀 | 동일 이미지의 5개 슬라이드, 5초 자동 재생, 이전·다음·정지, 마우스 드래그·터치 스와이프 |
| 반응형·접근성 | 모바일 레이아웃, 포커스 표시, 장바구니 포커스 순환·Escape 닫기, 동작 줄이기 설정 대응 |
| SEO | 서버 HTML의 제목·설명·canonical·OG·Twitter 메타데이터, robots.txt·sitemap.xml, 검색·분류 URL의 색인 제외 |

캐러셀은 마우스 hover·내부 포커스·탭 비활성화 시 자동 재생을 멈춥니다. CTA를 제외한 배너 전체를 잡아 이동할 수 있으며, 전환 중에도 다시 조작할 수 있습니다. 목록은 로딩·빈 결과·조회 실패·재시도를 구분합니다.

검색은 입력을 멈춘 뒤 300ms 후 적용하며 한글 조합 중에는 요청하지 않습니다. 자동 검색은 현재 URL만 갱신해 중간 입력을 브라우저 이력에 쌓지 않습니다. 검색어 변경 시 분류를 유지하고 1페이지로 이동하며, X 초기화·뒤로 가기에서는 예약된 검색을 취소합니다.

## 설계 선택

**기능 단위로 책임을 나눴습니다.** 교재 조회와 탐색은 `features/books`, 장바구니 규칙과 보관은 `features/cart`에 배치했습니다. 각 기능 내부에서 API·상태와 규칙·UI를 분리하고, 두 기능에서 쓰는 기본 UI와 외부 서비스 연결만 공통 영역에 둡니다.

**상태의 수명에 따라 저장 위치를 구분했습니다.** 공유·복원할 탐색 조건은 URL, 서버 응답은 TanStack Query, 장바구니의 상품 ID·수량은 localStorage에서 관리합니다. 조건별 query key와 요청 취소를 적용해 이전 검색 응답이 새 목록을 덮지 않도록 했습니다.

**장바구니 가격은 저장된 값을 신뢰하지 않습니다.** 패널을 열 때 ID로 현재 상품 정보를 다시 조회합니다. 조회 실패·오프라인에는 합계를 확정 표시하지 않고, 삭제된 상품은 합계에서 제외해 안내합니다. 저장 형식 버전과 수량 범위를 검사하며 최초 복구 전에 빈 상태를 덮어쓰지 않습니다.

**화면의 반복 규칙을 토큰과 컴포넌트에 담았습니다.** 색상·간격·타이포의 기본 토큰과 용도별 의미 토큰을 구분하고 Button·IconButton·TextField·Badge에 적용했습니다. CSS Modules로 기능별 스타일을 관리하며 Pretendard는 로컬 폰트로 제공합니다.

**CSR 요구사항과 메타데이터 생성을 분리했습니다.** 교재 데이터는 브라우저에서 Supabase Data API로 요청합니다. 메타데이터는 서버에서 생성하며 CSR 탐색 후에도 같은 URL 규칙으로 동기화합니다. 상품 본문의 색인은 검색 엔진의 JavaScript 렌더링 여부에 영향을 받습니다.

```text
src/
├─ app/                  페이지 조합, 전역 Provider, 서버 메타데이터
├─ features/
│  ├─ books/
│  │  ├─ api/            목록·ID 조회와 응답 변환
│  │  ├─ model/          조회 훅, URL 조건, 가격·SEO 규칙
│  │  └─ ui/             검색·분류·카드·페이지 이동
│  └─ cart/
│     ├─ model/          수량·합계·보관·상품 재조회
│     └─ ui/             담기 버튼·토스트·장바구니 패널
├─ components/           공통 UI, 헤더·푸터, 캐러셀
├─ styles/               디자인 토큰
└─ lib/                  Supabase 클라이언트·DB 타입, 사이트 SEO 설정
supabase/                migration·seed·검증 SQL
tests/                   단위 테스트·제어된 응답 E2E·실제 연결 E2E
```

목록 데이터는 `BookCatalog → useBooks → getBooks → Supabase → BookGrid`로 흐릅니다. API 계층이 DB 응답을 화면용 `Book`으로 변환하므로 UI가 DB 컬럼명에 직접 의존하지 않습니다. 테이블 제약과 모듈 간 의존 방향은 [아키텍처](docs/architecture.md)에 정리했습니다.

## 기술 구성

| 용도 | 사용 기술 |
| --- | --- |
| 앱 | Next.js 16.4.2 App Router, React 19.3.1, TypeScript 6.0.3 |
| 데이터 | Supabase PostgreSQL·Data API, TanStack Query 5 |
| 화면 | CSS Modules·CSS Custom Properties, Pretendard, Embla Carousel 8 |
| 검증·배포 | Vitest 5, Playwright 1.64, Vercel·GitHub |

## 로컬 실행

Node.js **22.16.0**과 npm **10.9.2**를 사용합니다. fnm을 사용한다면 `fnm use`로 `.node-version`의 버전을 선택합니다.

```bash
npm ci
cp .env.example .env.local
# .env.local에 아래 환경 변수를 설정합니다.
npm run dev
```

개발 주소는 `http://localhost:3000`입니다. 프로덕션 모드는 `npm run build` 후 `npm run start`로 실행합니다.

| 환경 변수 | 값 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공개 조회용 publishable key |
| `NEXT_PUBLIC_SITE_URL` | 로컬은 `http://localhost:3000`, 배포는 최종 공개 주소 |

`.env.local`은 Git에서 제외합니다. 브라우저에 포함되는 `NEXT_PUBLIC_` 변수에는 `secret`·`service_role` 키를 사용하지 않습니다. 환경 변수를 변경하면 개발 서버 재시작 또는 재빌드가 필요합니다.

### DB 준비

1. Supabase 프로젝트에서 Data API를 활성화합니다.
2. SQL Editor에서 [migration](supabase/migrations/202610190001_create_books.sql)을 한 번 실행합니다.
3. [seed](supabase/seed.sql)를 실행합니다. 고정 UUID로 upsert하므로 재실행해도 중복되지 않습니다.
4. [검증 SQL](supabase/verify.sql)로 전체 18개·단품 12개·패스 6개와 RLS·권한을 확인합니다.
5. 프로젝트 URL과 publishable key를 `.env.local`에 설정합니다.

`public.books`는 익명 사용자의 SELECT만 허용하고 INSERT·UPDATE·DELETE는 거부합니다. 가격은 원 단위 정수이며 할인가는 정가 이하로 제한합니다. 스키마를 변경하면 migration과 `src/lib/supabase/database.types.ts`를 함께 갱신합니다.

## 테스트

```bash
npm run lint
npm run typecheck
npm run test:unit
npx playwright install chromium
npm run test:e2e
npm run test:e2e:live
```

일반 E2E는 Supabase 응답을 제어해 실패·지연·가격 변경을 재현합니다. 실제 연결 E2E는 `.env.local`의 Supabase와 seed 데이터를 사용하며 응답을 가로채지 않습니다. 두 명령은 각각 프로덕션 빌드와 전용 로컬 서버 실행을 포함하므로 순서대로 실행합니다.

| 검증 | 로컬 프로덕션 | Vercel 공개 배포 |
| --- | --- | --- |
| ESLint·TypeScript | 통과 | — |
| Vitest | 80개 통과 | — |
| Playwright · 제어된 응답 | 60개 통과 | 최초 배포 53개, 자동 검색 변경 7개 통과 |
| Playwright · 실제 Supabase | 5개 통과 | 5개 통과 |

2026-10-19 최종 실행 결과 기준입니다. 로컬 전체 E2E는 자동 검색의 7개 시나리오를 포함합니다. 공개 배포의 자동 검색 변경에는 7개 시나리오와 실제 Supabase 연결 5개를 다시 실행했습니다. 로그인 정보 없이 검증했으며 초기 배포와 변경 검증의 범위는 [검증 기록](docs/verification.md)에 구분했습니다.

공개 배포에 같은 테스트를 실행하려면 `PLAYWRIGHT_BASE_URL`을 지정합니다. 이 경우 로컬 빌드·서버 시작을 생략하고 배포된 앱을 검사합니다.

```bash
PLAYWRIGHT_BASE_URL=https://assignment-seven-livid.vercel.app npm run test:e2e -- --workers=4
PLAYWRIGHT_BASE_URL=https://assignment-seven-livid.vercel.app npm run test:e2e:live -- --workers=2
```

실제 연결 테스트의 쓰기 거부 검사는 불완전한 INSERT와 존재하지 않는 UUID의 UPDATE·DELETE를 사용해 기존 교재를 변경하지 않습니다. 검증한 흐름과 실행 범위는 [검증 기록](docs/verification.md)을 참고해 주세요.

## 배포와 범위

Vercel의 `assignment` 프로젝트에 GitHub `main` 브랜치를 연결했습니다. Production·Preview에 Supabase 공개 설정과 사이트 주소를 등록했으며, `main`에 push하면 Production 빌드가 실행됩니다. 공개 Production만 기본 목록을 색인 대상으로 두고 Preview는 `noindex`와 빈 sitemap을 사용합니다.

헤더 메뉴는 hover·활성 상태를 보여주는 UI이며 상세 페이지·회원 인증·주문·결제는 구현 범위에 포함하지 않습니다. 장바구니는 같은 브라우저 프로필에 보관하며 기기 간 동기화는 지원하지 않습니다. 테스트 브라우저는 Chromium이고 모바일은 터치 에뮬레이션으로 검증했습니다. 실기기·다른 브라우저·픽셀 스냅샷 비교와 검색 엔진의 실제 색인 결과는 검증 범위에 포함하지 않습니다.

의존성 점검에서는 2026-10-19 기준 런타임 취약점이 0건이며 ESLint의 `braces` 의존 경로에 개발 의존성 high 경고 5건이 남아 있습니다. 세부 결과와 대응 범위는 [검증 기록](docs/verification.md)에 정리했습니다.

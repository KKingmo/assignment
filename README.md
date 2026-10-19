# Assignment | Hіddеn Kісе

**[배포 사이트](https://assignment-seven-livid.vercel.app)** · **[GitHub 저장소](https://github.com/KKingmo/assignment)**

제공된 Figma 시안을 바탕으로 구현한 Next.js 교재 스토어입니다. 화면에 보이는 헤더·배너·교재 목록·푸터를 중심으로 구성하고, Supabase에 저장한 더미 교재 정보를 브라우저에서 조회해 표시합니다. 데스크톱 화면과 기본 반응형을 지원하며 검색·분류·페이지 이동·장바구니 기능을 구현했습니다.

## 과제 요구사항과 구현

| 요구사항                    | 구현 내용                                                                 | 확인 위치                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js 사용                | App Router 기반 페이지 구성, TypeScript 적용                              | [src/app](src/app), [package.json](package.json)                                                                                            |
| 제공된 화면 중심 구현       | 헤더·배너·상품 카드·검색·분류·페이지 이동·푸터, 디자인 토큰과 반응형 적용 | [화면 구성](src/app/page.tsx), [디자인 시스템](docs/design-system.md)                                                                       |
| GitHub 및 Vercel 배포       | GitHub 저장소와 Vercel 프로젝트 연결, 공개 URL 제공                       | 상단 저장소·배포 링크                                                                                                                       |
| Supabase 더미 데이터 및 CSR | 교재 18개를 DB에 저장하고 브라우저에서 목록·검색·분류 결과 조회           | [DB 스키마](supabase/migrations/202610190001_create_books.sql), [seed](supabase/seed.sql), [조회 훅](src/features/books/model/use-books.ts) |
| 확장 가능한 폴더 구조       | 기능별로 API·모델·UI를 구분하고 공통 UI와 외부 서비스 연결을 분리         | [폴더 구조와 설계](#폴더-구조와-설계), [아키텍처](docs/architecture.md)                                                                     |

## 주요 기능

| 영역           | 동작                                                                                   |
| -------------- | -------------------------------------------------------------------------------------- |
| 교재 탐색      | 상품명 검색, 전체·패스·단품 필터, 12개 단위 페이지 이동, 정가·판매가·할인율 표시       |
| 자동 검색      | 마지막 입력 후 300ms 디바운스, Enter·검색 버튼 즉시 실행, X 초기화                     |
| 탐색 조건 복원 | 검색어·분류·페이지를 URL에 반영하고 새로고침·뒤로 가기에서 복원                        |
| 장바구니       | 담기 알림, 수량 변경, 합계, 개별 삭제·전체 비우기, 같은 브라우저의 재실행 후 복원      |
| 캐러셀         | 동일 이미지의 5개 슬라이드, 자동·수동 이동, 드래그·스와이프, hover·포커스 시 일시 정지 |
| 조회 상태      | 로딩 스켈레톤, 빈 결과, 오류 안내와 재시도, 범위를 벗어난 페이지 보정                  |
| 화면·접근성    | 반응형 그리드, Pretendard, 키보드 포커스 표시, 장바구니 포커스 순환·Escape 닫기        |
| SEO            | 서버 메타데이터, canonical·OG·Twitter, robots.txt·sitemap.xml                          |

검색창에 포커스와 한글 조합이 유지되어도 입력을 멈추면 자동 검색합니다. 자동 검색은 현재 URL을 교체해 중간 입력을 브라우저 이력에 쌓지 않습니다. 검색어를 변경하면 선택한 분류를 유지하고 1페이지로 이동합니다.

헤더 메뉴는 hover·활성 상태를 표현하는 UI입니다. 상품 상세·회원 인증·주문·결제·재고 관리는 구현 범위에 포함하지 않습니다. 장바구니는 같은 브라우저 프로필에 보관하며 기기 간 동기화는 지원하지 않습니다.

## 기술 구성

| 용도            | 기술                                                           |
| --------------- | -------------------------------------------------------------- |
| 프레임워크·언어 | Next.js 16 App Router, React 19, TypeScript                    |
| DB·서버 상태    | Supabase PostgreSQL·Data API, TanStack Query                   |
| 화면            | CSS Modules, CSS Custom Properties, Pretendard, Embla Carousel |
| 테스트          | Vitest, Playwright                                             |
| 저장소·배포     | GitHub, Vercel                                                 |

정확한 버전은 [package.json](package.json)과 [package-lock.json](package-lock.json)에 고정했습니다.

## 로컬 실행

Node.js **22.16.0**, npm **10.9.2**를 사용합니다. Node 버전은 [.node-version](.node-version)에 지정되어 있습니다.

```bash
npm ci
cp .env.example .env.local
```

Supabase 프로젝트를 준비한 뒤 `.env.local`에 다음 값을 설정합니다.

| 환경 변수                              | 설정 값                                                 |
| -------------------------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase 프로젝트 URL                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공개 조회용 publishable key                             |
| `NEXT_PUBLIC_SITE_URL`                 | 로컬은 `http://localhost:3000`, 배포는 공개 사이트 주소 |

### Supabase 초기화

1. Supabase 프로젝트의 Data API를 활성화합니다.
2. SQL Editor에서 [migration](supabase/migrations/202610190001_create_books.sql)을 한 번 실행해 테이블과 권한 정책을 생성합니다.
3. [seed.sql](supabase/seed.sql)을 실행해 단품 12개·패스 6개를 등록합니다. 고정 UUID로 upsert하므로 재실행해도 중복되지 않습니다.
4. [verify.sql](supabase/verify.sql)로 데이터·제약·접근 권한을 확인합니다.

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다. 프로덕션 모드는 `npm run build` 후 `npm run start`로 실행합니다.

`.env.local`은 Git에서 제외합니다. 브라우저에 포함되는 환경 변수에는 `secret`·`service_role` 키를 사용하지 않습니다. 공개 조회는 테이블 권한과 RLS 정책으로 제한하며, 환경 변수 변경 후에는 개발 서버를 재시작하거나 재빌드해야 합니다.

## 폴더 구조와 설계

```text
src/
├─ app/                     페이지 조합, 전역 Provider, 메타데이터
├─ features/
│  ├─ books/
│  │  ├─ api/               Supabase 목록·ID 조회, 응답 변환
│  │  ├─ model/             교재 타입, 조회 훅, URL 조건, 가격·SEO 규칙
│  │  └─ ui/                검색·분류·카드·목록·페이지 이동
│  └─ cart/
│     ├─ model/             수량·합계 규칙, 보관·복구, 현재 상품 조회
│     └─ ui/                담기 버튼, 장바구니 패널·항목
├─ components/
│  ├─ ui/                   Button, IconButton, TextField, Badge
│  ├─ layout/               헤더·푸터
│  └─ home/                 배너 캐러셀
├─ styles/                  디자인 토큰
└─ lib/                     Supabase 클라이언트·DB 타입, 사이트 SEO 설정
supabase/                   migration, seed, 검증 SQL
tests/
├─ unit/                    가격·조회·URL·장바구니 규칙
├─ e2e/                     응답을 제어하는 사용자 흐름 테스트
└─ live/                    실제 Supabase 연결 테스트
```

### 기능별 변경 범위

교재 탐색은 `features/books`, 장바구니는 `features/cart`에서 관리합니다. 각 기능 안에서 `api`는 데이터 접근, `model`은 상태와 규칙, `ui`는 화면과 이벤트 연결을 담당합니다. 장바구니에는 별도 서버 저장 API가 없으므로 `api` 폴더를 만들지 않았습니다.

교재 조회 방식이 바뀌면 `books/api`, 가격 규칙이 바뀌면 `books/model`, 카드 배치가 바뀌면 `books/ui`에서 수정합니다. DB 응답은 조회 경계에서 화면용 `Book` 타입으로 변환하므로 표시 컴포넌트가 DB 컬럼명에 직접 의존하지 않습니다. 장바구니는 교재의 ID 조회와 가격 규칙을 재사용합니다.

상품 상세가 추가되면 교재 기능 안에서 조회와 UI를 확장하고, 주문처럼 별도 규칙과 상태를 갖는 기능은 독립된 기능 폴더로 추가할 수 있습니다. 현재 화면에 필요한 책임을 기준으로 나누고, 범용 Repository·공통 CRUD 계층은 추가하지 않았습니다.

### 상태의 저장 위치

| 상태                      | 관리 위치                | 선택 이유                                |
| ------------------------- | ------------------------ | ---------------------------------------- |
| 적용된 검색어·분류·페이지 | URL                      | 공유·새로고침·뒤로 가기에서 복원         |
| 입력 중인 검색어          | 검색창 로컬 상태         | 입력과 디바운스 조회 시점 분리           |
| 교재·전체 개수·조회 상태  | TanStack Query           | 조건별 캐시와 요청 수명 관리             |
| 장바구니 상품 ID·수량     | 공유 상태 + localStorage | 화면 간 동기화와 브라우저 재실행 후 복구 |
| 패널 열림 등 표시 상태    | 해당 UI                  | 데이터 조회와 무관한 상호작용 관리       |

장바구니에는 가격을 저장하지 않습니다. 패널을 열 때 상품 ID로 현재 정보를 다시 조회하고 합계를 계산합니다. 가격 조회 실패·상품 누락·저장소 접근 실패는 별도 상태로 안내합니다.

### 디자인 토큰과 공통 UI

[tokens.css](src/styles/tokens.css)에서 색상·간격·타이포의 기본 값과 용도별 의미 토큰을 구분했습니다. 공통 버튼과 입력창은 의미 토큰을 사용하고, 교재·장바구니 규칙에는 의존하지 않습니다. 기능별 배치는 CSS Modules로 관리하며 Pretendard는 로컬 폰트로 제공합니다. 토큰 값과 반응형 기준은 [디자인 시스템](docs/design-system.md)에 정리했습니다.

## CSR 데이터 흐름

```mermaid
flowchart LR
    A[검색·분류·페이지 조작] --> B[URL 조회 조건]
    B --> C[BookCatalog / useBooks]
    C --> D[getBooks]
    D --> E[Supabase Data API]
    E --> F[Book 타입으로 변환]
    F --> G[BookGrid / BookCard]
```

초기 HTML에는 페이지 구조와 메타데이터를 포함하고, 교재 데이터의 서버 조회나 prefetch는 수행하지 않습니다. 브라우저에서 `useBooks`가 검색어·분류·페이지를 포함한 query key로 조회하고, Supabase에서 조건에 맞는 교재와 전체 개수를 반환받아 목록을 표시합니다.

조건이 바뀌면 새 query key의 결과를 구독하고 이전 요청에는 취소 신호를 전달합니다. 응답을 조건별로 분리해 늦게 도착한 이전 검색 결과가 현재 목록을 덮지 않도록 했습니다. 로딩·빈 결과·오류는 구분하며, 오류를 결과 0건으로 처리하지 않습니다.

`public.books`는 상품 ID·이름·분류·이미지 경로·정가·판매가·노출 순서를 저장합니다. 가격은 원 단위 정수이며 판매가는 정가 이하로 제한합니다. 할인율과 장바구니 합계는 저장하지 않고 계산합니다. 익명 사용자는 SELECT만 허용하며 INSERT·UPDATE·DELETE 권한은 부여하지 않습니다.

메타데이터는 서버에서 생성하지만 교재 본문은 CSR이므로, 상품 내용의 색인은 검색 엔진의 JavaScript 렌더링 여부에 영향을 받습니다. 상세한 요청 흐름·스키마·실패 복구 규칙은 [아키텍처](docs/architecture.md)를 참고해 주세요.

## 검증

```bash
npm run lint
npm run typecheck
npm run test:unit
npx playwright install chromium
npm run test:e2e
npm run test:e2e:live
```

| 구분                 | 검증 범위                                                                           |
| -------------------- | ----------------------------------------------------------------------------------- |
| Vitest               | 가격 계산, 조회 계약, URL 조건, 장바구니 규칙·저장 형식, SEO 정책                   |
| Playwright E2E       | 검색·분류·페이지 이동, 장바구니, 캐러셀, 반응형, 키보드 조작, 지연·실패·복구        |
| Playwright 실제 연결 | 초기 HTML과 CSR 결과 구분, 실제 Supabase 데이터·검색·합계, 공개 키의 조회·쓰기 권한 |

일반 E2E는 Supabase 응답을 제어하고, 실제 연결 E2E는 `.env.local`의 프로젝트와 seed 데이터를 사용합니다. 두 E2E 명령은 각각 프로덕션 빌드와 전용 로컬 서버 실행을 포함하므로 순서대로 실행합니다.

한글 조합 중 자동 검색 수정과 로고 자간 변경을 포함해 린트·타입 검사, Vitest 80개, 로컬 프로덕션 E2E 60개가 통과했습니다. 공개 배포에서도 E2E 60개와 실제 Supabase 연결 5개가 통과했습니다. 한글 검색은 포커스와 조합 영역을 유지한 채 조회하고 이어서 입력하는 흐름을 검사합니다. 커밋·환경별 실행 결과와 검증 한계는 [검증 기록](docs/verification.md)에 구분했습니다.

Chromium과 모바일 터치 에뮬레이션으로 검증했습니다. Safari·Firefox·모바일 실기기와 픽셀 단위 동일성은 검증 범위에 포함하지 않습니다.

## 배포

Vercel의 `assignment` 프로젝트에 GitHub `main` 브랜치를 연결했습니다. 빌드 시 Supabase 공개 설정과 `NEXT_PUBLIC_SITE_URL`을 적용합니다. Production은 기본 목록을 색인 대상으로 두고, Preview는 `noindex`와 빈 sitemap을 사용합니다.

배포된 앱을 검증하려면 `PLAYWRIGHT_BASE_URL`을 지정합니다. 이 경우 로컬 빌드·서버 실행을 생략합니다.

```bash
PLAYWRIGHT_BASE_URL=https://assignment-seven-livid.vercel.app npm run test:e2e -- --workers=4
PLAYWRIGHT_BASE_URL=https://assignment-seven-livid.vercel.app npm run test:e2e:live -- --workers=2
```

## 관련 문서

- [아키텍처](docs/architecture.md): 모듈 책임, CSR 데이터 흐름, 상태 관리, DB 스키마
- [디자인 시스템](docs/design-system.md): 디자인 토큰, 공통 UI, 반응형·접근성 기준
- [검증 기록](docs/verification.md): 로컬·배포 환경의 실행 결과와 검증 범위
- [구현 계획](docs/implementation-plan.md): 단계별 구현 항목과 완료 기준

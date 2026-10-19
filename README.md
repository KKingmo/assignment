# Hidden Kice

Next.js와 Supabase를 사용하는 교재 스토어 프로젝트다. 현재 앱 셸, 로컬 폰트와 정적 자산, 타입 검사·린트·테스트 실행 환경을 구성했다. 기능별 진행 상태는 [구현 계획](docs/implementation-plan.md), 모듈 책임과 데이터 흐름은 [아키텍처](docs/architecture.md)에서 관리한다.

## 실행 환경

- Node.js 22.16.0 (`.node-version`)
- npm 10.9.2
- Next.js 16.4.2, React 19.3.1, TypeScript 6.0.3

```bash
npm ci
npm run dev
```

기본 개발 주소는 `http://localhost:3000`이다. fnm을 사용한다면 설치 전에 `fnm use`로 프로젝트의 Node 버전을 선택한다.

```bash
npm run build
npm run start
```

위 명령은 프로덕션 빌드와 실행을 담당한다.

## 환경변수

현재 앱 셸은 환경변수 없이 실행된다. 교재 조회와 배포를 연결할 때 `.env.example`을 바탕으로 `.env.local`을 구성한다.

| 변수 | 용도 |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | 상품 DB의 프로젝트 URL |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | 공개 조회용 키 |
| NEXT_PUBLIC_SITE_URL | 배포 주소와 메타데이터 기준 URL |

로컬 환경변수 파일은 Git에서 제외한다. Supabase의 테이블·권한은 `supabase/migrations`, 상품 18개의 초기 데이터는 `supabase/seed.sql`에서 관리한다. 스키마 적용과 앱의 데이터 조회 연결은 진행 전이다.

## 정적 자산

Pretendard Variable은 `next/font/local`로 제공한다. 폰트 파일과 라이선스는 `src/app/fonts`에 포함한다. SVG 아이콘은 `public/icons`, 단품·패스 이미지는 `public/images/books`에서 제공한다.

## 검증

```bash
npm run lint
npm run typecheck
npm run test:unit:list
npx playwright install chromium
npm run test:e2e
```

`test:e2e`는 프로덕션 빌드 후 전용 로컬 서버에서 Chromium 테스트를 실행한다. 동일 포트의 다른 서버를 재사용하지 않는다. HTML 결과와 실패 시 trace·스크린샷은 Git에서 제외한다.

| 명령 | 검증 범위 | 현재 결과 |
| --- | --- | --- |
| npm run lint | Next.js·TypeScript 규칙 | 통과 |
| npm run typecheck | 라우트 타입 생성과 타입 검사 | 통과 |
| npm run test:unit:list | Vitest 설정과 테스트 탐색 | 설정 로드 성공, 단위 테스트 0개 |
| npm run test:e2e | 프로덕션 빌드·한국어 문서·폰트·정적 자산 | 2개 통과 |

단위 테스트는 `tests/unit/**/*.test.ts`에서 탐색하며 `npm run test:unit`으로 실행한다. 현재 도메인 규칙은 구현 전이므로 단위 테스트도 아직 없다. 실제 Supabase 연결 테스트는 `tests/live`에 추가하고 `npm run test:e2e:live`로 분리 실행한다.

현재 브라우저 검증 범위는 앱 셸과 자산 로딩이다. 상품 탐색·장바구니·캐러셀·SEO 정책과 배포 환경 검증은 각 기능 구현에 맞춰 추가한다.

### 의존성 점검

2026-10-19 기준 `npm audit --omit=dev` 결과는 취약점 0건이다. 전체 의존성에는 ESLint의 `braces` 의존 경로에서 high 경고 5건이 남아 있다. `braces`의 수정 버전은 배포되지 않았으며, 자동 수정이 제안하는 Next.js ESLint 설정의 메이저 다운그레이드는 적용하지 않았다.

ESLint 9와 TypeScript 6은 현재 Next.js ESLint 플러그인의 호환 범위에 맞춰 고정했다. 플러그인의 지원 범위와 수정 버전을 확인한 뒤 함께 갱신한다.

# 통합 검증 기록

2026-10-19 로컬 프로덕션 모드와 Vercel 공개 배포에서 교재 탐색·장바구니·캐러셀·SEO를 검증했다. 브라우저의 조회 요청이 Supabase 응답을 거쳐 목록과 합계로 표시되는 흐름, 사용자 조건과 보관 상태가 복구되는 흐름을 확인했다.

## 실행 환경과 결과

- macOS arm64, Node.js 22.16.0, npm 10.9.2
- Next.js 16.4.2, Vitest 5.0.5, Playwright 1.64.1
- Chromium 156.0.8078.4, 로컬 서버 `http://127.0.0.1:3100`
- 각 E2E 명령이 `next build` 후 `next start`를 실행하며 기존 개발 서버를 재사용하지 않는다.

| 명령 | 결과 |
| --- | --- |
| `npm run lint` | 통과 |
| `npm run typecheck` | 통과 |
| `npm run test:unit` | 6개 파일, 80개 통과 |
| `npm run test:e2e -- --workers=4` | 프로덕션 빌드·실행 성공, 자동 검색 포함 60개 통과 |
| `npm run test:e2e:live -- --workers=2` | 실제 연결 설정으로 빌드·실행 성공, 5개 통과 |

위 표는 최종 실행 결과이며 실패·재시도·건너뛴 테스트는 없다. fnm 환경에서는 각 명령 앞에 `fnm exec --using=22.16.0`을 붙여 실행했다. E2E 두 명령은 같은 빌드 경로와 포트를 사용하므로 순서대로 실행한다.

## 최초 Vercel 공개 배포 검증

- 공개 주소: [assignment-seven-livid.vercel.app](https://assignment-seven-livid.vercel.app)
- GitHub: [KKingmo/assignment](https://github.com/KKingmo/assignment), Production 브랜치 `main`
- 검증한 앱 커밋: `f1ecaf4453680e2652e21138a5d553ae483d06ad`
- 검증한 배포: `assignment-g6wcg9d7g-kkingmos-projects.vercel.app` — Production, Ready
- Production·Preview에 Supabase 공개 설정과 `NEXT_PUBLIC_SITE_URL`을 등록했다. 서버 비밀 키는 사용하지 않는다.

```bash
PLAYWRIGHT_BASE_URL=https://assignment-seven-livid.vercel.app npm run test:e2e -- --workers=4
PLAYWRIGHT_BASE_URL=https://assignment-seven-livid.vercel.app npm run test:e2e:live -- --workers=2
```

| 대상 | 결과 | 연결 범위 |
| --- | --- | --- |
| 공개 배포 E2E | 53개 통과, 15.4초 | Vercel HTML·JS·이미지·폰트·메타데이터, 제어된 Supabase 응답 |
| 공개 배포 실제 연결 | 5개 통과, 3.6초 | Vercel 앱 → 실제 Supabase → 목록·검색·장바구니 |

로그인 쿠키나 Vercel 보호 우회 없이 실행했고 실패·재시도·건너뛴 테스트는 없었다. `PLAYWRIGHT_BASE_URL`을 지정하면 로컬 서버와 빌드를 실행하지 않으며, SEO 테스트도 해당 origin을 기준으로 검사한다.

실제 응답으로 첫 12개·전체 18개 표시, 분류·검색·초과 페이지 보정, 목록 밖 상품의 ID 조회, 장바구니 합계 247,400원과 새로고침 복원을 확인했다. 공개 키의 SELECT는 성공하고 쓰기 요청은 거부됐다. 초기 HTML의 제목·canonical·OG URL과 robots.txt·sitemap.xml은 공개 도메인과 일치했다.

최초 배포 이후 `9bdc69c`에서 문서와 외부 URL 검증 기준을 갱신했다. 다음 자동 검색 변경은 별도로 검증했다.

## 자동 검색 변경 검증

`e215a15`에서 300ms 디바운스 자동 검색을 추가했다. [catalog-debounce.spec.ts](../tests/e2e/catalog-debounce.spec.ts)의 7개 시나리오를 포함해 로컬 전체 E2E 60개가 통과했다. Vitest 80개, 린트·타입 검사, 실제 Supabase 연결 5개도 통과했다.

| 시나리오 | 확인한 결과 |
| --- | --- |
| 연속 입력 | 마지막 입력 후 299ms에는 요청하지 않고 300ms에 최종 검색어 한 번 조회 |
| 명시적 실행 | Enter·검색 버튼으로 즉시 조회하고 예약된 중복 검색 취소 |
| 초기화 | X는 즉시 검색어를 비우고 필터 유지, 예약된 이전 검색이 재실행되지 않음 |
| 한글 조합 | 조합 중과 조합 확정 Enter에는 조회하지 않고 조합 종료 후 300ms에 조회 |
| URL 이력 | 자동 검색은 history 길이를 늘리지 않으며 뒤로·앞으로·새로고침에서 입력과 결과 복원 |
| 분류 전환 | 대기 중 분류를 바꾸면 최신 입력도 반영하며 1페이지로 이동 |
| 입력 보존 | 자동 조회 중 입력의 공백 유지, 직접 지운 빈 검색어도 반영 |

Playwright Clock으로 디바운스 경계를 제어하고 API 요청 횟수와 결과를 함께 검사했다. 네트워크 응답 후 Query 알림 타이머를 별도로 진행하며 새로고침 전에는 시계를 재개한다. 실제 연결 테스트에서도 Enter 없이 한글·영문 검색을 실행해 결과를 확인했다. IME 검증은 composition 이벤트 에뮬레이션이며 OS 입력기 실기기 테스트는 아니다.

Production 배포 `assignment-jihk3ees5-kkingmos-projects.vercel.app`이 Ready인 것을 확인한 뒤 공개 주소에서 다음 명령을 실행했다. 자동 검색 7개는 3.8초, 실제 Supabase 연결 5개는 4.5초에 통과했다. 두 최종 실행 모두 실패·재시도·건너뛴 테스트가 없었다.

```bash
PLAYWRIGHT_BASE_URL=https://assignment-seven-livid.vercel.app npm run test:e2e -- tests/e2e/catalog-debounce.spec.ts --workers=4
PLAYWRIGHT_BASE_URL=https://assignment-seven-livid.vercel.app npm run test:e2e:live -- --workers=2
```

## 데이터 흐름

교재 목록은 `BookCatalog → useBooks → getBooks → Supabase Data API → BookGrid`로 연결된다. 장바구니는 저장된 상품 ID·수량을 복구한 뒤 `useCartBooks → getBooksByIds → Supabase Data API`에서 현재 가격을 조회한다.

| 확인 지점 | 실제 연결에서 확인한 결과 |
| --- | --- |
| 브라우저 렌더링 | 첫 목록 12개 표시, 초기 목록의 처리되지 않은 페이지 오류 0건 |
| CSR 요청 | 초기 HTML에는 교재명이 없고 브라우저 GET 이후 카드 표시 |
| 목록 응답 | HTTP 206, `Content-Range: 0-11/18`, 예상 상품 데이터와 일치 |
| 전체 데이터 | 전체 18개·단품 12개·패스 6개, 각 상품명·가격·이미지 경로 일치 |
| 검색과 분류 | 두 번째 페이지 6개, 패스 필터·검색·X 초기화, 특수문자 검색 일치 |
| 범위 초과 | HTTP 416 이후 정확한 개수로 페이지 보정, 빈 검색 결과와 구분 |
| 장바구니 응답 | 현재 목록에 없는 상품의 ID 조회 HTTP 200, 3개 수량의 합계 247,400원 일치 |
| 새로고침 복구 | 상품 ID·수량 복원 후 가격 재조회, 합계 247,400원 유지 |
| 공개 키 권한 | SELECT 성공, INSERT·UPDATE·DELETE는 401/403 및 `42501`로 거부 |

실제 연결 검증은 [catalog.spec.ts](../tests/live/catalog.spec.ts)에 있으며 API 응답을 가로채지 않는다. 쓰기 권한 검사는 불완전한 INSERT와 존재하지 않는 UUID에 대한 UPDATE·DELETE로 수행해 기존 교재를 변경하지 않는다.

## 사용자 흐름과 회귀 검증

| 범위 | 검증한 동작 | 테스트 |
| --- | --- | --- |
| 목록·탐색 | 로딩·빈 결과·실패·재시도, 검색·분류·페이지 조합, 뒤로·앞으로·새로고침, 늦은 이전 응답 제외 | [catalog-loading](../tests/e2e/catalog-loading.spec.ts), [catalog-navigation](../tests/e2e/catalog-navigation.spec.ts) |
| 장바구니 | 담기·토스트·재담기·수량·합계·삭제·비우기, 검색 URL 유지, 가격 갱신 실패·오프라인·누락 상품 | [cart](../tests/e2e/cart.spec.ts) |
| 보관 | 전용 브라우저 프로필 종료 후 재실행, 손상 데이터·localStorage 접근 실패 | [cart](../tests/e2e/cart.spec.ts) |
| 캐러셀 | 자동·수동 순환, hover·포커스·명시적 정지, 동작 줄이기, CTA 외 전체 영역 드래그, 전환 중 재조작·연속 클릭 | [carousel](../tests/e2e/carousel.spec.ts), [carousel-swipe](../tests/e2e/carousel-swipe.spec.ts) |
| 터치·키보드 | 좌우 스와이프와 세로 스크롤 구분, 터치 취소, 버튼 탭, 포커스 순환·Escape·닫은 뒤 포커스 복귀 | [carousel-swipe](../tests/e2e/carousel-swipe.spec.ts), [cart](../tests/e2e/cart.spec.ts) |
| SEO | JavaScript 실행 전 제목·canonical·공유 메타데이터, CSR 탐색 후 동기화, 페이지 링크 새 탭, robots·sitemap | [seo](../tests/e2e/seo.spec.ts) |
| 화면·자산 | 한국어 문서·Pretendard, SVG·교재 이미지, 카드·검색창·장바구니 배치와 가로 넘침 | [app-shell](../tests/e2e/app-shell.spec.ts), [store-layout](../tests/e2e/store-layout.spec.ts) |

일반 E2E는 Supabase 응답을 제어한다. 지연·실패·가격 변경·상품 누락은 이 환경에서 재현하고, 실제 DB 연결 검증과 구분한다. Vitest는 [tests/unit](../tests/unit)의 가격 계산·조회 계약·URL 조건·장바구니 규칙·저장 형식·SEO 정책을 검사한다.

## 화면 확인과 검증 한계

1440×1000 데스크톱, 360·390·768px 너비의 터치 화면에서 목록 배치를 검증했다. 장바구니는 360·390px, 캐러셀은 500·905·1200·2841px 너비를 추가로 확인했다. 데스크톱·390px 목록과 390px 장바구니 캡처에서 글꼴·이미지·줄바꿈·버튼 배치를 육안으로 확인했다.

검증은 Chromium과 터치 에뮬레이션 범위다. Safari·Firefox·모바일 실기기, 픽셀 스냅샷 비교, 전체 접근성 표준 적합성은 검증하지 않았다. 화면 캡처와 HTML 보고서는 실행 시 생성되며 저장소에는 포함하지 않는다. 다음 테스트 실행 전 필요한 결과를 별도로 보관해야 한다.

공개 Production의 HTML 메타데이터와 이미지 응답은 검증했다. 외부 메신저가 생성하는 실제 공유 카드와 검색 엔진 색인은 검증하지 않았다. Preview 색인 정책은 단위 테스트로 확인했으며 별도의 Preview 배포 검증은 수행하지 않았다.

## 의존성 점검

2026-10-19 `npm audit --omit=dev` 결과는 취약점 0건이다. 전체 의존성에는 ESLint의 `braces` 의존 경로에서 high 경고 5건이 남아 있다. 당시 수정 버전이 배포되지 않아 자동 수정이 제안하는 Next.js ESLint 설정의 메이저 다운그레이드는 적용하지 않았다. ESLint 9와 TypeScript 6은 현재 Next.js ESLint 플러그인의 호환 범위에 맞춰 고정했다. 수정 버전과 플러그인 지원 범위를 확인한 뒤 함께 갱신한다.

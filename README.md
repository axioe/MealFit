# MealFit (밀핏)

냉장고 재고를 기반으로 AI가 3끼 식단을 추천하고, 장보기 → 조리 → 섭취 기록까지 한 흐름으로 연결하는 식단 관리 웹 서비스.

> 발표: 2026-10-23 (금) · 시연 범위: 회원가입·프로필 → 냉장고 재고 등록 → AI 3끼 추천과 서버 검증 → 확정과 장보기 목록 → 조리 차감·취소 복원 → 섭취 기록 → 대시보드

## 개요서와 달라진 점

| 항목 | 개요서 | 실제 |
|---|---|---|
| AI 엔진 | OpenAI API | **Gemini API** (Python AI 서비스, `google-genai` SDK + JSON 스키마 응답) |
| DB | MySQL 또는 PostgreSQL | **MariaDB 11.4** |
| 디자인 | Figma | 사용 안 함. AI Studio 프로토타입 화면을 기준으로 바로 구현 |
| 프론트 언어 | React + TypeScript | **React + JavaScript** (`.js` / `.jsx`) |
| Spring Boot | 3.x | 3.5.16 (Java 21) |

## 폴더 구조

```
MealFit/
├─ backend/                  Spring Boot (REST API, 도메인 로직, 서버 검증)
│  └─ src/main/java/com/mealfit/
│     ├─ global/             공통: exception, config, common(BaseTimeEntity, StatusTransition), web(@CurrentUserId)
│     └─ domain/
│        ├─ inventory/       재고 묶음·변경 이력              엔티티/리포지토리만
│        ├─ shopping/        장보기 부족분                    엔티티/리포지토리만
│        ├─ recipe/          레시피·재료·조리 순서            엔티티/리포지토리만
│        ├─ mealplan/        식단(초안→확정→취소)             엔티티/리포지토리만
│        ├─ cooking/         조리 완료·취소 복원              엔티티/리포지토리만
│        ├─ intake/          섭취 기록                        엔티티/리포지토리만
│        └─ ai/              Python AI 서비스 호출용 RestClient 설정
│        (auth/, user/       로그인·회원가입·프로필 — 최원석 담당, 아직 없음)
├─ frontend/                 React + JavaScript + Vite
│  └─ src/
│     ├─ api/                axios 클라이언트, 도메인별 API + TanStack Query 훅
│     ├─ components/layout/  좌측 메뉴(데스크톱) / 하단 메뉴(모바일) / 헤더
│     ├─ components/common/  상태 배지, 태그 입력, 스피너, 작업 안내 화면
│     ├─ pages/              화면 (모두 담당자 안내 화면 상태)
│     ├─ routes/             라우터
│     └─ lib/                백엔드 enum 상수(enums.js), 한글 라벨(labels.js)
├─ docker-compose.yml        로컬 MariaDB
└─ .env.example
```

Python AI 서비스(`ai-service/`)는 담당자가 이 저장소에 추가한다.

## 로컬 실행

**준비물:** JDK 17 이상(21이 없으면 Gradle이 자동으로 받음), Node.js 24, Docker Desktop(또는 로컬 MariaDB)

```bash
cp .env.example .env
docker compose up -d                # MariaDB (3306)
cd backend && ./gradlew bootRun     # http://localhost:8080  (Windows: gradlew.bat bootRun)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

- 3306 포트를 이미 쓰고 있으면(로컬 MySQL 등) `.env`에서 `DB_PORT=3307`로 바꾼다. Spring도 루트 `.env`를 읽는다.
- 테이블은 Spring 실행 시 Flyway가 자동으로 만든다.
- **Swagger:** http://localhost:8080/swagger-ui.html
- 로그인 기능 완성 전까지 API는 로그인 없이 호출된다. 사용자는 `X-User-Id` 헤더로 지정하고, 없으면 1번 사용자로 처리한다.
- 프론트는 `/api` 요청을 Vite 프록시로 8080에 넘기므로 CORS 설정이 필요 없다.
- 테스트: `cd backend && ./gradlew test` (H2 메모리 DB) / `cd frontend && npm run build`

## 배포 (AWS EC2)

**서비스 주소: http://3.39.100.188**

EC2 한 대에서 Docker Compose로 frontend(nginx) · backend(Spring) · MariaDB를 함께 띄운다. 외부에 열리는 포트는 80뿐이고, nginx가 `/api`를 Spring으로 넘긴다.

```
브라우저 ──80──▶ frontend(nginx) ──/api──▶ backend(:8080) ──▶ mariadb(:3306)
                                                     └──────▶ ai-service(:8000, 추가 예정)
```

### 자동 배포 (GitHub Actions)

`main`에 push(PR 머지 포함)되면 CI가 통과한 뒤 EC2에 자동 배포된다. 반영까지 약 2~3분.

```
main push ─▶ backend (test) ─┐
          └▶ frontend (lint, build) ─┴▶ deploy (EC2): git pull → docker compose up --build → 화면·API 응답 확인
```

| 이벤트 | 테스트 | 배포 |
|---|---|---|
| PR (`main` 대상) | ✅ | ❌ |
| `main` push (PR 머지) | ✅ | ✅ (테스트 통과 시) |
| Actions → CI → **Run workflow** (`main`) | ✅ | ✅ 코드 변경 없이 다시 배포할 때 |

- 배포 결과는 Actions 탭의 `deploy (EC2)`에서 본다. 실패하면 서버는 직전 버전 그대로 돌아간다
- **`main`에 머지되는 순간 새 Flyway 마이그레이션이 운영 DB에 적용된다.** 머지 전에 로컬에서 꼭 확인하고, 이미 머지된 `V*.sql`은 수정하지 않는다
- 설정: `.github/workflows/ci.yml`의 `deploy` 작업. 서버 IP는 `EC2_HOST`(파일 안), SSH 키는 Secret `EC2_SSH_KEY`
- 서버의 `.env`(DB 비밀번호 등)는 git이 무시하는 파일이라 배포해도 바뀌지 않는다

### 서버 구성

- 파일: `docker-compose.prod.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, `.env.prod.example`, `application-prod.yml`
- EC2: Ubuntu 24.04, t3.small(2GB + 스왑 2GB), 서울 리전
- 보안 그룹: 22(자동 배포 때문에 전체, 키 파일로만 접속), 80(전체). 8080·8000·3306은 열지 않는다

**최초 1회 (서버에서)**
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker ubuntu   # 다시 접속해야 적용
git clone https://github.com/axioe/MealFit.git && cd MealFit
cp .env.prod.example .env        # DB_PASSWORD, DB_ROOT_PASSWORD 채우기
docker compose -f docker-compose.prod.yml up -d --build
```

**수동 배포 (자동 배포가 안 될 때만)**
```bash
cd ~/MealFit && git pull && docker compose -f docker-compose.prod.yml up -d --build
```

- 로그: `docker compose -f docker-compose.prod.yml logs -f backend`
- 운영에서는 Swagger를 끈다(`application-prod.yml`). API 확인은 로컬에서 한다
- DB 접속(DBeaver): 기본은 SSH 터널(SSH 탭에 EC2 주소·`ubuntu`·키 파일, Main 탭 Host는 `localhost`)

## 담당 영역

| 담당 | 백엔드 | 프론트엔드 |
|---|---|---|
| 김영현 (PL) | `global/*` (예외·설정), 배포, 리뷰 | 공통 구조 (`api/client.js`, `routes`, `components/layout`) |
| 백가연 (PM) | API 명세(Swagger) 관리, QA 시나리오 | |
| 김수현 | **스마트 냉장고** `domain/inventory` | **스마트 냉장고** `pages/FridgePage`, `pages/Recommend·Shopping·RecipeDetail` 화면, `components/common` |
| 박희진 | `ai-service/` (FastAPI + Gemini), `domain/ai` 연동 | |
| 유지훈 | **운동** (Phase 1) `domain/workout`, `domain/shopping·cooking·recipe·mealplan` 서비스/컨트롤러, 서버 검증 | **운동** `pages/WorkoutPage` |
| 최원석 | **로그인·회원가입·마이페이지** 사용자·프로필 테이블, 인증(보안 설정 포함), `domain/intake`, 대시보드 API | **로그인·회원가입·마이페이지** `pages/LoginPage`, `pages/MyPage`, `pages/DashboardPage`, (Phase 1) 캘린더·체중 차트 |

> 로그인 담당자가 할 연결 작업: 사용자 테이블을 새 마이그레이션으로 추가하면서 기존 테이블 `user_id`에 외래키 연결, `global/web/CurrentUserIdArgumentResolver`를 인증 정보 기반으로 교체, 프론트 `api/client.js`에 토큰 처리 추가, 라우터에 로그인 가드 추가.

각 페이지의 안내 화면(`PagePlaceholder`)에 구현할 것과 연동 API가 적혀 있다. 구현을 시작하면 안내 화면을 지우고 만든다.

## API

브라우저는 Spring `/api/v1/**`만 호출한다. Spring이 내부망으로 Python AI 서비스 `/ai/**`를 부른다.

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| | POST | `/api/v1/auth/signup`, `/login` | 회원가입, 로그인 |
| | GET/PUT | `/api/v1/me/profile` | 목표·알레르기·조리 시간(10/20/30)·예산·제외 재료 |
| | GET | `/api/v1/dashboard?date=` | 오늘의 식단, 기한 임박 재료, 부족분 |
| | GET/POST | `/api/v1/inventory/lots` | 재고 묶음 조회(재료별 합계), 입고 |
| | PATCH | `/api/v1/inventory/lots/{id}` | 수동 조정, 폐기 (이력 자동 기록) |
| | POST | `/api/v1/meal-plans/recommend` | AI 3끼 추천 (초안) |
| | POST | `/api/v1/meal-plans/{id}/regenerate` | 한 끼 재추천 |
| | POST | `/api/v1/meal-plans/{id}/confirm` | 서버 검증 후 확정, 부족분 계산 |
| | GET | `/api/v1/recipes/{id}?servings=` | 레시피 상세, 인분 환산 |
| | GET/PATCH | `/api/v1/shopping-items` | 부족분 목록, 부분 구매 |
| | POST | `/api/v1/shopping-items/stock-in` | 구매분 냉장고 입고 |
| | GET | `/api/v1/cooking/preview?mealPlanId=` | 차감 미리보기 |
| | POST | `/api/v1/cooking-events`, `/{id}/cancel` | 조리 완료(차감), 취소(복원) |
| | POST | `/api/v1/intake-logs` | 먹음/건너뜀 기록 |

## 개발 규칙

### 브랜치 · 커밋
- `main`: 통합 + 배포 브랜치. **머지되면 바로 운영 서버(http://3.39.100.188)에 자동 배포된다.** 직접 push 금지
- 작업 브랜치: `main`에서 만든다. `feature/{영역}-{내용}` 예) `feature/inventory-stock-in`, `fix/auth-refresh`
- 커밋 메시지: `feat: 재고 입고 API`, `fix: ...`, `refactor: ...`, `docs: ...`
- PR은 `main`으로. CI(백엔드 테스트, 프론트 lint·빌드)가 통과해야 머지
- PR 올리기 전에 `main`을 작업 브랜치에 먼저 합쳐서(pull) 충돌을 풀고, 로컬에서 실행해 본다
- 머지 후 Actions의 `deploy (EC2)`가 초록색인지, 서버에서 화면이 동작하는지 확인한다
- 머지된 작업 브랜치는 삭제해도 된다

### DB 스키마 (Flyway)
- 스키마는 `backend/src/main/resources/db/migration`의 SQL로만 바꾼다 (`ddl-auto: validate`)
- **이미 머지된 `V1__...sql`은 절대 수정하지 않는다.** 변경은 새 파일 `V2__add_xxx.sql`
- 같은 날 여러 명이 마이그레이션을 만들면 번호가 겹칠 수 있으니 단톡방에 번호를 먼저 말하고 쓴다
- 수량은 `DECIMAL(12,3)` + `BigDecimal`, enum은 `VARCHAR(20)` + `@Enumerated(EnumType.STRING)`

### 백엔드
- 현재 사용자: 컨트롤러 파라미터에 `@CurrentUserId Long userId` (로그인 완성 후에도 이 코드는 그대로 둔다)
- 다른 사용자 데이터 접근 방지: 조회는 `findByIdAndUserId(id, userId)` 형태로
- 에러: `throw new BusinessException(ErrorCode.XXX)` → 자동으로 아래 형식 응답. 새 에러는 `ErrorCode`에 도메인 접두어로 추가 (`INVENTORY_001`)
  ```json
  { "status": 404, "code": "INVENTORY_001", "message": "재고를 찾을 수 없습니다.", "errors": [], "timestamp": "..." }
  ```
- 상태 변경은 엔티티 메서드에서 `status.validateTransition(next)`로 허용된 전이만 통과 (`MealPlanStatus`, `CookingStatus`, `IntakeStatus`)
- 재고 수량 변경은 `InventoryTransaction` 이력 저장과 같은 `@Transactional` 안에서
- 계산 정책: 실제 필요량 = 재료량 × 실제 인분 / 기준 인분 · kg↔g, L↔ml 자동 환산 · 개/팩/마리는 서로 합산 금지 · 부족분 = 필요량 + 최소 유지량 − 현재고

### 프론트엔드
- API 호출은 `src/api/client.js`의 `api` 인스턴스만 사용 (나중에 토큰 처리가 여기 한 곳에 들어간다)
- 파일 확장자: 화면(JSX가 있는 파일)은 `.jsx`, 그 외는 `.js`
- 도메인별로 `src/api/{domain}.js`에 API 함수 + `useQuery`/`useMutation` 훅을 만든다
- 쿼리 키는 `src/api/queryKeys.js`에 모으고, 변경 후 관련 키를 `invalidateQueries`
- 에러 메시지는 `getErrorMessage(error)`로 서버 메시지를 그대로 보여준다
- 공통 스타일 클래스: `input`, `label`, `btn-primary`, `btn-secondary`, `card` (`src/index.css`)
- 백엔드 enum 값은 문자열을 직접 쓰지 말고 `src/lib/enums.js` 상수 사용 (예: `MEAL_PLAN_STATUS.CONFIRMED`), 한글 라벨은 `src/lib/labels.js`
- import 경로는 `@/`(= `src/`)로 시작한다 (예: `import { api } from '@/api/client'`)

### AI 서비스 연동 (Spring ↔ Python)
- Gemini API 키는 Python 서비스 환경 변수에만 둔다. 브라우저·Spring에는 노출 금지
- 이름·이메일 등 개인정보는 AI 요청에 넣지 않는다 (목표·알레르기·재고·최근 식단만)
- Spring은 `domain/ai/AiClientConfig`의 `aiRestClient`로 호출한다 (연결 3초, 응답 20초 타임아웃)
- AI 결과는 항상 초안이다. Spring이 알레르기·제외 재료·수량을 다시 검사한 뒤 확정 가능 상태로 만든다
- 실패/타임아웃 시 로컬 대체 식단을 쓰고 `RecipeSource.LOCAL_FALLBACK`으로 화면에 표기

Test입니다.
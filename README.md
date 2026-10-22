# MealFit (밀핏)

냉장고 재고를 기반으로 AI가 3끼 식단을 추천하고, 장보기 → 조리 → 섭취 기록까지 한 흐름으로 연결하는 식단 관리 웹 서비스.

> 발표: 2026-10-23 (금) · 시연 범위: 회원가입·프로필 → 냉장고 재고 등록 → AI 3끼 추천과 서버 검증 → 확정과 장보기 목록 → 조리 차감·취소 복원 → 섭취 기록 → 대시보드

## 현재 구현 상태 (2026-10-22, `main` 기준)

회원·마이페이지부터 **재고 → 식단 추천·확정 → 장보기 → 조리**까지 화면과 API가 연결되어 동작한다. 15분 요리 추천은 Flask + Gemini로 연결되었다(로컬 실행 기준). **하루 3끼 AI 추천, 섭취 기록, 대시보드 API, 운동·체중**이 남아 있다.

| 기능 | 백엔드 API | 프론트 화면 | 남은 일 |
|---|---|---|---|
| 회원가입·로그인·로그아웃·탈퇴 (JWT) | ✅ | ✅ | |
| 마이페이지 (신체·식단·운동 설정·체력 측정) | ✅ | ✅ | |
| 스마트 냉장고 (입고·조정·폐기·이력) | ✅ | ✅ | |
| 식단 추천·재추천·확정·취소 | ✅ (로컬 대체 레시피) | ✅ | 하루 3끼 AI 연결 (`MealPlanAiClient` 구현) |
| 레시피 상세·인분 환산 | ✅ | ✅ | |
| 자동 장보기 (부족분·부분 구매·입고) | ✅ | ✅ | |
| 조리 차감·사용량 수정·식단 없는 조리·취소 복원 | ✅ | ✅ | |
| 15분 요리 AI 추천 (Spring → Flask → Gemini) | ✅ | ✅ | 운영 배포 (아래 [배포 미반영 항목](#배포-미반영-항목)) |
| 대시보드 | ❌ | ⚠️ 일부 예시 데이터 (`api/dashboard.js`의 `MOCK`) | `GET /dashboard` |
| 섭취 기록 (먹음/건너뜀) | ❌ (테이블·엔티티만) | ⚠️ 예시 데이터 | `POST /intake-logs` |
| 운동 루틴·캘린더·체중 (Phase 1) | ❌ | ⚠️ 화면만 | 발표 이후 |

- 대시보드의 예시 데이터는 `frontend/src/api/dashboard.js`의 `MOCK` 값으로 영역별로 끈다. API가 완성되면 `false`로 바꾼다.
- 하루 3끼 추천은 `MealPlanAiClient` 구현 빈이 없어 검증된 로컬 대체 레시피(`V2__seed_fallback_recipes.sql`)를 쓴다. 프로필의 알레르기·제외 재료는 `UserDietProfileProviderImpl`로 식단 확정과 15분 요리 추천 검증에 반영된다.

## 개요서와 달라진 점

| 항목 | 개요서 | 실제 |
|---|---|---|
| AI 엔진 | OpenAI API | **Gemini API** (`google-genai` SDK) |
| AI 서비스 | Python FastAPI | **Python Flask** (`ai-service/`) |
| DB | MySQL 또는 PostgreSQL | **MariaDB 11.4** |
| 디자인 | Figma | 사용 안 함. AI Studio 프로토타입 화면을 기준으로 바로 구현 |
| 프론트 언어 | React + TypeScript | **React + JavaScript** (`.js` / `.jsx`) |
| Spring Boot | 3.x | 3.5.16 (Java 21) |

## 폴더 구조

```
MealFit/
├─ backend/                  Spring Boot (REST API, 도메인 로직, 서버 검증)
│  └─ src/main/java/com/mealfit/
│     ├─ global/             security(JWT 필터), exception, config, common(BaseTimeEntity, StatusTransition), web(@CurrentUserId)
│     └─ domain/
│        ├─ auth/            회원가입·로그인·토큰 재발급·로그아웃 (controller/service/repository/entity/dto)
│        ├─ user/            내 계정·회원 탈퇴·프로필·마이페이지 상세
│        ├─ inventory/       재고 묶음·변경 이력
│        ├─ mealplan/        식단 추천·확정·취소, AI 제안 검증, 로컬 대체 레시피 선택
│        ├─ recipe/          레시피 상세, 수량·단위 환산(Quantity)
│        ├─ shopping/        장보기 부족분·부분 구매·입고
│        ├─ cooking/         조리 미리보기·완료·사용량 수정·식단 없는 조리·취소 복원
│        ├─ intake/          섭취 기록 (엔티티만)
│        └─ ai/              AI RestClient 설정, 15분 요리 추천(QuickRecipe*), QUICK_AI.md
├─ backend/src/main/resources/db/migration/   V1 ~ V7 (아래 DB 스키마 참고)
├─ ai-service/               Python Flask + Gemini (15분 요리 추천, README.md에 실행·계약 정리)
├─ frontend/                 React + JavaScript + Vite
│  ├─ src/
│  │  ├─ api/                client.js(axios, 토큰 첨부·401 재발급), 도메인별 API + TanStack Query 훅, mocks/
│  │  ├─ stores/             authStore.js (Zustand, 로그인 세션)
│  │  ├─ components/         layout/ common/ dashboard/ profile/ recommend/ shopping/
│  │  ├─ pages/              Dashboard, Recommend, RecipeDetail, Fridge, Shopping, MyPage, Login, Signup, Workout, Calendar, Weight
│  │  ├─ routes/             router.jsx (페이지별 지연 로딩)
│  │  └─ lib/                enums.js, labels.js, 날짜·기한·숫자 형식 도우미
│  └─ tests/                 Node 기본 테스트 (*.test.mjs)
├─ docker-compose.yml        로컬 MariaDB
├─ docker-compose.prod.yml   운영(EC2) 구성
└─ .env.example, .env.prod.example
```

## 로컬 실행

**준비물:** JDK 17 이상(21이 없으면 Gradle이 자동으로 받음), Node.js 24, Docker Desktop(또는 로컬 MariaDB). 15분 요리 AI까지 확인하려면 Python 3과 Gemini API 키.

```bash
cp .env.example .env                        # 아래 JWT_SECRET 설정 필수
docker compose up -d                        # MariaDB (3306)
cd backend && ./gradlew bootRun             # http://localhost:8080  (Windows: gradlew.bat bootRun)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

- **`JWT_SECRET`은 필수다.** `application.yml`에 기본값이 없어서 없으면 Spring이 뜨지 않는다. `.env`의 `# JWT_SECRET=` 주석을 풀고 `openssl rand -base64 48`로 만든 값을 넣는다. Spring은 루트 `.env`를 읽는다.
- 3306 포트를 이미 쓰고 있으면(로컬 MySQL 등) `.env`에서 `DB_PORT=3307`로 바꾼다.
- 테이블은 Spring 실행 시 Flyway가 자동으로 만든다. 예전 스키마로 실행한 적이 있어 Flyway 오류가 나면 `docker compose down -v` 후 다시 띄운다.
- **Swagger:** http://localhost:8080/swagger-ui.html (로그인 응답의 `accessToken`을 Authorize에 넣는다)
- 모든 API는 로그인이 필요하다(회원가입·로그인·재발급·로그아웃 제외). 사용자는 JWT의 회원 ID로만 식별한다.
- 프론트는 `/api` 요청을 Vite 프록시로 8080에 넘기므로 CORS 설정이 필요 없다.

**15분 요리 AI (선택)**: 자세한 내용은 [`ai-service/README.md`](ai-service/README.md), [`domain/ai/QUICK_AI.md`](backend/src/main/java/com/mealfit/domain/ai/QUICK_AI.md)

```bash
cd ai-service
python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt   # macOS/Linux: .venv/bin/python
cp .env.example .env                        # GEMINI_API_KEY 입력 (키는 이 파일에만 둔다)
.venv/Scripts/python app.py                 # http://127.0.0.1:8000
```

- Spring은 `AI_SERVICE_URL`(기본 `http://localhost:8000`)로 Flask를 부른다. Flask 포트를 바꾸면 이 값도 같이 바꾼다.
- Flask가 꺼져 있으면 15분 요리 추천은 `QUICK_AI_002`(503) 오류를 낸다. 하루 3끼 추천은 Flask와 관계없이 로컬 대체 레시피로 동작한다.

**테스트**
- 백엔드: `cd backend && ./gradlew test` (H2 메모리 DB)
- 프론트: `cd frontend && npm run lint && npm run build`, 로직 테스트는 `node --test tests/*.test.mjs`
- AI 서비스: `cd ai-service && .venv/Scripts/python -m unittest -v` (Gemini SDK를 mock해서 외부 호출 없음)

## 배포 (AWS EC2)

**서비스 주소: http://3.39.100.188**

EC2 한 대에서 Docker Compose로 frontend(nginx) · backend(Spring) · MariaDB를 함께 띄운다. 외부에 열리는 포트는 80뿐이고, nginx가 `/api`를 Spring으로 넘긴다.

```
브라우저 ──80──▶ frontend(nginx) ──/api──▶ backend(:8080) ──▶ mariadb(:3306)
                                                     └──────▶ ai-service(:8000, 운영 미배포)
```

### 배포 미반영 항목

코드는 `main`에 있지만 운영 배포 구성에는 아직 빠져 있다.

| 항목 | 현재 상태 | 필요한 작업 |
|---|---|---|
| `JWT_SECRET` | `docker-compose.prod.yml`의 backend 환경 변수에 없고 `.env.prod.example`에도 없음. 로그인 기능 머지(10/22) 이후 배포에서 백엔드가 뜨지 못함 | compose backend `environment`에 `JWT_SECRET: ${JWT_SECRET:?...}` 추가, 서버 `.env`와 `.env.prod.example`에 항목 추가 |
| ai-service | Dockerfile 없음, `docker-compose.prod.yml`에서 주석 처리 | Dockerfile 작성, compose 주석 해제, 서버 `.env`에 `GEMINI_API_KEY` |
| CI | ai-service 테스트를 실행하지 않음 | `ci.yml`에 Python 테스트 작업 추가 |

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

- 배포 결과는 Actions 탭의 `deploy (EC2)`에서 본다. **헬스체크가 실패해도 이미 새 컨테이너로 교체된 뒤라, 서버가 직전 버전으로 자동 복구되지는 않는다.** 실패하면 서버 로그를 확인하고 바로 고친다
- **`main`에 머지되는 순간 새 Flyway 마이그레이션이 운영 DB에 적용된다.** 머지 전에 로컬에서 꼭 확인하고, 이미 머지된 `V*.sql`은 수정하지 않는다
- 설정: `.github/workflows/ci.yml`의 `deploy` 작업. 서버 IP는 `EC2_HOST`(파일 안), SSH 키는 Secret `EC2_SSH_KEY`
- 서버의 `.env`(DB 비밀번호, JWT 키 등)는 git이 무시하는 파일이라 배포해도 바뀌지 않는다. 새 환경 변수가 생기면 서버에 직접 추가한다

### 서버 구성

- 파일: `docker-compose.prod.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, `.env.prod.example`, `application-prod.yml`
- EC2: Ubuntu 24.04, t3.small(2GB + 스왑 2GB), 서울 리전
- 보안 그룹: 22(자동 배포 때문에 전체, 키 파일로만 접속), 80(전체). 8080·8000·3306은 열지 않는다

**최초 1회 (서버에서)**
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker ubuntu   # 다시 접속해야 적용
git clone https://github.com/axioe/MealFit.git && cd MealFit
cp .env.prod.example .env        # DB_PASSWORD, DB_ROOT_PASSWORD, JWT_SECRET 채우기
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
| 김영현 (PL) | `global/*`, 배포·CI, 리뷰 | 공통 구조 (`api/client.js`, `routes`, `components/layout`) |
| 백가연 (PM) | API 명세(Swagger) 관리, QA 시나리오 | |
| 김수현 | **스마트 냉장고** `domain/inventory` | **스마트 냉장고** `pages/FridgePage`, `pages/Recommend·Shopping·RecipeDetail` 화면, `components/common` |
| 박희진 | `ai-service/` (Flask + Gemini), `domain/ai` 연동 | |
| 유지훈 | **운동** (Phase 1), `domain/shopping·cooking·recipe·mealplan`, 서버 검증 | **운동** `pages/WorkoutPage` |
| 최원석 | **로그인·회원가입·마이페이지** `domain/auth`, `domain/user`, `domain/intake`, 대시보드 API | `pages/LoginPage`, `pages/SignupPage`, `pages/MyPage`, `pages/DashboardPage`, (Phase 1) 캘린더·체중 |

## API

브라우저는 Spring `/api/v1/**`만 호출한다. Spring이 내부망으로 Python AI 서비스 `/ai/**`를 부른다. 요청·응답 형식은 Swagger(로컬)에서 본다. 아래 경로는 `/api/v1`을 생략했다.

| 상태 | 영역 | Method | Endpoint | 설명 |
|---|---|---|---|---|
| ✅ | 인증 | POST | `/auth/signup`, `/auth/login` | 회원가입(자동 로그인), 로그인 |
| ✅ | 인증 | POST | `/auth/refresh`, `/auth/logout` | 토큰 재발급(Refresh 1회용), 로그아웃 |
| ✅ | 회원 | GET / DELETE | `/me` | 내 계정, 회원 탈퇴(비밀번호 확인) |
| ✅ | 마이페이지 | GET / PUT | `/me/profile` | 목표·알레르기·조리 시간·예산·제외 재료 |
| ✅ | 마이페이지 | GET | `/me/profile/details` | 모든 탭 조회 |
| ✅ | 마이페이지 | PUT | `/me/profile/details/{common, trainer, diet, fitness, tests}` | 탭별 저장 |
| ✅ | 냉장고 | GET / POST | `/inventory/lots` | 재료별 합계와 재고 묶음 조회, 입고 |
| ✅ | 냉장고 | PATCH | `/inventory/lots/{id}` | 수량·정보 조정, 부분·전량 폐기 (이력 자동 기록) |
| ✅ | 냉장고 | GET | `/inventory/transactions?lotId=` | 재고 변경 이력 |
| ✅ | 식단 | GET | `/meal-plans?date=` | 날짜별 식단 |
| ✅ | 식단 | POST | `/meal-plans/recommend` | 하루 세 끼 추천 초안 |
| ✅ | 식단 | POST | `/meal-plans/{id}/regenerate` | 한 끼 재추천 |
| ✅ | 식단 | POST | `/meal-plans/{id}/confirm`, `/{id}/cancel` | 서버 검증 후 확정(부족분 계산), 취소 |
| ✅ | 레시피 | GET | `/recipes/{id}?servings=` | 레시피 상세, 인분 환산 |
| ✅ | 장보기 | GET / PATCH | `/shopping-items` | 부족분(조회 시 재계산), 부분 구매 반영 |
| ✅ | 장보기 | POST | `/shopping-items/stock-in` | 구매분 냉장고 입고 |
| ✅ | 조리 | GET / POST | `/cooking/preview` | 차감 미리보기(GET), 사용량 수정 미리보기(POST) |
| ✅ | 조리 | POST | `/cooking-events`, `/cooking-events/{id}/cancel` | 확정 식단 조리(재고 차감), 취소(원본 복원) |
| ✅ | 조리 | POST | `/cooking/ingredients/preview`, `/cooking-events/ingredients` | 식단 없는 조리 미리보기·완료 |
| ✅ | AI | POST | `/quick-recipes/recommend` | 본인 재고로 15분 요리 추천 (저장·차감 없음) |
| ❌ | 대시보드 | GET | `/dashboard?date=` | 오늘의 식단, 기한 임박 재료, 부족분 |
| ❌ | 섭취 | POST | `/intake-logs` | 먹음/건너뜀 기록 |
| ✅ | (내부) ai-service | POST / GET | `/ai/quick-recipes`, `/health` | Flask → Gemini 15분 요리 추천, 상태 확인 |
| ❌ | (내부) ai-service | POST | `/ai/meal-plans` | 하루 3끼 AI 식단 |

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
- 현재 V1(핵심 업무 테이블) · V2(로컬 대체 레시피) · V3(회원·프로필) · V4(Refresh Token) · V5(식단 없는 조리) · V6(마이페이지 상세) · V7(탈퇴 시각). 애플리케이션 테이블 18개
- **이미 머지된 `V*.sql`은 절대 수정하지 않는다.** 변경은 다음 번호의 새 파일 `V8__설명.sql`
- 같은 날 여러 명이 마이그레이션을 만들면 번호가 겹칠 수 있으니 단톡방에 번호를 먼저 말하고 쓴다
- 수량은 `DECIMAL(12,3)` + `BigDecimal`, enum은 `VARCHAR(20)` + `@Enumerated(EnumType.STRING)`

### 백엔드
- 현재 사용자: 컨트롤러 파라미터에 `@CurrentUserId Long userId`. JWT로 인증된 회원 ID만 들어오고, 요청의 `userId`·`X-User-Id`는 무시한다
- 다른 사용자 데이터 접근 방지: 조회는 `findByIdAndUserId(id, userId)` 형태로
- 에러: `throw new BusinessException(ErrorCode.XXX)` → 자동으로 아래 형식 응답. 새 에러는 `ErrorCode`에 도메인 접두어로 추가 (`INVENTORY_001`)
  ```json
  { "status": 404, "code": "INVENTORY_001", "message": "재고를 찾을 수 없습니다.", "errors": [], "timestamp": "..." }
  ```
- 상태 변경은 엔티티 메서드에서 `status.validateTransition(next)`로 허용된 전이만 통과 (`MealPlanStatus`, `CookingStatus`, `IntakeStatus`)
- 재고 수량 변경은 `InventoryTransaction` 이력 저장과 같은 `@Transactional` 안에서
- 계산 정책: 실제 필요량 = 재료량 × 실제 인분 / 기준 인분 · kg↔g, L↔ml 자동 환산 · 개/팩/마리는 서로 합산 금지 · 부족분 = 필요량 + 최소 유지량 − 현재고

### 프론트엔드
- **JavaScript만 사용** (TypeScript 문법 금지). 화면(JSX가 있는 파일)은 `.jsx`, 그 외는 `.js`
- API 호출은 `src/api/client.js`의 `api` 인스턴스만 사용한다. 토큰 첨부와 401 시 자동 재발급이 여기에 들어 있다
- 로그인 세션은 `src/stores/authStore.js`(Zustand)에서만 다룬다. 화면에서 토큰을 직접 읽거나 저장하지 않는다
- 도메인별로 `src/api/{domain}.js`에 API 함수 + `useQuery`/`useMutation` 훅을 만든다
- 쿼리 키는 `src/api/queryKeys.js`에 모으고, 변경 후 관련 키를 `invalidateQueries`
- 에러 메시지는 `getErrorMessage(error)`로 서버 메시지를 그대로 보여준다
- 공통 스타일 클래스: `input`, `label`, `btn-primary`, `btn-secondary`, `card` (`src/index.css`)
- 백엔드 enum 값은 문자열을 직접 쓰지 말고 `src/lib/enums.js` 상수 사용 (예: `MEAL_PLAN_STATUS.CONFIRMED`), 한글 라벨은 `src/lib/labels.js`
- import 경로는 `@/`(= `src/`)로 시작한다 (예: `import { api } from '@/api/client'`)

### AI 서비스 연동 (Spring ↔ Flask)
- Gemini API 키는 `ai-service/.env`에만 둔다. 브라우저·Spring·저장소에는 노출 금지
- 이름·이메일·토큰·사용자 ID 등 개인정보는 AI 요청에 넣지 않는다 (재고·목표·알레르기·제외 재료만)
- Spring은 `domain/ai/AiClientConfig`의 `aiRestClient`로 호출한다. 타임아웃: Spring 연결 3초·읽기 20초, Flask → Gemini 18초(추가 재시도 없음), 프론트 axios 30초
- AI 결과는 항상 초안이다. Spring이 출처·필수 필드·시간·수량·알레르기·제외 재료를 다시 검사한다
- 실패 시 대응: 하루 3끼 추천은 로컬 대체 식단을 쓰고 `RecipeSource.LOCAL_FALLBACK`으로 표기한다. 15분 요리 추천은 가짜 결과를 만들지 않고 오류 코드(`QUICK_AI_001`~`005`)로 안내한다

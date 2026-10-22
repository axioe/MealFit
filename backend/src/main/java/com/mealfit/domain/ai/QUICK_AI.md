# 15분 AI 요리 연동 실행 안내

브라우저 → Spring `POST /api/v1/quick-recipes/recommend` → Flask `POST /ai/quick-recipes` → Gemini 흐름입니다.
추천은 DB에 저장하거나 재고를 변경하지 않습니다. 조리 전 미리보기·완료·취소는 기존 Spring API를 사용합니다.

## 실행

Flask 터미널:
```powershell
cd C:\su\MealFit\ai-service
.\.venv\Scripts\python.exe app.py
```
키는 Flask `.env`에서만 설정합니다. 실제 값은 공유하지 마세요.

Spring 터미널:
```powershell
cd C:\su\MealFit\backend
$env:AI_SERVICE_URL = 'http://127.0.0.1:5000'
.\gradlew.bat bootRun
```
IntelliJ에서는 Spring Boot 실행 구성의 Environment variables에 `AI_SERVICE_URL=http://127.0.0.1:5000`을 설정하고 재시작하세요.
현재 `application.yml`에는 `optional:file:.env[.properties]` 및 `optional:file:../.env[.properties]`가 명시되어 있습니다.
루트 `.env`의 8000 값이 적용되는 것을 피하려고 명시적 환경변수를 권장합니다. 이번 작업은 루트 `.env`와 공용 설정을 수정하지 않습니다.
다른 작업 디렉터리에서 실행하면 상대 경로 `.env`를 찾지 못할 수 있습니다. OS 환경변수가 Spring 설정 파일보다 우선합니다.

프론트:
```powershell
cd C:\su\MealFit\frontend
npm run dev
```
로그인 → AI 식단 추천 → 냉장고 맞춤 15분 요리 → 재료 선택 → 추천받기 → 레시피 보기/요리 준비 → 사용량 수정 → 서버 미리보기 순서로 확인합니다.
실제 조리 완료·취소는 DB 쓰기이므로 검증용 데이터와 승인 범위에서 실행하세요.

## API 계약

JWT 인증과 기존 `@CurrentUserId`를 사용합니다. 요청 수량·이름·단위는 받지 않습니다.
```json
{"selectedLotIds":[1,2],"maxCookingMinutes":15,"recommendationCount":3}
```
Spring이 사용자 본인의 ACTIVE·양수·기한 미경과 재고를 조회하고 선택 ID의 소유권·사용 가능 여부를 확인합니다.
동일 재료명과 다른 단위의 재고는 별도 입력으로 Flask에 전달합니다. Flask의 selectedIngredients가 이름 목록이므로 선택 단위만 제한하는 세부 선택 계약은 지원하지 않습니다.
보유 재고는 Flask 입력 제한에 따라 최대 100개 묶음, 추천 수는 1~5개, 시간은 1~15분입니다.
프로필의 목표·알레르기·제외 재료를 기존 UserDietProfileProvider로 읽습니다. 구현 빈/프로필이 없으면 빈 조건을 사용합니다.
이름·이메일·토큰·사용자 ID는 Flask로 보내지 않습니다.
응답은 Flask의 `source, asOfDate, recipes` 구조를 유지합니다. 레시피의 `title,cookingMinutes,servings,ingredients,steps,reason`을 React 카드 모델로 변환합니다.
BigDecimal은 Spring JSON에서 숫자로 반환될 수 있습니다. React는 숫자와 십진 문자열 모두 표시 모델에서 처리합니다. DB recipeId·mealPlanId를 임의 생성하지 않습니다.

## 검증 및 오류

Spring이 AI_GENERATED 출처·필수 필드·시간·수량 정밀도·알레르기/제외 재료를 검증합니다. Flask의 보유량 비교는 추천 표시용이며 실제 차감은 조리 API 판정이 우선합니다.
기존 공통 오류 형식 `{status,code,message,errors,timestamp}`를 재사용합니다.

| 코드 | HTTP | 의미 |
|---|---|---|
| COMMON_400 / QUICK_AI_001 | 400 | 잘못된 입력·현재 사용 불가능한 선택 |
| QUICK_AI_002 | 503 | Flask 연결 실패·서비스 설정 필요 |
| QUICK_AI_003 | 502 | AI upstream 오류 |
| QUICK_AI_004 | 504 | 응답 시간 초과 |
| QUICK_AI_005 | 502 | 잘못된 AI 결과·빈 결과·정책 위반 |

실패 시 mock이나 로컬 예시를 실제 AI 결과로 반환하지 않습니다. 기존 하루 식단의 대체 정책은 변경하지 않습니다.
타임아웃은 Flask 18초, Spring 연결 3초/읽기 20초, axios 30초입니다. 기존 값을 재사용하고 무제한·자동 추천 재시도를 추가하지 않습니다.
AI 응답 인분을 그대로 사용하며 Flask는 요청 인분 환산 계약을 제공하지 않습니다. 추천 화면의 입력 인분은 제거했습니다.

## 팀 협의 사항

- 기존 AI 서비스는 8000 포트의 `/ai/meal-plans`도 예정되어 있습니다. 하나의 AI_SERVICE_URL을 공유하므로 향후 하루 식단 AI API와 15분 Flask를 같은 서비스로 운영할지, 별도 주소 설정을 둘지 협의해야 합니다. 기존 호출 코드는 수정하지 않았습니다.
- 실제 Gemini 요청 지연·할당량에 따라 추천이 실패할 수 있습니다. 오류 후 사용자가 다시 요청합니다.
- 레시피는 임시 추천이며 새로고침 시 목록부터 다시 요청합니다. 조리 이벤트 조회 부재 등 18차 제한은 유지됩니다.

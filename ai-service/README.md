# MealFit Python AI 서비스

독립 실행 Flask + Gemini 추천 서비스입니다. React·Spring·MariaDB·Docker를 실행하지 않아도 됩니다.
이번 작업에 한해 사용자가 FastAPI 대신 Flask를 승인했습니다. 가이드북의 내부 `/ai/*` 경로는 유지합니다.
기존 Python AI 코드는 없어 새로 구현했으며, 가이드북에는 구체적 프롬프트·모델·15분 추천 스키마가 없습니다.
따라서 해당 부분은 17차 요구사항으로 작성한 **내부 개발 계약**입니다. 20차에서 기존 Spring DTO에 맞춘 `/ai/meal-plans`를 추가했습니다. `/ai/recipes`는 구현하지 않았습니다.

## Windows PowerShell 실행

```powershell
cd C:\su\MealFit\ai-service
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
notepad .env
# GEMINI_API_KEY에 로컬에서 직접 키를 입력하고 저장하세요.
.\.venv\Scripts\python.exe app.py
```

기본 주소는 `http://127.0.0.1:8000`, debug/reloader는 꺼져 있습니다. 실제 키는 출력하거나 공유하지 마세요.
PORT 미설정 시 8000을 사용합니다. 다른 포트는 `.env`의 `PORT=8001` 또는 PowerShell의 `$env:PORT = '8001'`로 지정할 수 있습니다. 포트를 바꾸면 호출 주소도 맞춰 주세요. 프로세스 환경변수가 `.env`보다 우선합니다. 루트 `.env`는 읽지 않습니다.
`GEMINI_MODEL` 기본값은 공식 모델 목록에서 확인한 `gemini-3.5-flash-lite`입니다. 계정 사용 권한·할당량은 실제 키로 별도 검증해야 합니다.
모델 자동 대체는 하지 않습니다. SDK HTTP 제한은 18초, 재시도는 1회 시도(추가 재시도 없음)입니다.
가이드북의 Spring 연결 3초·읽기 20초는 유지하며 Spring URL 변경은 이번 범위가 아닙니다.

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
# { status: ok, service: mealfit-ai } — Gemini 호출 및 키 유효성 검사는 하지 않습니다.
```

## 추천 요청

`POST /ai/quick-recipes`, `Content-Type: application/json`. 브라우저에서 직접 호출하지 않고 향후 Spring을 거칩니다.
최종 공식 연동 계약은 팀 협의가 필요합니다. CORS·인증·DB 저장·재고 차감 기능은 없습니다.

```powershell
$body = @{
  ingredients = @(
    @{ name = '달걀'; quantity = 4; unit = '개'; expirationDate = (Get-Date).AddDays(3).ToString('yyyy-MM-dd') },
    @{ name = '양파'; quantity = 300; unit = 'g' }
  )
  selectedIngredients = @('달걀', '양파')
  maxCookingMinutes = 15
  recommendationCount = 3
  userGoal = 'MAINTAIN'
  allergies = @()
  excludedIngredients = @()
} | ConvertTo-Json -Depth 8
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/ai/quick-recipes `
  -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
```

입력 규칙:

- ingredients 1~100개, name 100자, unit 20자, quantity 양수 DECIMAL(12,3) 범위. JSON 숫자 또는 십진 문자열을 받습니다.
- 단위는 재고 도메인과 같이 비어 있지 않은 20자 이내 문자열입니다. 단위 열거형이 없으므로 임의 화이트리스트를 추가하지 않았습니다. 빈 값·제어 문자·길이 초과는 거부합니다. 사용자 정의 단위는 같은 문자열끼리만 비교합니다.
- selectedIngredients는 보유 목록에 있는 이름의 비어 있지 않은 배열입니다. 같은 이름·다른 단위는 보유 목록에서 따로 전달합니다. 확정 식별자 계약은 추후 협의합니다.
- expirationDate는 선택, null 또는 YYYY-MM-DD. 한국 날짜 기준 기한 경과는 Gemini 전달·보유량에서 제외, 오늘 만료·기한 없음은 포함합니다.
- maxCookingMinutes 기본 15, 1~15 정수. recommendationCount 기본 3, 1~5 정수. 최대 개수·본문 1MiB·목록 크기는 호출량과 입력 크기 제한이며 가이드북에 없는 기술 제한임을 명시합니다.
- userGoal은 선택 문자열이며 새로운 목표 enum을 정의하지 않았습니다. allergies·excludedIngredients는 선택 이름 배열입니다. 이름·이메일 등 개인정보 필드는 받지 않습니다.

## 응답

```json
{
  "source": "AI_GENERATED",
  "asOfDate": "2026-10-22",
  "recipes": [{
    "title": "달걀 양파 볶음",
    "description": "간단한 볶음 요리",
    "cookingMinutes": 10,
    "servings": 1,
    "ingredients": [{
      "name": "달걀", "quantity": "2", "unit": "개",
      "inventory": {"status": "SUFFICIENT", "quantity": "4", "unit": "개", "shortageQuantity": "0", "hasIncompatibleUnits": false}
    }],
    "steps": ["재료를 준비해 충분히 익혀 주세요."],
    "reason": "보유 재료를 활용합니다."
  }]
}
```

위 JSON은 계약 설명 예시이며 실호출 결과가 아닙니다. quantity는 정확도 유지를 위해 응답에서 십진 **문자열**입니다.
inventory는 Gemini 판단이 아니라 Python Decimal 계산 결과입니다. kg↔g, L↔ml만 환산하고 이름은 앞뒤 공백 제거 후 정확히 비교합니다.
SUFFICIENT(충분), SHORTAGE(부족), NONE(없음), UNIT_MISMATCH(비교 단위 없음)를 구분합니다. UNIT_MISMATCH는 shortageQuantity가 null이며 무게를 추정하지 않습니다.
양이 일부 비교 가능하더라도 다른 단위가 있으면 hasIncompatibleUnits=true로 표시합니다.
기한 우선 사용·추천 이유의 의미 정확성과 조리 시간은 생성 모델의 추정입니다. 재료명 정확 비교로 알레르기·제외 재료를 거르지만 복합 재료·동의어까지 안전을 보장하지 않습니다. **Spring의 최종 검증 없이 확정·저장·차감하면 안 됩니다.**
AI가 선택 재료를 전혀 사용하지 않거나 시간·수량·필수 필드·추천 개수가 맞지 않으면 성공으로 반환하지 않습니다.

## 오류

가이드북 형식 `{status, code, message, errors:[{field,message}], timestamp}`를 사용합니다. 키나 내부 예외 내용은 반환·기록하지 않습니다.

| HTTP | code | 의미 |
|---|---|---|
| 400 / 415 / 413 | AI_001 | 잘못된 JSON·입력·콘텐츠 유형·본문 크기 |
| 503 | AI_002 | Gemini 키 미설정 |
| 502 | AI_003 | Gemini 호출·권한·할당량 등 오류 |
| 502 | AI_004 | 잘못된 AI JSON·빈 결과·정책 검증 실패 |
| 504 | AI_005 | upstream 시간 초과 |
| 500 | AI_006 | 내부 처리 실패 |

가짜 추천이나 로컬 mock으로 성공을 대신하지 않습니다. 가이드북의 검증된 로컬 대체 식단은 Spring 책임이며 이 서비스에는 검증된 대체 데이터가 없습니다.

## 테스트 및 연동

```powershell
.\.venv\Scripts\python.exe -m unittest -v
```

자동 테스트는 SDK를 mock하여 외부 호출 없이 검증합니다. 실호출은 키 설정 후 위 PowerShell 추천 요청으로 별도 확인합니다.
Spring 담당자: Python 주소·경로·선택 재료 식별·알레르기/제외 재료·20초 예산·오류/대체 정책을 합의해야 합니다. 팀 공통 AI_SERVICE_URL=http://localhost:8000과 Flask 기본 포트 8000을 함께 사용합니다.
프론트 담당자: title→name, cookingMinutes→cookTimeMin, ingredients.name→ingredientName 어댑터가 필요합니다. source는 실제 AI 응답으로 표시하고 mock과 분리합니다. servings는 응답 값을 사용합니다. DB recipeId/mealPlanId는 생성하지 않습니다.
16차 실제 사용 재료 편집 모델은 재사용할 수 있지만 추천 결과는 차감 근거가 아닙니다. 별도 Spring 조리 계약이 있어야 합니다.

참고: https://ai.google.dev/gemini-api/docs/models · https://googleapis.github.io/python-genai/


## 하루 식단 추천 (20차)

`POST /ai/meal-plans`는 기존 `AiMealPlanRequest`를 받고 `List<AiMealSuggestion>` JSON 배열을 반환합니다.
React는 기존 `/api/v1/meal-plans/recommend`, `/{id}/regenerate`를 그대로 사용합니다.
Spring `FlaskMealPlanAiClient`가 기존 `aiRestClient`로 호출하며 인증·재고 조회·검증·저장·상태 전이는 기존 MealPlanService에 유지됩니다.
Spring의 `test` 프로필에서는 실제 AI 빈을 등록하지 않습니다. 자동 테스트는 명시적 테스트 연결 또는 모의 클라이언트를 사용합니다.

요청 예시 (개인 식별 정보는 전달하지 않음):

```json
{"planDate":"2026-10-24","mealTypes":["BREAKFAST","LUNCH","DINNER"],"servings":2,
 "goal":"MAINTAIN","cookTimeMin":20,"mealBudget":null,"allergies":[],"excludedIngredients":[],
 "inventory":[{"ingredientName":"두부","quantity":300,"unit":"g","expiryDate":null,"expirationStatus":"UNKNOWN"}],
 "keptMeals":[],"recentMeals":[]}
```

응답은 요청된 끼니마다 다음 객체를 하나씩 포함하는 배열입니다. 한 끼 재추천은 해당 끼니만 요청·반환합니다.

```json
[{"mealType":"LUNCH","recipeName":"두부 볶음","description":"보유 재료 활용","servingSize":2,
  "cookTimeMin":15,"calories":"400","proteinG":"30.1","carbsG":"10","fatG":"20",
  "ingredients":[{"name":"두부","quantity":"300","unit":"g"}],
  "steps":["두부를 준비하고 충분히 익힙니다."],"reason":"보유 재료 활용"}]
```

위 응답은 `mealTypes:["LUNCH"]`에 대한 계약 예시입니다. 수량·영양값은 십진 문자열이며 Spring에서 BigDecimal로 매핑합니다.
인분은 기존 외부 API와 같은 1~10입니다. 재료량과 영양값은 servingSize 전체 조리량 기준이며 AI 영양 추정치로 저장합니다.
재료 수량은 기존 서버 검증의 양수·최대 100000 및 DB 소수 3자리, 영양값은 기존 DB DECIMAL(8,1)에 맞춰 검증합니다.
희망 조리 시간이 있으면 해당 시간을 넘는 결과를 거절합니다. 예산은 실시간 가격 정보가 없어 충족을 보장하지 않습니다.
기한은 오늘과 예정일 중 늦은 날보다 앞선 재료를 Gemini 입력에서 제외합니다. 기한 미등록은 안전을 보장하지 않습니다.
알레르기·제외 재료는 기존 서버와 같은 공백 제거·대소문자 무시 포함 비교를 추가 적용합니다. 동의어·복합 성분 검증은 보장하지 않습니다.
별도 선호 음식·신체 정보 필드는 현재 AiMealPlanRequest에 없어 새로 추가하지 않았습니다.

오류는 기존 AI_001~AI_006 형식이며 Flask에서 가짜 성공·대체 식단을 반환하지 않습니다.
Spring은 기존 정책대로 검증된 로컬 후보로 전환하고 `LOCAL_FALLBACK`으로 표시합니다. 안전한 후보가 없으면 기존 오류와 롤백을 유지합니다.
Spring의 공통 `AI_SERVICE_URL=http://localhost:8000`, 연결 3초·읽기 20초, Gemini 18초(추가 재시도 없음), React 30초는 유지합니다.
Flask 주소 설정을 바꾼 뒤에는 Spring을 재시작해야 합니다. `.env` 로딩 여부는 기존 application.yml의 spring.config.import 설정을 따릅니다.

```powershell
cd C:\su\MealFit\ai-service
.\.venv\Scripts\python.exe app.py
.\.venv\Scripts\python.exe -m unittest -v
```

`/health`는 키의 유효성까지 검증하지 않습니다. Gemini 실호출은 별도 검증입니다.
기존 15분 요리 경로·프롬프트·스키마는 유지되며 공통 SDK 함수의 기본 인수도 그대로입니다.

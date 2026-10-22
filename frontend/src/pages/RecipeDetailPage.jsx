import { CookingPanel } from "@/components/recommend/CookingPanel";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock, RefreshCw } from "lucide-react";
import { getErrorMessage } from "@/api/client";
import { useInventory } from "@/api/inventory";
import { useRecipe } from "@/api/recipes";
import {
  compareRecipeIngredient,
  RECIPE_STOCK_LABEL,
  RECIPE_STOCK_STATUS,
  validRecipeDate,
  validRecipeId,
  validRecipeServings,
} from "@/api/recipeInventory";
import { Spinner } from "@/components/common/Spinner";
import { RecipeSourceBadge } from "@/components/common/StatusBadge";
import { RECIPE_SOURCE } from "@/lib/enums";
import { formatQuantity } from "@/lib/format";

function RecipeContent({
  recipeId,
  initialServings,
  backTo,
  onServingsChange,
  mealPlanId,
  date,
  focusCooking,
}) {
  const [requestedServings, setRequestedServings] = useState(initialServings);
  const [servingInput, setServingInput] = useState(
    initialServings == null ? "" : String(initialServings),
  );
  const [cookingBusy, setCookingBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [lastRecipe, setLastRecipe] = useState(null);
  const requestLock = useRef(false);
  const recipe = useRecipe(recipeId, requestedServings);
  const inventory = useInventory();
  const data = recipe.data ?? lastRecipe;

  if (recipe.data && recipe.data !== lastRecipe) {
    setLastRecipe(recipe.data);
    setServingInput(String(recipe.data.servings));
  }
  useEffect(() => {
    if (!recipe.isFetching) requestLock.current = false;
  }, [recipe.isFetching]);

  function applyServings(event) {
    event.preventDefault();
    if (requestLock.current || recipe.isFetching || cookingBusy) return;
    if (!validRecipeServings(servingInput)) {
      setFormError("인분은 1 이상 2,147,483,647 이하의 정수로 입력해 주세요.");
      return;
    }
    requestLock.current = true;
    setFormError("");
    const next = Number(servingInput);
    if (next === requestedServings) recipe.refetch({ cancelRefetch: false });
    else setRequestedServings(next);
    onServingsChange(next);
  }
  function retryRecipe() {
    if (requestLock.current || recipe.isFetching || cookingBusy) return;
    requestLock.current = true;
    recipe.refetch({ cancelRefetch: false });
  }
  return (
    <div className="space-y-6">
      <Link to={backTo} aria-disabled={cookingBusy} onClick={(event) => { if (cookingBusy) event.preventDefault(); }} className="btn-secondary min-h-11">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        식단 추천으로 돌아가기
      </Link>
      {recipe.isFetching && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <Spinner />
          {data
            ? "인분에 맞는 재료를 확인하고 있습니다. 기존 내용을 유지합니다."
            : "레시피를 불러오고 있습니다."}
        </div>
      )}
      {recipe.isError && (
        <div
          role="alert"
          className="space-y-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700"
        >
          <p className="whitespace-pre-wrap break-all">
            {getErrorMessage(recipe.error)}
          </p>
          {data && (
            <p>
              요청한 인분의 조회에 실패했습니다. 현재 {data.servings}인분의 이전
              결과를 표시합니다.
            </p>
          )}
          <button
            type="button"
            disabled={recipe.isFetching || cookingBusy}
            onClick={retryRecipe}
            className="btn-secondary min-h-11"
          >
            레시피 다시 시도
          </button>
        </div>
      )}
      {!data && !recipe.isFetching && !recipe.isError && (
        <section className="card">
          <h2 className="font-bold">레시피 정보가 없습니다</h2>
          <p className="mt-2 text-sm text-gray-500">
            다른 식단을 선택해 주세요.
          </p>
        </section>
      )}
      {data && (
        <>
          <section className="card min-w-0 space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.values(RECIPE_SOURCE).includes(data.source) && (
                <RecipeSourceBadge source={data.source} />
              )}
            </div>
            <h2 className="break-all text-2xl font-extrabold text-gray-900">
              {data.name}
            </h2>
            {data.description && (
              <p className="whitespace-pre-wrap break-all text-sm leading-7 text-gray-600">
                {data.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Clock aria-hidden="true" className="h-4 w-4" />
                조리 {data.cookTimeMin}분
              </span>
              <span>현재 표시 {data.servings}인분</span>
              <span>레시피 기준 {data.servingSize}인분</span>
            </div>
            <form
              onSubmit={applyServings}
              noValidate
              className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4"
            >
              <div className="min-w-0 flex-1">
                <label htmlFor="recipe-servings" className="label">
                  필요한 인분
                </label>
                <input
                  id="recipe-servings"
                  type="number"
                  min="1"
                  max="2147483647"
                  step="1"
                  value={servingInput}
                  disabled={recipe.isFetching || cookingBusy}
                  onChange={(event) => {
                    setServingInput(event.target.value);
                    setFormError("");
                  }}
                  aria-invalid={Boolean(formError)}
                  aria-describedby={
                    formError ? "recipe-servings-error" : undefined
                  }
                  className="input min-h-11"
                />
              </div>
              <button
                type="submit"
                disabled={
                  cookingBusy || recipe.isFetching ||
                  (!recipe.isError && Number(servingInput) === data.servings)
                }
                className="btn-primary min-h-11"
              >
                {recipe.isFetching ? "조회 중..." : "인분 적용"}
              </button>
              {formError && (
                <p
                  id="recipe-servings-error"
                  role="alert"
                  className="w-full text-sm text-rose-700"
                >
                  {formError}
                </p>
              )}
            </form>
            <p className="text-xs leading-5 text-gray-500">
              재료 수량은 서버에서 인분에 맞춰 환산합니다. 개수 단위의 올림과
              소수점 처리도 서버 결과를 그대로 사용합니다.
            </p>
          </section>

          <section
            className="card space-y-4"
            aria-labelledby="recipe-ingredients-title"
          >
            <h3 id="recipe-ingredients-title" className="text-base font-bold">
              필요한 재료 · {data.servings}인분
            </h3>
            {(data.ingredients ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">
                제공된 재료 정보가 없습니다.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.ingredients.map((ingredient, index) => (
                  <li
                    key={`${ingredient.ingredientName}-${index}`}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-gray-50 p-3 text-sm"
                  >
                    <span className="min-w-0 break-all font-semibold">
                      {ingredient.ingredientName}
                    </span>
                    <span className="break-all">
                      {formatQuantity(ingredient.quantity, ingredient.unit)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            className="card space-y-4"
            aria-labelledby="recipe-stock-title"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 id="recipe-stock-title" className="text-base font-bold">
                냉장고 보유 재료
              </h3>
              <button
                type="button"
                disabled={inventory.isFetching}
                onClick={() => inventory.refetch({ cancelRefetch: false })}
                className="btn-secondary min-h-11 text-xs"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={`h-4 w-4 ${inventory.isFetching ? "animate-spin" : ""}`}
                />
                재고 새로고침
              </button>
            </div>
            <p className="text-xs leading-5 text-gray-500">
              이름의 앞뒤 공백을 제외하고 일치하는 활성 재고를 비교합니다. 기한
              경과·소진·폐기 재고는 제외하며, 오늘 만료·기한 미등록 재고는
              포함합니다. kg↔g, L↔ml 이외의 단위는 임의 환산하지 않습니다.
            </p>
            {inventory.isPending && (
              <p role="status" className="text-sm text-gray-500">
                냉장고 재고를 확인하고 있습니다.
              </p>
            )}
            {inventory.isError && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
              >
                <p>{getErrorMessage(inventory.error)}</p>
                <p className="mt-2">
                  {inventory.data
                    ? "이전 재고 기준 비교입니다. 새로고침 후 확인해 주세요."
                    : "재고 조회 실패로 보유 여부를 판단할 수 없습니다."}
                </p>
              </div>
            )}
            {inventory.data && (
              <ul className="space-y-3">
                {(data.ingredients ?? []).map((ingredient, index) => {
                  const comparison = compareRecipeIngredient(
                    ingredient,
                    inventory.data.groups,
                  );
                  return (
                    <li
                      key={`${ingredient.ingredientName}-${index}`}
                      className="min-w-0 space-y-2 rounded-xl border border-gray-200 p-4 text-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="min-w-0 break-all font-bold">
                          {ingredient.ingredientName}
                        </h4>
                        <span
                          className={`max-w-full rounded-full px-2.5 py-1 text-xs font-semibold ${comparison.status === RECIPE_STOCK_STATUS.SUFFICIENT ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-900"}`}
                        >
                          {RECIPE_STOCK_LABEL[comparison.status]}
                        </span>
                      </div>
                      <p className="break-all">
                        필요{" "}
                        {formatQuantity(ingredient.quantity, ingredient.unit)} /
                        보유{" "}
                        {comparison.status === RECIPE_STOCK_STATUS.UNKNOWN
                          ? "수량 확인 필요"
                          : comparison.stockText || "없음"}
                      </p>
                      {comparison.status === RECIPE_STOCK_STATUS.SHORTAGE && (
                        <p className="break-all text-xs text-rose-700">
                          비교 가능한 재고 기준 부족량 {comparison.shortageText}
                        </p>
                      )}
                      {comparison.hasIncompatibleUnits && (
                        <p className="text-xs leading-5 text-gray-500">
                          단위가 다른 재고는 비교 수량에 포함하지 않았습니다.
                          개수·포장과 무게 사이의 환산 기준은 제공되지 않습니다.
                        </p>
                      )}
                      {comparison.expiredCount > 0 && (
                        <p className="text-xs text-gray-500">
                          기한이 지난 {comparison.expiredCount}개 묶음은
                          제외했습니다.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <Link to="/fridge" className="btn-secondary min-h-11">
                냉장고 확인
              </Link>
              <Link to="/shopping" className="btn-secondary min-h-11">
                장보기 목록 보기
              </Link>
            </div>
            <p className="text-xs leading-5 text-gray-500">
              이 화면은 구매 항목을 생성하지 않습니다. 장보기는 확정된 식단을
              기준으로 서버가 계산하므로, 필요하면 먼저 식단을 확정해 주세요.
              화면의 비교 결과는 조리 시 실제 차감할 로트·수량의 미리보기가
              아닙니다.
            </p>
          </section>

          <section
            className="card space-y-4"
            aria-labelledby="recipe-steps-title"
          >
            <h3 id="recipe-steps-title" className="text-base font-bold">
              단계별 조리법
            </h3>
            {(data.steps ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">
                제공된 조리 순서가 없습니다.
              </p>
            ) : (
              <ol className="space-y-4">
                {data.steps.map((step, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 rounded-xl bg-gray-50 p-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                      {index + 1}
                    </span>
                    <p className="min-w-0 whitespace-pre-wrap break-all text-sm leading-7 text-gray-700">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section
            className="card space-y-3"
            aria-labelledby="recipe-nutrition-title"
          >
            <h3 id="recipe-nutrition-title" className="text-base font-bold">
              영양 정보{data.nutritionEstimated ? " (추정치)" : ""}
            </h3>
            <p className="text-xs leading-5 text-gray-500">
              저장된 레시피 기준 {data.servingSize}인분의 정보입니다. 인분을
              변경해도 API가 영양 값을 환산하지 않아 그대로 표시합니다.
            </p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["열량", data.calories, "kcal"],
                ["단백질", data.proteinG, "g"],
                ["탄수화물", data.carbsG, "g"],
                ["지방", data.fatG, "g"],
              ].map(([label, value, unit]) => (
                <div key={label} className="min-w-0 rounded-xl bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="mt-2 break-all text-sm font-bold">
                    {value == null ? "미제공" : formatQuantity(value, unit)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <CookingPanel
            ingredients={data.ingredients ?? []}
            inventory={inventory}
            usageScope={String(requestedServings ?? data.servings)}
            focusCooking={focusCooking}
            recipeId={recipeId}
            mealPlanId={mealPlanId}
            date={date}
            servings={data.servings}
            recipeReady={!recipe.isFetching && !recipe.isError && Number(servingInput) === data.servings && (requestedServings == null || requestedServings === data.servings)}
            onBusyChange={setCookingBusy}
          />
        </>
      )}
    </div>
  );
}

export function RecipeDetailPage() {
  const { id } = useParams();
  const { hash } = useLocation();
  const [params, setParams] = useSearchParams();
  const date = validRecipeDate(params.get("date")) ? params.get("date") : null;
  const backTo = date ? `/recommend?date=${date}` : "/recommend";
  const rawServings = params.get("servings");
  const validId = validRecipeId(id);
  if (!validId || (rawServings != null && !validRecipeServings(rawServings))) {
    return (
      <section className="card space-y-4">
        <h2 className="text-base font-bold">
          {validId
            ? "인분 값이 올바르지 않습니다"
            : "레시피 번호가 올바르지 않습니다"}
        </h2>
        <p className="text-sm text-gray-600">
          {validId
            ? "인분은 1 이상인 정수로 입력해 주세요."
            : "양의 정수인 레시피 번호로 접속해 주세요."}
        </p>
        {validId && (
          <Link
            to={`/recipes/${id}${date ? `?date=${date}` : ""}`}
            className="btn-secondary min-h-11"
          >
            기본 인분으로 조회
          </Link>
        )}
        <Link to={backTo} aria-disabled={cookingBusy} onClick={(event) => { if (cookingBusy) event.preventDefault(); }} className="btn-secondary min-h-11">
          식단 추천으로 돌아가기
        </Link>
      </section>
    );
  }
  return (
    <RecipeContent
      focusCooking={hash === "#cook"}
      mealPlanId={params.get("mealPlanId")}
      date={date}
      key={id}
      recipeId={id}
      initialServings={rawServings == null ? undefined : Number(rawServings)}
      backTo={backTo}
      onServingsChange={(servings) => {
        const next = new URLSearchParams(params);
        next.set("servings", String(servings));
        setParams(next, { replace: true });
      }}
    />
  );
}

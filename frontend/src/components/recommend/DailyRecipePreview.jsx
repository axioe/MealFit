import { useRecipe } from '@/api/recipes'
import { formatQuantity } from '@/lib/format'
import { validRecipeId, validRecipeServings } from '@/api/recipeInventory'

export function DailyRecipePreview({ plan }) {
  const query = useRecipe(plan.recipe.id, plan.servings, validRecipeId(plan.recipe.id) && validRecipeServings(plan.servings))
  const recipe = query.data
  return <div className="flex-1 space-y-4 text-xs leading-5">
    {query.isFetching && <p role="status" className="text-gray-500">재료·조리법 확인 중…</p>}
    {query.isError && <div className="text-rose-700"><p>레시피 미리보기를 불러오지 못했습니다.</p><button type="button" disabled={query.isFetching} onClick={() => query.refetch()} className="mt-1 min-h-11 font-bold underline">미리보기 다시 조회</button></div>}
    {recipe && !query.isError && <>

      <div><h5 className="mb-2 font-bold text-gray-700">필요 재료 ({recipe.servings}인분 기준)</h5><ul className="space-y-1.5">{(recipe.ingredients ?? []).map((item, index) => <li key={`${item.ingredientName}-${index}`} className="flex flex-wrap justify-between gap-x-2 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5"><span className="min-w-0 break-all font-medium text-gray-800">{item.ingredientName}</span><span className="break-all font-semibold text-gray-600">{formatQuantity(item.quantity, item.unit)}</span></li>)}</ul></div>
      <div><h5 className="mb-2 font-bold text-gray-700">조리 순서 미리보기</h5>{recipe.steps?.length ? <ol className="list-decimal space-y-1.5 pl-4 text-gray-600">{recipe.steps.slice(0, 2).map((step, index) => <li key={index} className="break-words">{step}</li>)}</ol> : <p className="text-gray-500">등록된 조리 순서가 없습니다.</p>}{recipe.steps?.length > 2 && <p className="mt-2 text-gray-500">전체 {recipe.steps.length}단계 · 상세 화면에서 이어서 확인하세요.</p>}</div>

    </>}
  </div>
}

export function DailyMealInfo({ plan }) {
  const query = useRecipe(plan.recipe.id, plan.servings, validRecipeId(plan.recipe.id) && validRecipeServings(plan.servings))
  const recipe = !query.isError ? query.data : null
  const summary = recipe ?? plan.recipe
  return <div className="space-y-3">
    {recipe?.description && <p className="break-words text-xs leading-6 text-gray-500">{recipe.description}</p>}
    <dl className="grid grid-cols-2 gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs">{[
      ['조리 시간', summary.cookTimeMin == null ? null : summary.cookTimeMin + '분'],
      ['열량', summary.calories == null ? null : summary.calories + ' kcal'],
      ['단백질', summary.proteinG == null ? null : summary.proteinG + 'g'],
      ['인분', plan.servings + '인분'],
    ].filter(([,value]) => value != null).map(([label,value]) => <div key={label}><dt className="text-emerald-700">{label}</dt><dd className="mt-1 break-all font-extrabold text-emerald-950">{value}</dd></div>)}</dl>
    <p className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">{summary.carbsG != null && <span>탄수화물 {summary.carbsG}g</span>}{summary.fatG != null && <span>지방 {summary.fatG}g</span>}<span>영양 정보는 저장된 레시피 기준{summary.nutritionEstimated ? ' · 추정치' : ''}</span></p>
  </div>
}

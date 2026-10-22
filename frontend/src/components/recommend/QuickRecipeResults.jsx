import { Clock, ChefHat } from 'lucide-react'
import { quickRecipeGrid, splitQuickIngredients } from '@/api/quickCookingView'

export function QuickRecipeResults({ recipes }) {
  return <section aria-label="개발용 요리 예시" className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-extrabold">선택 재료 비교 · 15분 요리 예시</h3><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">개발용 mock · 실제 AI 추천 아님</span></div><p className="text-xs leading-5 text-gray-500">추천 순서는 고정 예시이며 조리 시간·인분 입력에 따라 실제 추천되거나 환산되지 않습니다. 재료 비교는 현재 선택 재고 기준입니다.</p>
    <div className={quickRecipeGrid(recipes.length)}>{recipes.map((recipe) => {
      const { available, missing, incomparable } = splitQuickIngredients(recipe.comparisons)
      return <article key={recipe.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3"><span className="text-xs font-bold text-gray-600">예시 순서 {recipe.rank}</span><span className="text-xs font-bold text-emerald-700">고정 레시피 · mock</span></header>
        <div className="flex flex-1 flex-col gap-4 p-4"><div><h4 className="break-all text-lg font-extrabold">{recipe.name}</h4>{recipe.description && <p className="mt-1 break-words text-sm text-gray-600">{recipe.description}</p>}<p className="mt-2 flex items-center gap-1 text-xs text-gray-500"><Clock aria-hidden="true" className="h-4 w-4" />예상 {recipe.cookTimeMin}분 · 1인분 예시</p></div>
          <section className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><h5 className="mb-2 text-xs font-bold text-emerald-800">활용 가능한 선택 재료</h5>{available.length ? <ul className="space-y-1 text-xs leading-5 text-emerald-900">{available.map((item) => <li key={item.ingredientName} className="break-all">{item.ingredientName} · 필요 {item.quantity}{item.unit} / 사용 가능 {item.availableText}</li>)}</ul> : <p className="text-xs text-emerald-800">같은 단위로 활용할 선택 재료가 없습니다.</p>}</section>
          <section className="rounded-xl border border-rose-100 bg-rose-50 p-3"><h5 className="mb-2 text-xs font-bold text-rose-800">부족한 재료</h5>{missing.length ? <ul className="space-y-1 text-xs leading-5 text-rose-900">{missing.map((item) => <li key={item.ingredientName} className="break-all">{item.ingredientName} · 부족 {item.shortageText}</li>)}</ul> : <p className="text-xs text-rose-800">비교 가능한 단위 기준 부족분 없음</p>}</section>
          {incomparable.length > 0 && <p className="break-all rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">수량 비교 불가: {incomparable.map((item) => item.ingredientName).join(', ')} · 다른 단위를 임의 환산하지 않습니다.</p>}
          <p className="break-words text-xs leading-6 text-gray-600">조리법 요약: {recipe.steps[0]}</p>
          <details className="mt-auto border-t border-gray-100 pt-3"><summary className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-bold text-emerald-700"><ChefHat aria-hidden="true" className="h-4 w-4" />예시 조리법 상세 펼치기</summary><ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-6">{recipe.steps.map((step, index) => <li key={index} className="break-words">{step}</li>)}</ol></details>
          <p className="text-xs leading-5 text-gray-500">실제 레시피 ID가 없는 mock이므로 서버 상세 이동·장보기 추가·식단 확정은 제공하지 않습니다.</p>
        </div>
      </article>
    })}</div>
  </section>
}

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react'
import { ActualIngredientsEditor } from './ActualIngredientsEditor'
import { analyzeUsage } from '@/api/actualUsage'
import { quickCookingAvailability, quickUsageBaseline, prepareQuickUsageDraft } from '@/api/quickCookingService'
import { formatQuantity } from '@/lib/format'
import { getErrorMessage } from '@/api/client'
import { RECIPE_STOCK_LABEL } from '@/api/recipeInventory'

export function QuickRecipeDetail({ recipe, initialMode, inventory, onBack }) {
  const title = useRef(null)
  const [preparing, setPreparing] = useState(initialMode === 'prepare')
  const [session, setSession] = useState(() => {
    const baseline = quickUsageBaseline(recipe)
    return { baseline, rows: baseline.map((row) => ({ ...row })) }
  })
  const ready = Boolean(inventory.data) && !inventory.isFetching && !inventory.isError
  const analysis = analyzeUsage(session.rows, session.baseline, inventory.data, ready)
  const draft = prepareQuickUsageDraft(recipe, session.rows, analysis)
  const availability = quickCookingAvailability()
  const originalAnalysis = analyzeUsage(session.baseline, session.baseline, inventory.data, ready)
  useEffect(() => { title.current?.focus({ preventScroll: true }); title.current?.scrollIntoView({ block: 'start' }) }, [])
  return <div className="space-y-5">
    <button type="button" onClick={onBack} className="btn-secondary min-h-11"><ArrowLeft aria-hidden="true" className="h-4 w-4" />15분 추천 목록으로 돌아가기</button>
    <section className="card min-w-0 space-y-4">
      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">개발용 mock · 실제 AI 추천 아님</span>
      <h2 ref={title} tabIndex={-1} className="scroll-mt-24 break-all text-2xl font-extrabold focus-visible:outline-emerald-600">{recipe.name}</h2>
      {recipe.description && <p className="break-all text-sm leading-7 text-gray-600">{recipe.description}</p>}
      <div className="flex flex-wrap gap-3 text-sm text-gray-600"><span className="flex items-center gap-1"><Clock aria-hidden="true" className="h-4 w-4" />{recipe.cookTimeMin == null ? '조리 시간 미제공' : `예상 ${recipe.cookTimeMin}분`}</span><span>{recipe.servings == null ? '인분 정보 미제공' : `${recipe.servings}인분`}</span></div>
      <p className="text-xs leading-6 text-gray-500">임시 예시이며 저장된 식단이 아니에요. 입력한 추천 인분으로 환산되지 않으며 새로고침하면 목록부터 다시 확인해 주세요.</p>
      {!preparing && <button type="button" className="btn-primary min-h-11" onClick={() => setPreparing(true)}>요리 준비하기</button>}
    </section>
    <section className="card space-y-4" aria-label="15분 요리 재료와 보유 현황">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-extrabold">필요한 재료 · 현재 냉장고 비교</h3><button type="button" disabled={inventory.isFetching} onClick={() => inventory.refetch({ cancelRefetch: false })} className="btn-secondary min-h-11"><RefreshCw aria-hidden="true" className="h-4 w-4" />재고 새로고침</button></div>
      <p className="text-xs leading-6 text-gray-500">카드는 선택한 재료와 비교하고, 이 화면은 현재 냉장고 전체와 비교해요. 기한 경과 재고는 제외하고 개수와 무게는 임의로 환산하지 않아요.</p>
      {inventory.isFetching && <p role="status" className="text-sm text-gray-500">최신 재고를 확인하고 있어요. 입력 내용은 유지해요.</p>}
      {inventory.isError && <p role="alert" className="text-sm text-rose-700">{getErrorMessage(inventory.error)} 재고를 다시 조회해 주세요.</p>}
      {!recipe.ingredients.length && <p className="text-sm text-gray-500">제공된 재료 정보가 없어요.</p>}
      <ul className="space-y-3">{recipe.ingredients.map((item, index) => {
        const comparison = originalAnalysis.comparisons.get(`recipe:${index}`)
        return <li key={index} className="min-w-0 space-y-2 rounded-xl border border-gray-200 p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="break-all font-bold">{item.ingredientName || '재료명 미제공'}</span><span className="break-all">{item.quantity == null || !item.unit ? '필요 수량 미제공' : formatQuantity(item.quantity, item.unit)}</span></div><p className="break-all text-xs text-gray-600">{comparison ? `${RECIPE_STOCK_LABEL[comparison.status]} · 보유 ${comparison.stockText || '없음'}` : '재고 비교 정보 확인 필요'}</p>{comparison?.shortageText && ['none', 'shortage'].includes(comparison.status) && <p className="break-all text-xs text-rose-700">부족한 양: {comparison.shortageText}</p>}</li>
      })}</ul>
    </section>
    <section className="card space-y-4" aria-label="15분 요리 조리 순서"><h3 className="font-extrabold">단계별 조리법</h3>{recipe.steps.length ? <ol className="space-y-3">{recipe.steps.map((step, index) => <li key={index} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">{index + 1}</span><p className="min-w-0 whitespace-pre-wrap break-all text-sm leading-7">{step}</p></li>)}</ol> : <p className="text-sm text-gray-500">제공된 조리 순서가 없어요.</p>}</section>
    {preparing && <ActualIngredientsEditor session={session} analysis={analysis} inventoryReady={ready} disabled={inventory.isFetching} preparedDraft={draft} onRowsChange={(rows) => setSession({ ...session, rows })} onReset={() => setSession({ ...session, rows: session.baseline.map((row) => ({ ...row })), notice: '레시피 기준으로 되돌렸어요.' })} />}
    {preparing && <section aria-label="15분 요리 준비 요약" className="card space-y-3"><h3 className="font-extrabold">최종 사용 재료 · 임시 입력</h3><ul className="space-y-2 text-sm">{session.rows.filter((row) => row.enabled).map((row) => <li key={row.key} className="break-all">{row.ingredientName} · {row.quantity || '수량 입력 필요'}{row.quantity ? row.unit : ''}</li>)}</ul>{analysis.empty && <p className="text-sm text-rose-700">사용할 재료가 없어요.</p>}<p className="text-sm leading-7 text-amber-900">{availability.message}</p><button type="button" disabled={!availability.canComplete} className="btn-primary min-h-11">요리 완료 · 준비 중</button><p className="text-xs leading-6 text-gray-500">입력만 확인하며 냉장고 수량이나 조리 기록은 변경하지 않아요.</p></section>}
  </div>
}

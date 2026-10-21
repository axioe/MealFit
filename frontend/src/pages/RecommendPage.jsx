import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Sparkles, UtensilsCrossed, X } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { useMealPlanAction, useMealPlanSnapshot } from '@/api/mealPlans'
import { useRecipe } from '@/api/recipes'
import { Spinner } from '@/components/common/Spinner'
import { MealPlanStatusBadge, RecipeSourceBadge } from '@/components/common/StatusBadge'
import { today } from '@/lib/date'
import { MEAL_PLAN_STATUS, MEAL_TYPE, RECIPE_SOURCE } from '@/lib/enums'
import { MEAL_TYPE_LABEL } from '@/lib/labels'
import { formatQuantity } from '@/lib/format'

const ORDER = Object.values(MEAL_TYPE)

function RecipeDetails({ plan }) {
  const [open, setOpen] = useState(false)
  const { data, isPending, isError, error, refetch } = useRecipe(plan.recipe.id, plan.servings, open)
  return <div data-meal-details className="min-w-0 border-t border-gray-100 pt-3">
    <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="btn-secondary min-h-11 text-xs">{open ? '레시피 접기' : '재료·조리법 보기'}</button>
    {open && <div className="mt-4 space-y-4 text-sm leading-6">
      {isPending && <p role="status">레시피를 불러오고 있습니다.</p>}
      {isError && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700"><p>{getErrorMessage(error)}</p><button type="button" onClick={() => refetch()} className="btn-secondary mt-2 min-h-11">다시 시도</button></div>}
      {data && <><p className="whitespace-pre-wrap break-all text-gray-600">{data.description}</p>
        <div><h4 className="font-bold">재료 · {data.servings}인분</h4><ul className="mt-2 space-y-2">{data.ingredients.map((ingredient, index) => <li key={`${ingredient.ingredientName}-${index}`} className="flex flex-wrap justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2"><span className="min-w-0 break-all">{ingredient.ingredientName}</span><span className="break-all font-semibold">{formatQuantity(ingredient.quantity, ingredient.unit)}</span></li>)}</ul></div>
        <p className="text-xs text-gray-500">재료별 보유·부족 수량은 추천 API에서 제공하지 않습니다. 확정 후 장보기 목록에서 서버가 계산한 부족분을 확인하세요.</p>
        <div><h4 className="font-bold">조리 순서</h4><ol className="mt-2 list-decimal space-y-2 pl-5">{data.steps.map((step, index) => <li key={index} className="whitespace-pre-wrap break-all">{step}</li>)}</ol></div>
        <p className="break-all text-xs text-gray-500">저장된 레시피 기준 영양 정보{data.nutritionEstimated ? ' (추정치)' : ''}: 열량 {data.calories ?? '미제공'} kcal · 단백질 {data.proteinG ?? '미제공'}g · 탄수화물 {data.carbsG ?? '미제공'}g · 지방 {data.fatG ?? '미제공'}g. 인분 변경에 따른 영양 환산은 제공하지 않습니다.</p>
      </>}
    </div>}
  </div>
}

function MealConfirmation({ selection, busy, error, onClose, onConfirm }) {
  const dialog = useRef(null)
  const title = selection.action === 'confirm' ? '이 식단으로 확정할까요?' : selection.action === 'cancel' ? '이 식단을 취소할까요?' : '다시 추천받을까요?'
  useEffect(() => { const node = dialog.current; node.showModal(); return () => node.close() }, [])
  return <dialog ref={dialog} aria-label={title} onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl backdrop:bg-black/40">
    <div className="flex items-start justify-between gap-2"><h3 className="font-bold">{title}</h3><button type="button" disabled={busy} onClick={onClose} aria-label="식단 확인 창 닫기" className="btn-secondary min-h-11 px-3"><X aria-hidden="true" className="h-4 w-4" /></button></div>
    {selection.plan && <p className="mt-3 break-all text-sm font-semibold">{MEAL_TYPE_LABEL[selection.plan.mealType]} · {selection.plan.recipe.name}</p>}
    <p className="my-4 text-sm leading-6 text-gray-600">{selection.action === 'confirm' ? '서버가 식단을 검증하고 장보기 부족분을 계산합니다. 냉장고 재고는 차감하지 않습니다.' : selection.action === 'cancel' ? '취소한 식단은 되돌릴 수 없으며, 확정 식단의 장보기 부족분은 다시 계산됩니다.' : '기존 추천 초안은 취소하고 새 초안을 만듭니다. 이미 확정한 끼니는 유지합니다.'}</p>
    {error && <p role="alert" className="mb-4 whitespace-pre-wrap break-all rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="btn-secondary min-h-11">닫기</button><button type="button" disabled={busy} onClick={onConfirm} className="btn-primary min-h-11">{busy ? '처리 중...' : selection.action === 'confirm' ? '식단 확정' : selection.action === 'cancel' ? '식단 취소' : '추천 실행'}</button></div>
  </dialog>
}

export function RecommendPage() {
  const [date, setDate] = useState(today)
  const [servings, setServings] = useState('1')
  const [selection, setSelection] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [shortages, setShortages] = useState(null)
  const lock = useRef(false)
  const mutation = useMealPlanAction()
  const { data } = useMealPlanSnapshot(date)
  const plans = data?.mealPlans ?? []
  const allConfirmed = ORDER.every((type) => plans.some((plan) => plan.mealType === type && plan.status === MEAL_PLAN_STATUS.CONFIRMED))
  const busy = mutation.isPending

  async function run(action, plan) {
    if (lock.current) return
    if (!date || !Number.isInteger(Number(servings)) || Number(servings) < 1 || Number(servings) > 10) {
      setError('날짜와 1~10 사이의 인분을 입력해 주세요.'); return
    }
    lock.current = true
    setError(''); setMessage('')
    try {
      const result = await mutation.mutateAsync({ action, id: plan?.id, date, servings: Number(servings) })
      setSelection(null)
      setShortages(action === 'confirm' ? result.shortages : null)
      setMessage(action === 'confirm' ? '식단을 확정했습니다.' : action === 'cancel' ? '식단을 취소했습니다.' : action === 'regenerate' ? '선택한 끼니를 다시 추천했습니다. 다른 끼니는 유지했습니다.' : '추천 초안을 저장했습니다. 끼니별로 확인 후 확정해 주세요.')
    } catch (failure) {
      setError(getErrorMessage(failure) + ((!failure.response || failure.response.status >= 500) ? ' 처리 여부가 불확실할 수 있으므로 같은 요청을 바로 반복하지 마세요. 현재는 식단 조회 API가 없어 서버 상태 확인이 필요합니다.' : ''))
    } finally { lock.current = false }
  }
  function choose(action, plan) { setError(''); setSelection({ action, plan }) }
  return <div className="space-y-6">
    <section className="card space-y-4">
      <div><h2 className="flex items-center gap-2 text-base font-bold"><Sparkles aria-hidden="true" className="h-5 w-5 text-emerald-600" />냉장고 재료로 식단 추천받기</h2><p className="mt-2 text-sm leading-6 text-gray-600">보관 중인 재료를 참고해 아침·점심·저녁 초안을 만듭니다. 기한이 지난 재고는 추천에서 제외됩니다.</p></div>
      <form onSubmit={(event) => { event.preventDefault(); if (plans.length) choose('recommend'); else run('recommend') }} className="grid items-end gap-3 sm:grid-cols-[1fr_7rem_auto]">
        <div className="min-w-0"><label htmlFor="recommend-date" className="label">추천 날짜</label><input id="recommend-date" type="date" required value={date} disabled={busy || Boolean(selection)} onChange={(event) => { setDate(event.target.value); setShortages(null); setMessage(''); setError('') }} className="input min-h-11" /></div>
        <div><label htmlFor="recommend-servings" className="label">인분</label><input id="recommend-servings" type="number" min="1" max="10" step="1" required value={servings} disabled={busy || Boolean(selection)} onChange={(event) => setServings(event.target.value)} className="input min-h-11" /></div>
        <button type="submit" disabled={busy || Boolean(selection) || allConfirmed} className="btn-primary min-h-11 bg-gradient-to-r from-emerald-600 to-teal-600"><Sparkles aria-hidden="true" className="h-4 w-4" />{busy ? '처리 중...' : plans.length ? '미확정 끼니 다시 추천' : '추천 받기'}</button>
      </form>
      <p className="text-xs leading-5 text-gray-500">추천 초안도 서버에 저장됩니다. 확정 식단은 전체 재추천에서도 유지되며, 새 인분은 새로 생성되는 초안에만 적용됩니다.</p>
    </section>
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">현재 날짜별 식단 조회 API가 없습니다. 표시된 식단은 이 브라우저 세션의 마지막 서버 응답이며, 다른 화면·기기에서 바뀐 최신 상태를 보장하지 않습니다. 새로고침·재진입 시 자동 재추천하지 않습니다.</p>
    {busy && <div role="status" className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><Spinner />요청을 처리하고 있습니다. 추천은 시간이 걸릴 수 있습니다.</div>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    {error && !selection && <p role="alert" className="whitespace-pre-wrap break-all rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {shortages && <section className="card space-y-3"><h3 className="text-base font-bold">방금 확정한 식단의 부족분</h3>{shortages.length === 0 ? <p className="text-sm text-gray-600">서버 확인 결과 더 구매할 재료가 없어요.</p> : <ul className="space-y-2 text-sm">{shortages.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-2"><span className="min-w-0 break-all">{item.ingredientName}</span><span className="break-all font-semibold">{formatQuantity(item.remainingQty, item.unit)}</span></li>)}</ul>}<Link to="/shopping" className="btn-secondary min-h-11">장보기 목록 확인</Link></section>}
    {plans.length === 0 ? <div className="card py-12 text-center"><UtensilsCrossed aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-gray-300" /><h3 className="font-bold">표시할 추천 결과가 없어요</h3><p className="mt-2 text-sm leading-6 text-gray-500">날짜와 인분을 고르고 추천받기를 눌러 주세요. 기존 서버 식단은 아직 자동 조회할 수 없습니다.</p></div> : <div className="grid gap-4 xl:grid-cols-3">{ORDER.map((type) => {
      const plan = plans.find((row) => row.mealType === type)
      if (!plan) return null
      const draft = plan.status === MEAL_PLAN_STATUS.DRAFT
      return <article key={plan.id} data-meal-card={type} className="card grid min-w-0 gap-4 xl:row-span-5 xl:grid-rows-subgrid">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{MEAL_TYPE_LABEL[type]}</h3><MealPlanStatusBadge status={plan.status} /></div>
        <div className="min-w-0 space-y-3"><h4 className="break-all text-lg font-extrabold text-gray-900">{plan.recipe.name}</h4>
        <div className="flex flex-wrap gap-2">{Object.values(RECIPE_SOURCE).includes(plan.recipe.source) && <RecipeSourceBadge source={plan.recipe.source} />}</div>
        <p className="text-xs leading-5 text-gray-500">{plan.servings}인분 · 조리 {plan.recipe.cookTimeMin}분 · 레시피 기준 {plan.recipe.calories ?? '미제공'} kcal{plan.recipe.nutritionEstimated ? ' (추정치)' : ''}</p></div>
        <div data-meal-reason className="min-w-0">{plan.recommendationReason && <p className="h-full whitespace-pre-wrap break-all rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">{plan.recommendationReason}</p>}</div>
        <RecipeDetails key={plan.recipe.id} plan={plan} />
        <div data-meal-actions className="flex flex-wrap content-start items-start gap-2">{draft && <><button type="button" disabled={busy || Boolean(selection)} onClick={() => choose('regenerate', plan)} className="btn-secondary min-h-11"><RefreshCw aria-hidden="true" className="h-4 w-4" />다시 추천</button><button type="button" disabled={busy || Boolean(selection)} onClick={() => choose('confirm', plan)} className="btn-primary min-h-11">이 식단으로 확정</button></>}{plan.status !== MEAL_PLAN_STATUS.CANCELED && <button type="button" disabled={busy || Boolean(selection)} onClick={() => choose('cancel', plan)} className="btn-secondary min-h-11">식단 취소</button>}</div>
      </article>
    })}</div>}
    <div className="flex flex-wrap gap-3"><Link to="/fridge" className="btn-secondary min-h-11">냉장고 확인</Link><Link to="/shopping" className="btn-secondary min-h-11">장보기 목록 보기</Link></div>
    {selection && <MealConfirmation selection={selection} busy={busy} error={error} onClose={() => { setSelection(null); setError('') }} onConfirm={() => run(selection.action, selection.plan)} />}
  </div>
}

import { mealCardActions, recipePlanLink } from '@/api/cookingUx'
import { DailyMealInfo, DailyRecipePreview } from '@/components/recommend/DailyRecipePreview'
import { QuickCookingPanel } from '@/components/recommend/QuickCookingPanel'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { RefreshCw, Sparkles, UtensilsCrossed, X } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { useMealPlanAction, useMealPlans } from '@/api/mealPlans'
import { validRecipeDate } from '@/api/recipeInventory'
import { visibleMealPlans } from '@/api/mealPlanQueries'
import { Spinner } from '@/components/common/Spinner'
import { MealPlanStatusBadge, RecipeSourceBadge } from '@/components/common/StatusBadge'
import { today } from '@/lib/date'
import { MEAL_PLAN_STATUS, MEAL_TYPE, RECIPE_SOURCE } from '@/lib/enums'
import { MEAL_TYPE_LABEL } from '@/lib/labels'
import { formatQuantity } from '@/lib/format'

const ORDER = Object.values(MEAL_TYPE)

function RecipeDetails({ plan }) {
  return <div data-meal-details className="flex min-w-0 flex-col border-t border-gray-100 px-4 pt-4">
    <DailyRecipePreview plan={plan} />
  </div>
}

function MealConfirmation({ selection, busy, error, onClose, onConfirm }) {
  const dialog = useRef(null)
  const title = selection.action === 'confirm' ? '이 식단으로 결정할까요?' : selection.action === 'cancel' ? '이 식단을 취소할까요?' : '다시 추천받을까요?'
  useEffect(() => { const node = dialog.current; node.showModal(); return () => node.close() }, [])
  return <dialog ref={dialog} aria-label={title} onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl backdrop:bg-black/40">
    <div className="flex items-start justify-between gap-2"><h3 className="font-bold">{title}</h3><button type="button" disabled={busy} onClick={onClose} aria-label="식단 확인 창 닫기" className="btn-secondary min-h-11 px-3"><X aria-hidden="true" className="h-4 w-4" /></button></div>
    {selection.plan && <p className="mt-3 break-all text-sm font-semibold">{MEAL_TYPE_LABEL[selection.plan.mealType]} · {selection.plan.recipe.name}</p>}
    <p className="my-4 text-sm leading-6 text-gray-600">{selection.action === 'confirm' ? '식단을 확정하면 부족한 재료가 장보기 목록에 반영돼요. 냉장고 재고는 요리를 완료했을 때 차감됩니다.' : selection.action === 'cancel' ? '취소한 식단은 되돌릴 수 없으며, 확정 식단의 장보기 부족분은 다시 계산됩니다.' : '기존 추천 초안은 취소하고 새 초안을 만듭니다. 이미 확정한 끼니는 유지합니다.'}</p>
    {error && <p role="alert" className="mb-4 whitespace-pre-wrap break-all rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="btn-secondary min-h-11">돌아가기</button><button type="button" disabled={busy} onClick={onConfirm} className="btn-primary min-h-11">{busy ? '처리 중...' : selection.action === 'confirm' ? '식단 확정' : selection.action === 'cancel' ? '식단 취소' : '추천 실행'}</button></div>
  </dialog>
}

function RecommendDay({ date, setDate }) {
  const [servings, setServings] = useState('1')
  const [selection, setSelection] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [shortages, setShortages] = useState(null)
  const lock = useRef(false)
  const mutation = useMealPlanAction()
  const query = useMealPlans(date)
  const plans = visibleMealPlans(query.data, date, query)
  const canAct = validRecipeDate(date) && !query.isFetching && !query.isError && query.data?.planDate === date
  const allConfirmed = ORDER.every((type) => plans.some((plan) => plan.mealType === type && plan.status === MEAL_PLAN_STATUS.CONFIRMED))
  const busy = mutation.isPending

  async function run(action, plan) {
    if (lock.current || !canAct) return
    if (action !== 'recommend' && (!plan || plan.planDate !== date || !plans.some((row) => row.id === plan.id && row.status === plan.status))) {
      setError('선택한 식단이 현재 날짜의 최신 상태와 다릅니다. 다시 조회해 주세요.'); return
    }
    if (!date || !Number.isInteger(Number(servings)) || Number(servings) < 1 || Number(servings) > 10) {
      setError('날짜와 1~10 사이의 인분을 입력해 주세요.'); return
    }
    lock.current = true
    setError(''); setMessage('')
    try {
      const result = await mutation.mutateAsync({ action, id: plan?.id, date, servings: Number(servings) })
      setSelection(null)
      setShortages(action === 'confirm' ? result.shortages : null)
      setMessage(action === 'confirm' ? '식단을 확정했어요. 요리하기를 눌러 사용할 재료를 확인해 보세요.' : action === 'cancel' ? '식단을 취소했습니다.' : action === 'regenerate' ? '선택한 끼니를 다시 추천했습니다. 다른 끼니는 유지했습니다.' : '추천 초안을 저장했습니다. 끼니별로 확인 후 확정해 주세요.')
    } catch (failure) {
      setError(getErrorMessage(failure) + ((!failure.response || failure.response.status >= 500) ? ' 처리 여부가 불확실할 수 있으므로 같은 요청을 바로 반복하지 마세요. 날짜별 식단을 다시 조회해 서버 상태를 확인해 주세요.' : ''))
    } finally { lock.current = false }
  }
  function choose(action, plan) { if (!canAct || busy) return; setError(''); setSelection({ action, plan }) }
  return <div className="space-y-6">
    <section className="card space-y-4">
      <div><h2 className="flex items-center gap-2 text-base font-bold"><Sparkles aria-hidden="true" className="h-5 w-5 text-emerald-600" />냉장고 재료로 식단 추천받기</h2><p className="mt-2 text-sm leading-6 text-gray-600">보관 중인 재료를 참고해 아침·점심·저녁 초안을 만듭니다. 기한이 지난 재고는 추천에서 제외됩니다.</p></div>
      <form onSubmit={(event) => { event.preventDefault(); if (!canAct || busy) return; if (plans.length) choose('recommend'); else run('recommend') }} className="grid items-end gap-3 sm:grid-cols-[1fr_7rem_auto]">
        <div className="min-w-0"><label htmlFor="recommend-date" className="label">추천 날짜</label><input id="recommend-date" type="date" required value={date} disabled={busy || Boolean(selection)} onChange={(event) => { setDate(event.target.value); setShortages(null); setMessage(''); setError('') }} className="input min-h-11" /></div>
        <div><label htmlFor="recommend-servings" className="label">인분</label><input id="recommend-servings" type="number" min="1" max="10" step="1" required value={servings} disabled={busy || Boolean(selection)} onChange={(event) => setServings(event.target.value)} className="input min-h-11" /></div>
        <button type="submit" disabled={busy || !canAct || Boolean(selection) || allConfirmed} className="btn-primary min-h-11 bg-gradient-to-r from-emerald-600 to-teal-600"><Sparkles aria-hidden="true" className="h-4 w-4" />{busy ? '처리 중...' : plans.length ? '미확정 끼니 다시 추천' : '추천 받기'}</button>
      </form>
      <p className="text-xs leading-5 text-gray-500">추천 초안도 서버에 저장됩니다. 확정 식단은 전체 재추천에서도 유지되며, 새 인분은 새로 생성되는 초안에만 적용됩니다.</p>
    </section>
    {!validRecipeDate(date) && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">올바른 날짜를 선택해 주세요.</p>}
    {query.isFetching && <div role="status" className="card flex items-center gap-3 text-sm text-gray-600"><Spinner />{date} 식단을 서버에서 확인하고 있습니다.</div>}
    {query.isError && <div role="alert" className="space-y-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700"><p className="whitespace-pre-wrap break-all">{getErrorMessage(query.error, '날짜별 식단을 불러오지 못했습니다.')}</p><p>최신 서버 상태를 확인하지 못해 이전 식단은 표시하지 않습니다.</p><button type="button" disabled={query.isFetching} onClick={() => query.refetch({ cancelRefetch: false })} className="btn-secondary min-h-11">식단 다시 조회</button></div>}
    {busy && <div role="status" className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><Spinner />요청을 처리하고 있습니다. 추천은 시간이 걸릴 수 있습니다.</div>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    {error && !selection && <p role="alert" className="whitespace-pre-wrap break-all rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {shortages && <section className="card space-y-3"><h3 className="text-base font-bold">방금 확정한 식단의 부족분</h3>{shortages.length === 0 ? <p className="text-sm text-gray-600">서버 확인 결과 더 구매할 재료가 없어요.</p> : <ul className="space-y-2 text-sm">{shortages.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-2"><span className="min-w-0 break-all">{item.ingredientName}</span><span className="break-all font-semibold">{formatQuantity(item.remainingQty, item.unit)}</span></li>)}</ul>}<Link to="/shopping" className="btn-secondary min-h-11">장보기 목록 확인</Link></section>}
    {!canAct ? null : plans.length === 0 ? <div className="card py-12 text-center"><UtensilsCrossed aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-gray-300" /><h3 className="font-bold">이 날짜에 저장된 식단이 없어요</h3><p className="mt-2 text-sm leading-6 text-gray-500">날짜와 인분을 확인하고 추천받기를 눌러 새 초안을 만들어 보세요.</p></div> : <div className="grid gap-4 xl:grid-cols-3">{ORDER.map((type) => {
      const plan = plans.find((row) => row.mealType === type)
      if (!plan) return null
      const actions = mealCardActions(plan)
      const blocked = busy || Boolean(selection)
      const recipeLink = recipePlanLink(plan)
      const cookingLink = recipePlanLink(plan, true)
      return <article key={plan.id} data-meal-card={type} className="grid min-w-0 gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white pb-4 transition-colors hover:border-emerald-300 xl:row-span-5 xl:grid-rows-subgrid">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-3"><h3 className="flex items-center gap-2 text-sm font-bold"><span aria-hidden="true">{type === MEAL_TYPE.BREAKFAST ? '🌅' : type === MEAL_TYPE.LUNCH ? '☀️' : '🌙'}</span>{MEAL_TYPE_LABEL[type]}</h3><div className="flex flex-wrap gap-1"><MealPlanStatusBadge status={plan.status} />{actions.cooked && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">요리 완료</span>}</div></div>
        <div className="min-w-0 space-y-3 px-4"><h4 className="break-all text-lg font-extrabold text-gray-900">{plan.recipe.name}</h4>
        <div className="flex flex-wrap gap-2">{Object.values(RECIPE_SOURCE).includes(plan.recipe.source) && <RecipeSourceBadge source={plan.recipe.source} />}</div>
        <DailyMealInfo plan={plan} /></div>
        <div data-meal-reason className="min-w-0 px-4">{plan.recommendationReason && <p className="h-full whitespace-pre-wrap break-all rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">{plan.recommendationReason}</p>}</div>
        <RecipeDetails key={plan.recipe.id} plan={plan} />
        <div data-meal-actions className="grid content-start gap-2 border-t border-gray-100 px-4 pt-4 sm:grid-cols-2">
          {actions.canCook && <Link to={cookingLink || '#'} aria-disabled={blocked || !cookingLink} onClick={(event) => { if (blocked || !cookingLink) event.preventDefault() }} className="btn-primary min-h-11 sm:col-span-2">요리하기</Link>}
          {actions.cooked && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800 sm:col-span-2">요리를 완료한 식단이에요.</p>}
          <Link to={recipeLink || '#'} aria-disabled={blocked || !recipeLink} onClick={(event) => { if (blocked || !recipeLink) event.preventDefault() }} className="btn-secondary min-h-11">레시피 보기</Link>
          {actions.draft && <button type="button" disabled={blocked} onClick={() => choose('confirm', plan)} className="btn-primary min-h-11">이 식단으로 확정</button>}
          {actions.draft && <button type="button" disabled={blocked} onClick={() => choose('regenerate', plan)} className="btn-secondary min-h-11"><RefreshCw aria-hidden="true" className="h-4 w-4" />다시 추천</button>}
          {actions.canCancelPlan && <button type="button" disabled={blocked} onClick={() => choose('cancel', plan)} className="btn-secondary min-h-11">식단 취소</button>}
          {actions.cooked && <Link to="/fridge" className="btn-secondary min-h-11">냉장고 확인</Link>}
        </div>
      </article>
    })}</div>}
    <div className="flex flex-wrap gap-3"><Link to="/fridge" className="btn-secondary min-h-11">냉장고 확인</Link><Link to="/shopping" className="btn-secondary min-h-11">장보기 목록 보기</Link></div>
    {selection && <MealConfirmation selection={selection} busy={busy} error={error} onClose={() => { setSelection(null); setError('') }} onConfirm={() => run(selection.action, selection.plan)} />}
  </div>
}


export function RecommendPage() {
  const [params, setParams] = useSearchParams()
  const date = params.has('date') ? params.get('date') : today()
  const quick = params.get('mode') === 'quick'
  function setMode(value) {
    const next = new URLSearchParams(params)
    next.set('mode', value)
    setParams(next, { replace: true })
  }
  return <div className="space-y-6">
    <nav aria-label="추천 모드" className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-4">
      <button type="button" aria-pressed={!quick} onClick={() => setMode('daily')} className={`min-h-12 rounded-xl px-3 py-3 text-sm font-bold ${!quick ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/20' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>하루 AI 식단</button>
      <button type="button" aria-pressed={quick} onClick={() => setMode('quick')} className={`min-h-12 rounded-xl px-3 py-3 text-sm font-bold ${quick ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/20' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>냉장고 맞춤 15분 요리</button>
    </nav>
    <div hidden={quick}><RecommendDay key={date} date={date} setDate={(value) => {
      const next = new URLSearchParams(params)
      next.set('date', value)
      setParams(next, { replace: true })
    }} /></div>
    <div hidden={!quick}><QuickCookingPanel /></div>
  </div>
}
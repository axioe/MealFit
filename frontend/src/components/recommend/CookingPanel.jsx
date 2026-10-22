import { ActualIngredientsEditor } from './ActualIngredientsEditor'
import { analyzeUsage, canUseDefaultCooking, prepareActualUsageDraft, syncUsageSession } from '@/api/actualUsage'
import { CookingPreview } from './CookingPreview'
import { CookingResult } from './CookingResult'
import { Link } from 'react-router-dom'
import { validRecipeDate, validRecipeId } from '@/api/recipeInventory'
import { useEffect, useRef, useState } from 'react'
import { ChefHat } from 'lucide-react'
import { useMealPlans } from '@/api/mealPlans'
import { useCookingAction, useCookingPreview } from '@/api/cooking'
import { canCancelCooking, cookingErrorMessage, createCookingSubmission, resolveCookingTarget } from '@/api/cookingFlows'
import { MEAL_TYPE_LABEL } from '@/lib/labels'

export function CookingPanel({ recipeId, mealPlanId, date, servings, recipeReady, onBusyChange, focusCooking, inventory, usageScope }) {
  const panel = useRef(null)
  const finalCheck = useRef(null)
  const plans = useMealPlans(date)
  const target = resolveCookingTarget({ mealPlanId, recipeId, date, servings, result: plans.data, isFetching: plans.isFetching, isError: plans.isError, recipeReady })
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const [event, setEvent] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const submit = useRef(createCookingSubmission())
  const mutation = useCookingAction(date)
  const preview = useCookingPreview(target.plan, open && !target.reason && !target.plan?.cooked)
  const visiblePreview = open && !target.reason && !target.plan?.cooked && !preview.isFetching && !preview.isError && preview.data?.servings === target.plan?.servings && String(preview.data?.mealPlanId) === String(target.plan?.id) ? preview.data : null
  const scope = JSON.stringify([recipeId, mealPlanId, date, usageScope])
  const [usageSession, setUsageSession] = useState({ scope, baseline: null, rows: [] })
  const session = syncUsageSession(usageSession, scope, visiblePreview)
  if (session !== usageSession) setUsageSession(session)
  const inventoryReady = Boolean(inventory.data) && !inventory.isFetching && !inventory.isError
  const analysis = analyzeUsage(session.rows, session.baseline ?? [], inventory.data, inventoryReady)
  const preparedDraft = prepareActualUsageDraft({ mealPlanId, recipeId, date, servings }, session.rows, analysis)
  const [stockStamp, setStockStamp] = useState({ previewAt: 0, inventoryAt: 0 })
  let currentStamp = stockStamp
  if (visiblePreview && inventoryReady && stockStamp.previewAt !== preview.dataUpdatedAt) {
    currentStamp = { previewAt: preview.dataUpdatedAt, inventoryAt: inventory.dataUpdatedAt }
    setStockStamp(currentStamp)
  }
  const stockChanged = Boolean(visiblePreview) && currentStamp.inventoryAt !== inventory.dataUpdatedAt
  const defaultAllowed = canUseDefaultCooking({ ...analysis, inventoryReady, stockChanged })
  function updateRows(rows) { setUsageSession({ ...session, rows }); setConfirmation(null) }
  const canComplete = defaultAllowed && visiblePreview?.canCook === true && !visiblePreview.cooked && !mutation.isPending && !uncertain
  const canCancel = canCancelCooking(target.plan, event) && !mutation.isPending && !uncertain
  const busy = mutation.isPending
  const currentEvent = event && String(event.mealPlanId) === String(mealPlanId) ? event : null
  useEffect(() => {
    if (!focusCooking || plans.isFetching || !recipeReady) return
    panel.current?.scrollIntoView({ block: 'start' })
    panel.current?.focus({ preventScroll: true })
  }, [focusCooking, recipeId, mealPlanId, date, plans.isFetching, recipeReady])
  useEffect(() => {
    if (!confirmation) return
    finalCheck.current?.focus({ preventScroll: true })
    finalCheck.current?.scrollIntoView({ block: 'nearest' })
  }, [confirmation])

  async function run(action) {
    if ((action === 'complete' && !canComplete) || (action === 'cancel' && !canCancel)) return
    await submit.current(async () => {
      onBusyChange(true)
      setError(''); setMessage('')
      try {
        const result = await mutation.mutateAsync({ action, id: action === 'complete' ? target.plan.id : event.id })
        if (String(result.mealPlanId) !== String(target.plan.id) || !result.id || result.status !== (action === 'complete' ? 'COOKED' : 'RESTORED')) throw new Error('조리 응답을 확인하지 못했습니다.')
        setEvent(result)
        setConfirmation(null)
        setOpen(false)
        setMessage('')
      } catch (failure) {
        setError(cookingErrorMessage(failure))
        if (!failure.response || failure.response.status >= 500) setUncertain(true)
        setConfirmation(null)
      } finally { onBusyChange(false) }
    })
  }

  async function checkServer() {
    if (!validRecipeId(mealPlanId) || !validRecipeDate(date)) return
    setConfirmation(null)
    const result = await plans.refetch({ cancelRefetch: false })
    if (!result.isError) { setUncertain(false); setOpen(false); setError(''); setMessage('최신 식단 상태를 확인했어요. 요리 전 재료를 다시 확인해 주세요.') }
  }
  return <section ref={panel} id="cook" tabIndex={-1} className="card scroll-mt-24 space-y-4 focus-visible:outline-2 focus-visible:outline-emerald-600" aria-labelledby="recipe-cooking-title">
    <h3 id="recipe-cooking-title" className="flex items-center gap-2 text-lg font-extrabold"><ChefHat aria-hidden="true" className="h-5 w-5 text-emerald-600" />요리하기</h3>
    {target.plan && <p className="text-sm text-gray-600">{target.plan.planDate} · {MEAL_TYPE_LABEL[target.plan.mealType]} · {target.plan.servings}인분 · {target.plan.cooked ? '요리 완료' : '요리 전'}</p>}
    {target.reason && <p className="text-sm leading-6 text-amber-800">{target.reason}</p>}
    <p className="text-xs leading-5 text-gray-500">확정한 인분에 맞춰 사용할 재료를 확인해 주세요. 재료는 요리를 완료했을 때 냉장고에서 차감돼요.</p>
    {target.plan?.cooked && !currentEvent && <div className="space-y-3 rounded-xl bg-emerald-50 p-4"><h4 className="font-bold text-emerald-900">요리가 완료됐어요!</h4><p className="text-sm text-emerald-800">사용한 재료가 냉장고 재고에 반영됐어요.</p><Link to="/fridge" className="btn-primary min-h-11">냉장고 확인</Link></div>}
    {target.plan?.cooked && !canCancelCooking(target.plan, currentEvent) && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">현재 조리 기록을 확인할 수 없어 취소할 수 없어요.</p>}
    <div className="grid gap-2 sm:flex sm:flex-wrap">
      {!target.plan?.cooked && <button type="button" disabled={Boolean(target.reason) || !target.plan || busy || uncertain || preview.isFetching} onClick={() => { setOpen(true); setConfirmation(null); setError(''); if (open) preview.refetch({ cancelRefetch: false }) }} className="btn-primary min-h-11">{preview.isFetching ? '재료 확인 중…' : '요리 전 재료 확인'}</button>}
      {target.plan?.cooked && !canCancelCooking(target.plan, currentEvent) && <button type="button" disabled className="btn-secondary min-h-11">요리 완료 취소</button>}
      <button type="button" disabled={busy || plans.isFetching || !validRecipeId(mealPlanId) || !validRecipeDate(date)} onClick={checkServer} className="btn-secondary min-h-11">최신 상태 확인</button>
    </div>
    {busy && <p role="status" className="text-sm text-emerald-700">요리 정보를 반영하고 있어요. 잠시만 기다려 주세요.</p>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {error && <p role="alert" className="whitespace-pre-wrap break-all rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {uncertain && <p className="text-sm leading-6 text-amber-900">처리 결과를 확인하지 못했어요. 같은 요청을 반복하지 말고 최신 상태를 확인해 주세요. 조리 기록을 확인할 수 없다면 취소가 제한될 수 있어요.</p>}
    {open && preview.isFetching && <p role="status" className="text-sm text-gray-500">현재 재고로 사용할 재료를 확인하고 있어요.</p>}
    {open && preview.isError && <p role="alert" className="text-sm text-rose-700">{cookingErrorMessage(preview.error)}</p>}
    {visiblePreview && session.baseline && <ActualIngredientsEditor key={scope} session={session} analysis={analysis} inventoryReady={inventoryReady} disabled={busy || inventory.isFetching} preparedDraft={preparedDraft} onRowsChange={updateRows} onReset={() => { setUsageSession({ ...session, rows: session.baseline.map((row) => ({ ...row })), notice: '레시피 기준으로 되돌렸어요.' }); setConfirmation(null) }} />}
    {visiblePreview && !inventoryReady && <p role="status" className="text-sm text-amber-900">냉장고 재고를 확인할 수 없어 요리 완료를 잠시 제한했어요. 재고를 다시 조회해 주세요.</p>}
    {stockChanged && <p role="status" className="text-sm text-amber-900">재고가 바뀌었어요. 요리 전 재료를 다시 확인해 주세요.</p>}
    {visiblePreview && !analysis.dirty && !stockChanged && <CookingPreview preview={visiblePreview} canComplete={canComplete} onComplete={() => setConfirmation('complete')} />}
    {confirmation && (confirmation !== 'complete' || canComplete) && <div ref={finalCheck} tabIndex={-1} role="group" aria-label="요리 최종 확인" className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><h4 className="font-bold">{confirmation === 'complete' ? '요리를 완료할까요?' : '요리 완료를 취소할까요?'}</h4><p className="text-sm leading-6 text-gray-600">{confirmation === 'complete' ? '요리 완료를 누르면 사용한 재료가 냉장고 재고에서 자동으로 차감돼요.' : '사용한 재료를 원래 보관된 곳에 복원해요. 식단 자체를 취소하는 기능과는 달라요.'}</p><div className="grid gap-2 sm:flex sm:flex-wrap"><button type="button" disabled={busy} onClick={() => setConfirmation(null)} className="btn-secondary min-h-11">돌아가기</button><button type="button" disabled={busy || (confirmation === 'complete' ? !canComplete : !canCancel)} onClick={() => run(confirmation)} className="btn-primary min-h-11">{confirmation === 'complete' ? '요리 완료' : '요리 완료 취소'}</button></div></div>}
    {currentEvent && <CookingResult event={currentEvent} offerCancel={canCancelCooking(target.plan, currentEvent)} canCancel={canCancel} onCancel={() => setConfirmation('cancel')} />}
  </section>
}

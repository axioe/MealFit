import { useEffect, useRef, useState } from 'react'
import { ChefHat } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ActualIngredientsEditor } from './ActualIngredientsEditor'
import { ServerCookingActions } from './ServerCookingActions'
import { analyzeUsage, prepareActualUsageDraft, syncUsageSession } from '@/api/actualUsage'
import { cookingBody } from '@/api/cookingUsage'
import { useMealPlans } from '@/api/mealPlans'
import { resolveCookingTarget } from '@/api/cookingFlows'
import { MEAL_TYPE_LABEL } from '@/lib/labels'

export function CookingPanel({ recipeId, mealPlanId, date, servings, recipeReady, onBusyChange, focusCooking, inventory, usageScope, ingredients = [] }) {
  const panel = useRef(null)
  const plans = useMealPlans(date)
  const target = resolveCookingTarget({ mealPlanId, recipeId, date, servings, result: plans.data, isFetching: plans.isFetching, isError: plans.isError, recipeReady })
  const scope = JSON.stringify([recipeId, mealPlanId, date, usageScope])
  const [usageSession, setUsageSession] = useState({ scope, baseline: null, rows: [] })
  const session = syncUsageSession(usageSession, scope, { ingredients: ingredients.map((item) => ({ ...item, requiredQty: item.quantity })) })
  if (session !== usageSession) setUsageSession(session)
  const [locked, setLocked] = useState(false)
  const [openScope, setOpenScope] = useState(null)
  const ready = Boolean(inventory.data) && !inventory.isFetching && !inventory.isError
  const analysis = analyzeUsage(session.rows, session.baseline ?? [], inventory.data, ready)
  const draft = prepareActualUsageDraft({ mealPlanId, recipeId, date, servings }, session.rows, analysis)
  let body = null, inputError = ''
  try { body = cookingBody('meal', { mealPlanId }, session.rows) } catch (failure) { inputError = failure.message }
  useEffect(() => {
    if (!focusCooking || plans.isFetching || !recipeReady) return
    panel.current?.scrollIntoView({ block: 'start' }); panel.current?.focus({ preventScroll: true })
  }, [focusCooking, recipeId, mealPlanId, date, plans.isFetching, recipeReady])
  const open = openScope === scope
  return <section ref={panel} id="cook" tabIndex={-1} aria-label="요리하기" className="card scroll-mt-24 space-y-4">
    <h3 className="flex items-center gap-2 text-lg font-extrabold"><ChefHat aria-hidden="true" className="h-5 w-5 text-emerald-600" />요리하기</h3>
    {target.plan && <p className="text-sm text-gray-600">{date} · {MEAL_TYPE_LABEL[target.plan.mealType]} · {servings}인분 · {target.plan.cooked ? '요리 완료' : '요리 전'}</p>}
    {target.reason && <p className="text-sm text-amber-900">{target.reason}</p>}
    {!open && target.plan?.cooked && <div className="space-y-3 rounded-xl bg-emerald-50 p-4"><h4 className="font-bold">요리가 완료됐어요!</h4><p className="text-sm">현재 조리 기록을 확인할 수 없어 취소할 수 없어요.</p><Link to="/fridge" className="btn-primary min-h-11">냉장고 확인</Link></div>}
    {!open && !target.plan?.cooked && <button type="button" disabled={Boolean(target.reason) || !target.plan} onClick={() => setOpenScope(scope)} className="btn-primary min-h-11">요리 전 재료 확인</button>}
    <button type="button" disabled={plans.isFetching} onClick={() => plans.refetch({ cancelRefetch: false })} className="btn-secondary min-h-11">최신 상태 확인</button>
    {open && <>
      <p className="text-xs leading-6 text-gray-500">식단 요리에서는 기존 레시피 재료의 수량을 변경하거나 제외할 수 있어요. 새로운 재료를 추가한 경우에는 재고 자동 반영이 아직 지원되지 않아요.</p>
      <ActualIngredientsEditor key={scope} session={session} analysis={analysis} inventoryReady={ready} disabled={locked || inventory.isFetching} preparedDraft={draft} actualUsageSupported={!inputError} onRowsChange={(rows) => setUsageSession({ ...session, rows })} onReset={() => setUsageSession({ ...session, rows: session.baseline.map((row) => ({ ...row })), notice: '레시피 기준으로 되돌렸어요.' })} />
      <ServerCookingActions key={scope} mode="meal" body={body} inputError={inputError || (Object.keys(analysis.errors).length ? '입력값과 사용 가능한 재고를 확인해 주세요.' : '')} inventory={inventory} blockedReason={target.reason || (!target.plan ? '식단 정보를 다시 확인해 주세요.' : target.plan.cooked ? '이미 조리 완료한 식단이에요.' : '')} date={date} onLockChange={setLocked} onBusyChange={onBusyChange} />
    </>}
  </section>
}

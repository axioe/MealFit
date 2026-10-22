import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { cookingApi } from '@/api/cooking'
import { queryKeys } from '@/api/queryKeys'
import { cookingErrorMessage, createCookingSubmission, refreshCookingQueries } from '@/api/cookingFlows'
import { canCompleteUsage, createCookingIntent, loadPendingCooking, savePendingCooking, validateUsagePreview, validateCookingEvent } from '@/api/cookingUsage'
import { CookingPreview } from './CookingPreview'
import { CookingResult } from './CookingResult'

export function ServerCookingActions({ mode, body, inputError, inventory, blockedReason, date, onLockChange, onBusyChange }) {
  const client = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)
  const intent = useRef(createCookingIntent())
  const eventRequest = useRef(null)
  const submit = useRef(createCookingSubmission())
  const [requested, setRequested] = useState(null)
  const [event, setEvent] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [error, setError] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const [pending, setPending] = useState(() => {
    if (mode !== 'ingredients') return null
    try { return loadPendingCooking(sessionStorage, userId) }
    catch { return { invalid: true } }
  })
  const signature = JSON.stringify(body)
  const ready = Boolean(body) && !inputError && !blockedReason && !inventory.isFetching && !inventory.isError && Boolean(inventory.data)
  const snapshot = JSON.stringify([signature, inventory.dataUpdatedAt])
  const preview = useQuery({
    queryKey: ['cooking', 'actual-preview', mode, snapshot],
    queryFn: async ({ signal }) => validateUsagePreview(await (mode === 'meal' ? cookingApi.previewUsages(body, signal) : cookingApi.previewIngredients(body, signal)), body, mode),
    enabled: ready && requested === snapshot && !event && !pending && !uncertain,
    retry: false, staleTime: 0, refetchOnMount: 'always',
  })
  const mutation = useMutation({ retry: false,
    mutationFn: ({ action, payload, eventId }) => action === 'cancel' ? cookingApi.cancel(eventId)
      : mode === 'meal' ? cookingApi.completeUsages(payload) : cookingApi.completeIngredients(payload),
    onSettled: () => Promise.allSettled([refreshCookingQueries(client, date), client.invalidateQueries({ queryKey: queryKeys.mealPlans.all })]),
  })
  const busy = mutation.isPending || uncertain || Boolean(pending)
  useEffect(() => { onBusyChange?.(busy) }, [busy, onBusyChange])
  const locked = mutation.isPending || uncertain || Boolean(pending) || event?.status === 'COOKED'
  useEffect(() => { onLockChange?.(locked) }, [locked, onLockChange])
  const visible = ready && requested === snapshot && !preview.isFetching && !preview.isError && !event && !pending && !uncertain ? preview.data : null
  const canComplete = !mutation.isPending && canCompleteUsage({ preview: visible, ready, requested, snapshot, fetching: preview.isFetching, pending, uncertain, event })
  const canCancel = event?.status === 'COOKED' && !mutation.isPending && !uncertain

  async function run(action, recovering = false) {
    if (mutation.isPending || (action === 'cancel' ? !canCancel : recovering ? !pending || pending.invalid : !canComplete)) return
    await submit.current(async () => {
      setError(''); setConfirmation(null)
      let payload = action === 'cancel' ? eventRequest.current : body
      try {
        if (action === 'complete' && mode === 'ingredients') {
          payload = recovering ? pending : intent.current.prepare(body)
          // 서버 처리 여부가 불확실할 때 새 요청으로 차감하지 않는다.
          savePendingCooking(sessionStorage, userId, payload)
          setPending(payload)
        }
        const response = await mutation.mutateAsync({ action, payload, eventId: event?.id })
        const result = validateCookingEvent(response, payload, mode, action, event?.id)
        eventRequest.current = payload
        setEvent(result); setUncertain(false); setRequested(null)
        if (mode === 'ingredients') { savePendingCooking(sessionStorage, userId, null); setPending(null); intent.current.clear() }
      } catch (failure) {
        setError(cookingErrorMessage(failure))
        const code = failure.response?.data?.code
        const ambiguous = !failure.response || failure.response.status >= 500 || code === 'COOKING_009'
        setUncertain(ambiguous)
        setRequested(null)
        if (!ambiguous && mode === 'ingredients') { savePendingCooking(sessionStorage, userId, null); setPending(null) }
      }
    })
  }

  return <div className="space-y-4">
    {inputError && !event && <p role="alert" className="text-sm leading-6 text-amber-900">{inputError}</p>}
    {blockedReason && !event && <p className="text-sm leading-6 text-amber-900">{blockedReason}</p>}
    {!event && !pending && !uncertain && <button type="button" disabled={!ready || mutation.isPending || preview.isFetching} onClick={() => { setRequested(snapshot); setConfirmation(null); setError(''); if (requested === snapshot) preview.refetch({ cancelRefetch: false }) }} className="btn-primary min-h-11">{preview.isFetching ? '재료 확인 중…' : '요리 전 재료 확인'}</button>}
    {requested && requested !== snapshot && !event && !pending && <p role="status" className="text-sm text-amber-900">재료나 재고가 바뀌었어요. 요리 전 재료를 다시 확인해 주세요.</p>}
    {preview.isFetching && <p role="status" className="text-sm text-gray-500">서버에서 실제 사용량과 냉장고 재고를 확인하고 있어요.</p>}
    {preview.isError && requested === snapshot && <p role="alert" className="text-sm text-rose-700">{cookingErrorMessage(preview.error)}</p>}
    {error && <p role="alert" className="break-all text-sm text-rose-700">{error}</p>}
    {mutation.isPending && <p role="status" className="text-sm text-emerald-700">처리 중이에요. 다시 누르지 말고 기다려 주세요.</p>}
    {pending && <div className="space-y-3 rounded-xl bg-amber-50 p-3"><p className="break-all text-sm leading-6 text-amber-900">이전 조리 요청{pending.recipeName ? ` (${pending.recipeName})` : ''}의 결과 확인이 필요해요. 새 조리를 시작하지 않고 같은 요청으로 확인해요.</p><ul className="space-y-1 text-xs text-amber-900">{pending.ingredients?.map((item, index) => <li key={index} className="break-all">이전 요청: {item.ingredientName} · {item.quantity}{item.unit}</li>)}</ul><button type="button" disabled={mutation.isPending || pending.invalid} onClick={() => run('complete', true)} className="btn-secondary min-h-11">동일 요청으로 결과 확인</button></div>}
    {uncertain && !pending && <p role="alert" className="text-sm leading-6 text-amber-900">처리 결과가 불확실해 추가 요청을 제한했어요. 최신 식단·냉장고 이력을 확인해 주세요. 이 요청은 서버에서 동일 요청 재조회가 지원되지 않아요.</p>}
    {visible && <CookingPreview preview={visible} canComplete={canComplete} onComplete={() => setConfirmation('complete')} />}
    {confirmation && (confirmation === 'cancel' ? canCancel : canComplete) && <section role="group" aria-label="요리 최종 확인" className="space-y-3 rounded-xl bg-amber-50 p-4"><h4 className="font-bold">{confirmation === 'cancel' ? '요리 완료를 취소할까요?' : '실제 사용량으로 요리를 완료할까요?'}</h4><p className="text-sm leading-6">{confirmation === 'cancel' ? '조리 당시 사용한 양을 원래 냉장고 재고에 복원해요.' : '서버에서 확인한 사용량으로 냉장고 재고가 차감돼요.'}</p><div className="grid gap-2 sm:flex"><button type="button" onClick={() => setConfirmation(null)} className="btn-secondary min-h-11">돌아가기</button><button type="button" disabled={mutation.isPending} onClick={() => run(confirmation)} className="btn-primary min-h-11">{confirmation === 'cancel' ? '요리 완료 취소' : '요리 완료'}</button></div></section>}
    {event?.status === 'RESTORED' && <button type="button" onClick={() => { setEvent(null); setRequested(null); setError(''); eventRequest.current = null; intent.current.clear() }} className="btn-secondary min-h-11">다시 요리 준비하기</button>}
    {event && <><p className="break-all text-sm font-semibold">{event.recipeName}</p><CookingResult event={event} offerCancel={event.status === 'COOKED'} canCancel={canCancel} onCancel={() => setConfirmation('cancel')} /></>}
  </div>
}

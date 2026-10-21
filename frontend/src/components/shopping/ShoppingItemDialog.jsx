import { useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { useShoppingAction } from '@/api/shopping'
import { buildPurchase, buildStockIn } from '@/api/shoppingValidation'
import { STORAGE_LOCATION } from '@/lib/enums'
import { STORAGE_LABEL } from '@/lib/labels'
import { formatQuantity } from '@/lib/format'

export function ShoppingItemDialog({ item, mode, onClose, onSuccess }) {
  const dialog = useRef(null)
  const lock = useRef(false)
  const id = useId()
  const mutation = useShoppingAction()
  const stockIn = mode === 'stockIn'
  const [form, setForm] = useState({ quantity: stockIn ? String(item.purchasedQty) : '',
    storageLocation: STORAGE_LOCATION.FRIDGE, expiryDate: '', minStockQty: '0' })
  const [error, setError] = useState('')
  const [uncertain, setUncertain] = useState(false)
  useEffect(() => { const node = dialog.current; node.showModal(); return () => node.close() }, [])
  function change(event) {
    const { name, value } = event.target
    setForm((old) => ({ ...old, [name]: value }))
    setError('')
  }
  async function submit(event) {
    event.preventDefault()
    if (lock.current || uncertain) return
    let body
    try { body = stockIn ? buildStockIn(item, form) : buildPurchase(item, form.quantity) }
    catch (failure) { setError(failure.message); return }
    lock.current = true
    try {
      await mutation.mutateAsync({ action: mode, body })
      onSuccess(stockIn ? '구매분을 새 재고 묶음으로 입고했습니다.' : '구매 수량을 기록했습니다. 냉장고 입고는 별도로 진행해 주세요.')
    } catch (failure) {
      setError(getErrorMessage(failure))
      if (!failure.response || failure.response.status >= 500) setUncertain(true)
    } finally { lock.current = false }
  }
  return <dialog ref={dialog} aria-labelledby={`${id}-title`}
    onCancel={(event) => { event.preventDefault(); if (!mutation.isPending) onClose() }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl backdrop:bg-black/40">
    <div className="mb-4 flex items-start justify-between gap-2">
      <h3 id={`${id}-title`} className="text-base font-bold">{stockIn ? '구매분 냉장고 입고' : '구매 수량 기록'}</h3>
      <button type="button" aria-label="장보기 창 닫기" disabled={mutation.isPending} onClick={onClose} className="btn-secondary min-h-11 px-3"><X aria-hidden="true" className="h-4 w-4" /></button>
    </div>
    <p className="break-all font-bold text-gray-900">{item.ingredientName}</p>
    <dl className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 text-xs">
      <div><dt className="text-gray-500">사야 할 총량 (부족분)</dt><dd className="mt-1 break-all font-semibold">{formatQuantity(item.requiredQty, item.unit)}</dd></div>
      <div><dt className="text-gray-500">구매 후 입고 대기</dt><dd className="mt-1 break-all font-semibold">{formatQuantity(item.purchasedQty, item.unit)}</dd></div>
      <div className="col-span-2"><dt className="text-gray-500">더 살 수량</dt><dd className="mt-1 break-all font-semibold">{formatQuantity(item.remainingQty, item.unit)}</dd></div>
    </dl>
    <p className="my-4 text-xs leading-5 text-gray-600">{stockIn ? '입고에 성공한 수량만 냉장고에 추가하며, 입고 대기 수량에서 차감합니다.' : '이번에 추가로 구매한 수량을 입력하세요. 서버에는 기존 구매량을 합친 총수량을 보냅니다. 필요량보다 많이 구매하는 것도 허용됩니다.'}</p>
    <form onSubmit={submit} noValidate aria-busy={mutation.isPending}>
      <fieldset disabled={mutation.isPending || uncertain} className="min-w-0 space-y-4 disabled:opacity-60">
        <div><label htmlFor={`${id}-quantity`} className="label">{stockIn ? '입고할 수량' : '이번에 구매한 수량'} ({item.unit}) *</label>
          <input id={`${id}-quantity`} name="quantity" inputMode="decimal" value={form.quantity} onChange={change} className="input min-h-11" />
        </div>
        {stockIn && <>
          <div><label htmlFor={`${id}-location`} className="label">보관 위치 *</label><select id={`${id}-location`} name="storageLocation" value={form.storageLocation} onChange={change} className="input min-h-11">{Object.values(STORAGE_LOCATION).map((value) => <option key={value} value={value}>{STORAGE_LABEL[value]}</option>)}</select></div>
          <div><label htmlFor={`${id}-expiry`} className="label">소비기한 (선택)</label><input id={`${id}-expiry`} type="date" name="expiryDate" value={form.expiryDate} onChange={change} className="input min-h-11" /></div>
          <div><label htmlFor={`${id}-minimum`} className="label">최소 유지 수량 ({item.unit})</label><input id={`${id}-minimum`} inputMode="decimal" name="minStockQty" value={form.minStockQty} onChange={change} className="input min-h-11" /></div>
        </>}
        <button type="submit" className="btn-primary min-h-11 w-full">{mutation.isPending ? '처리 중...' : stockIn ? '냉장고에 입고하기' : '구매 수량 저장'}</button>
      </fieldset>
      {error && <p role="alert" className="mt-4 whitespace-pre-wrap break-all rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {uncertain && <p role="alert" className="mt-3 text-sm leading-6 text-amber-800">서버 처리 결과가 불확실합니다. 중복 요청을 막기 위해 재전송을 중단했습니다. 창을 닫고 목록과 냉장고를 새로고침하여 결과를 확인해 주세요.</p>}
    </form>
  </dialog>
}

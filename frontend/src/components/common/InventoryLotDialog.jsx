import { useEffect, useId, useRef, useState } from 'react'
import { Pencil, TriangleAlert, X } from 'lucide-react'
import { getErrorCode, getErrorMessage } from '@/api/client'
import { useUpdateLot } from '@/api/inventory'
import { LOT_STATUS, STORAGE_LOCATION } from '@/lib/enums'
import { STORAGE_LABEL } from '@/lib/labels'

function validQuantity(text, positive = false) {
  return /^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(text.trim())
    && Number.isFinite(Number(text)) && Number(text) <= 999999999.999
    && (positive ? Number(text) > 0 : Number(text) >= 0)
}

function adjustBody(form, lot) {
  const body = {}
  if (Number(form.quantity) !== Number(lot.quantity)) body.quantity = Number(form.quantity)
  if (form.storageLocation !== lot.storageLocation) body.storageLocation = form.storageLocation
  if (form.expiryDate !== (lot.expiryDate ?? '')) {
    if (form.expiryDate) body.expiryDate = form.expiryDate
    else body.clearExpiryDate = true
  }
  if (Number(form.minStockQty) !== Number(lot.minStockQty)) body.minStockQty = Number(form.minStockQty)
  if (form.memo !== (lot.memo ?? '')) body.memo = form.memo
  return body
}

export function InventoryLotDialog({ lot, mode, onClose, onSuccess }) {
  const isDisposal = mode === 'dispose'
  const id = useId()
  const dialogRef = useRef(null)
  const submitLock = useRef(false)
  const mutation = useUpdateLot()
  const [form, setForm] = useState({
    quantity: String(lot.quantity), storageLocation: lot.storageLocation,
    expiryDate: lot.expiryDate ?? '', minStockQty: String(lot.minStockQty ?? 0),
    memo: isDisposal ? '' : lot.memo ?? '',
  })
  const [confirmed, setConfirmed] = useState(false)
  const [errors, setErrors] = useState({})
  const body = adjustBody(form, lot)
  const hasChanges = Object.keys(body).length > 0
  const validDisposal = validQuantity(form.quantity, true) && Number(form.quantity) <= Number(lot.quantity)
  const remaining = validDisposal ? (Math.round(Number(lot.quantity) * 1000) - Math.round(Number(form.quantity) * 1000)) / 1000 : null
  const requiresConfirmation = isDisposal ? validDisposal && remaining === 0 : validQuantity(form.quantity) && Number(form.quantity) === 0
  const inactive = lot.status !== LOT_STATUS.ACTIVE
  const code = getErrorCode(mutation.error)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  function changeField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors({})
    if (name === 'quantity') setConfirmed(false)
    if (mutation.isError) mutation.reset()
  }

  async function submit(event) {
    event.preventDefault()
    if (submitLock.current || inactive) return
    const nextErrors = {}
    if (!validQuantity(form.quantity, isDisposal)) nextErrors.quantity = isDisposal
      ? '0보다 큰 수량을 정수 9자리, 소수 3자리 이내로 입력해 주세요.'
      : '수량은 0 이상, 정수 9자리, 소수 3자리 이내로 입력해 주세요.'
    else if (isDisposal && Number(form.quantity) > Number(lot.quantity)) nextErrors.quantity = '현재 재고보다 많이 폐기할 수 없습니다.'
    if (!isDisposal) {
      if (!Object.values(STORAGE_LOCATION).includes(form.storageLocation)) nextErrors.storageLocation = '보관 위치를 선택해 주세요.'
      if (!validQuantity(form.minStockQty.trim() === '' ? '0' : form.minStockQty)) nextErrors.minStockQty = '최소 유지 수량은 0 이상, 정수 9자리, 소수 3자리 이내로 입력해 주세요.'
      if (form.expiryDate) {
        const date = new Date(form.expiryDate + 'T00:00:00Z')
        if (!/^\d{4}-\d{2}-\d{2}$/.test(form.expiryDate) || Number.isNaN(date.getTime())
          || date.toISOString().slice(0, 10) !== form.expiryDate) nextErrors.expiryDate = '올바른 소비기한을 입력해 주세요.'
      }
      if (!hasChanges) nextErrors.form = '변경한 내용이 없습니다.'
    }
    if (form.memo.length > 255) nextErrors.memo = '메모는 255자 이내로 입력해 주세요.'
    if (requiresConfirmation && !confirmed) nextErrors.confirmation = '안내를 확인하고 체크해 주세요.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    submitLock.current = true
    try {
      const result = await mutation.mutateAsync({
        id: lot.id,
        body: isDisposal ? { action: 'DISPOSE', quantity: Number(form.quantity), ...(form.memo && { memo: form.memo }) } : { action: 'ADJUST', ...body },
      })
      onSuccess(result, isDisposal)
    } catch {
      // 실패 시 입력 내용과 기존 목록을 유지한다.
    } finally {
      submitLock.current = false
    }
  }

  function propsFor(name) {
    return { id: `${id}-${name}`, name, value: form[name], onChange: changeField, className: 'input min-h-11',
      'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined }
  }
  function errorFor(name) {
    return errors[name] ? <p id={`${id}-${name}-error`} className="mt-1 text-xs text-rose-700">{errors[name]}</p> : null
  }

  return (
    <dialog ref={dialogRef} aria-labelledby={`${id}-title`} onCancel={(event) => { event.preventDefault(); if (!mutation.isPending) onClose() }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-xl backdrop:bg-black/40 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <h3 id={`${id}-title`} className="flex items-center gap-2 text-base font-bold">
          {isDisposal ? <TriangleAlert aria-hidden="true" className="h-5 w-5 text-rose-600" /> : <Pencil aria-hidden="true" className="h-5 w-5 text-emerald-600" />}
          {isDisposal ? '재고 폐기' : '재고 묶음 수정'}
        </h3>
        <button type="button" aria-label="재고 관리 창 닫기" disabled={mutation.isPending} onClick={onClose} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed"><X aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <div className="mb-4 rounded-xl bg-gray-50 p-3">
        <p className="break-all text-sm font-bold">{lot.ingredientName} <span className="font-normal text-gray-500">({lot.unit})</span></p>
        <p className="mt-1 text-xs text-gray-500">묶음 #{lot.id} · 현재 수량 {lot.quantity}{lot.unit}</p>
        {!isDisposal && <p className="mt-1 text-xs text-gray-500">식재료명과 단위는 변경할 수 없습니다.</p>}
      </div>
      {inactive && <p role="alert" className="mb-4 text-sm text-rose-700">이미 소진되거나 폐기된 묶음은 변경할 수 없습니다.</p>}
      <form onSubmit={submit} noValidate aria-busy={mutation.isPending}>
        <fieldset disabled={mutation.isPending || inactive} className="min-w-0 space-y-4 disabled:opacity-70">
          <div>
            <label className="label" htmlFor={`${id}-quantity`}>{isDisposal ? '폐기할 수량' : '변경 후 최종 수량'} ({lot.unit})</label>
            <input {...propsFor('quantity')} type="number" inputMode="decimal" min={isDisposal ? '0.001' : '0'} max={isDisposal ? lot.quantity : '999999999.999'} step="0.001" required />
            {errorFor('quantity')}
          </div>
          {isDisposal ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <p>폐기 후 남는 수량: <strong>{remaining == null ? '수량을 확인해 주세요' : `${remaining}${lot.unit}`}</strong></p>
              <p className="mt-2 text-xs leading-5">폐기한 수량은 이 화면에서 되돌릴 수 없습니다. 수량을 확인한 뒤 확정해 주세요.</p>
            </div>
          ) : (
            <>
              <div><label className="label" htmlFor={`${id}-storageLocation`}>보관 위치</label>
                <select {...propsFor('storageLocation')}>{Object.values(STORAGE_LOCATION).map((value) => <option key={value} value={value}>{STORAGE_LABEL[value]}</option>)}</select>{errorFor('storageLocation')}
              </div>
              <div><label className="label" htmlFor={`${id}-expiryDate`}>소비기한</label>
                <input {...propsFor('expiryDate')} type="date" />{errorFor('expiryDate')}
                <button type="button" disabled={!form.expiryDate} onClick={() => { setForm((current) => ({ ...current, expiryDate: '' })); setErrors({}); mutation.reset() }} className="mt-1 min-h-11 cursor-pointer text-xs font-semibold text-gray-600 underline disabled:cursor-default disabled:text-gray-400">소비기한 제거</button>
              </div>
              <div><label className="label" htmlFor={`${id}-minStockQty`}>최소 유지 수량 ({lot.unit})</label>
                <input {...propsFor('minStockQty')} type="number" inputMode="decimal" min="0" max="999999999.999" step="0.001" placeholder="미입력 시 0" />{errorFor('minStockQty')}
              </div>
            </>
          )}
          <div><label className="label" htmlFor={`${id}-memo`}>{isDisposal ? '폐기 사유·메모 (선택)' : '메모'}</label>
            <textarea {...propsFor('memo')} rows={2} maxLength={255} />{errorFor('memo')}
          </div>
          {requiresConfirmation && (
            <label className="flex min-h-11 cursor-pointer items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              <input type="checkbox" checked={confirmed} onChange={(event) => { setConfirmed(event.target.checked); setErrors((current) => ({ ...current, confirmation: undefined })) }} className="mt-1 h-4 w-4 shrink-0 accent-emerald-600" />
              {isDisposal ? '전량 폐기 후에는 보관 목록에서 제외됩니다. 되돌릴 수 없음을 확인했습니다.' : '수량 0으로 저장하면 소진 처리되며 다시 수정할 수 없음을 확인했습니다.'}
            </label>
          )}
          {errorFor('confirmation')}
          {!isDisposal && !hasChanges && <p className="text-xs text-gray-500">변경한 내용이 없습니다.</p>}
          {errorFor('form')}
          {mutation.isError && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <p className="whitespace-pre-wrap break-all">{getErrorMessage(mutation.error)}</p>
            {(code === 'INVENTORY_001' || code === 'INVENTORY_003') && <p className="mt-2 text-xs">창을 닫고 목록을 새로고침해 현재 상태를 확인해 주세요.</p>}
          </div>}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary min-h-11">취소</button>
            <button type="submit" disabled={!isDisposal && !hasChanges} className={`min-h-11 ${isDisposal ? 'inline-flex cursor-pointer items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50' : 'btn-primary'}`}>
              {mutation.isPending ? '저장 중...' : isDisposal ? remaining === 0 ? '전량 폐기 확정' : '폐기 확정' : '수정 저장'}
            </button>
          </div>
        </fieldset>
      </form>
    </dialog>
  )
}

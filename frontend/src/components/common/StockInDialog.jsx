import { useEffect, useId, useRef, useState } from 'react'
import { PackagePlus, X } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { useStockIn } from '@/api/inventory'
import { STORAGE_LOCATION } from '@/lib/enums'
import { STORAGE_LABEL } from '@/lib/labels'

const UNITS = ['개', 'g', 'kg', 'mL', 'L', '모', '쪽', '봉지', '팩', '마리']
const INITIAL_FORM = {
  ingredientName: '', quantity: '', unit: '개', storageLocation: STORAGE_LOCATION.FRIDGE,
  expiryDate: '', minStockQty: '', memo: '',
}

function validateForm(form) {
  const errors = {}
  if (!form.ingredientName.trim()) errors.ingredientName = '식재료명을 입력해 주세요.'
  else if (form.ingredientName.trim().length > 100) errors.ingredientName = '식재료명은 100자 이내로 입력해 주세요.'
  for (const field of ['quantity', 'minStockQty']) {
    const text = form[field].trim()
    if (field === 'minStockQty' && text === '') continue
    if (!text || !/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(text)
        || !Number.isFinite(Number(text)) || Number(text) > 999999999.999
        || (field === 'quantity' && Number(text) <= 0)) {
      errors[field] = field === 'quantity'
        ? '0보다 큰 수량을 정수 9자리, 소수 3자리 이내로 입력해 주세요.'
        : '최소 유지 수량은 0 이상, 정수 9자리, 소수 3자리 이내로 입력해 주세요.'
    }
  }
  if (!UNITS.includes(form.unit)) errors.unit = '단위를 선택해 주세요.'
  if (!Object.values(STORAGE_LOCATION).includes(form.storageLocation)) errors.storageLocation = '보관 위치를 선택해 주세요.'
  if (form.expiryDate) {
    const date = new Date(form.expiryDate + 'T00:00:00Z')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.expiryDate) || Number.isNaN(date.getTime())
        || date.toISOString().slice(0, 10) !== form.expiryDate) errors.expiryDate = '올바른 소비기한 날짜를 입력해 주세요.'
  }
  if (form.memo.length > 255) errors.memo = '메모는 255자 이내로 입력해 주세요.'
  return errors
}

export function StockInDialog({ onClose, onSuccess }) {
  const dialogRef = useRef(null)
  const submitLock = useRef(false)
  const id = useId()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const stockIn = useStockIn()

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    if (stockIn.isError) stockIn.reset()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitLock.current) return
    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const firstField = Object.keys(nextErrors)[0]
      dialogRef.current.querySelector(`[name="${firstField}"]`)?.focus()
      return
    }
    submitLock.current = true
    try {
      const result = await stockIn.mutateAsync({
        ingredientName: form.ingredientName.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        storageLocation: form.storageLocation,
        ...(form.expiryDate && { expiryDate: form.expiryDate }),
        ...(form.minStockQty.trim() !== '' && { minStockQty: Number(form.minStockQty) }),
        ...(form.memo !== '' && { memo: form.memo }),
      })
      onSuccess(result)
    } catch {
      // 등록 실패 시 입력값을 유지한다.
    } finally {
      submitLock.current = false
    }
  }

  function fieldProps(name) {
    return {
      id: `${id}-${name}`, name, value: form[name], onChange: updateField,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined,
      className: 'input min-h-11',
    }
  }

  function fieldError(name) {
    return errors[name] ? <p id={`${id}-${name}-error`} className="mt-1 text-xs text-rose-700">{errors[name]}</p> : null
  }

  return (
    <dialog ref={dialogRef} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onCancel={(event) => { event.preventDefault(); if (!stockIn.isPending) onClose() }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-xl backdrop:bg-black/40 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <h3 id={`${id}-title`} className="flex items-center gap-2 text-base font-bold"><PackagePlus aria-hidden="true" className="h-5 w-5 text-emerald-600" />신규 재료 묶음 등록</h3>
        <button type="button" aria-label="등록 폼 닫기" disabled={stockIn.isPending} onClick={onClose} className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed"><X aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <p id={`${id}-description`} className="mb-5 text-xs leading-5 text-gray-500">같은 재료도 새 묶음으로 등록해 소비기한별로 관리합니다. * 표시는 필수 항목입니다.</p>
      <form onSubmit={handleSubmit} noValidate aria-busy={stockIn.isPending}>
        <fieldset disabled={stockIn.isPending} className="min-w-0 space-y-4 disabled:opacity-70">
          <div>
            <label htmlFor={`${id}-ingredientName`} className="label">식재료명 *</label>
            <input {...fieldProps('ingredientName')} required maxLength={100} placeholder="예: 두부, 달걀, 양파" autoComplete="off" />
            {fieldError('ingredientName')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${id}-quantity`} className="label">수량 *</label>
              <input {...fieldProps('quantity')} type="number" inputMode="decimal" required min="0.001" max="999999999.999" step="0.001" placeholder="예: 300" />
              {fieldError('quantity')}
            </div>
            <div>
              <label htmlFor={`${id}-unit`} className="label">단위 *</label>
              <select {...fieldProps('unit')} required>{UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select>
              {fieldError('unit')}
            </div>
          </div>
          <div>
            <label htmlFor={`${id}-storageLocation`} className="label">보관 위치 *</label>
            <select {...fieldProps('storageLocation')} required>{Object.values(STORAGE_LOCATION).map((value) => <option key={value} value={value}>{STORAGE_LABEL[value]}</option>)}</select>
            {fieldError('storageLocation')}
          </div>
          <div>
            <label htmlFor={`${id}-expiryDate`} className="label">소비기한 <span className="font-normal text-gray-500">(선택)</span></label>
            <input {...fieldProps('expiryDate')} type="date" />
            {fieldError('expiryDate')}
            <p className="mt-1 text-xs text-gray-500">모르면 비워 두셔도 됩니다.</p>
          </div>
          <div>
            <label htmlFor={`${id}-minStockQty`} className="label">최소 유지 수량 <span className="font-normal text-gray-500">(선택)</span></label>
            <input {...fieldProps('minStockQty')} type="number" inputMode="decimal" min="0" max="999999999.999" step="0.001" placeholder="미입력 시 0" />
            {fieldError('minStockQty')}
            <p className="mt-1 text-xs text-gray-500">위에서 선택한 단위({form.unit})로 입력해 주세요.</p>
          </div>
          <div>
            <label htmlFor={`${id}-memo`} className="label">메모 <span className="font-normal text-gray-500">(선택)</span></label>
            <textarea {...fieldProps('memo')} rows={2} maxLength={255} placeholder="보관할 때 참고할 내용을 적어 주세요." />
            {fieldError('memo')}
          </div>
          <p className="text-xs text-gray-500">수량은 소수 셋째 자리까지 입력할 수 있습니다.</p>
          {stockIn.isError && <p role="alert" className="whitespace-pre-wrap break-all rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{getErrorMessage(stockIn.error)}</p>}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary min-h-11">취소</button>
            <button type="submit" className="btn-primary min-h-11">{stockIn.isPending ? '저장 중...' : '등록하기'}</button>
          </div>
        </fieldset>
      </form>
    </dialog>
  )
}

import { useId, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatQuantity } from '@/lib/format'
import { STORAGE_LABEL } from '@/lib/labels'
import { addUsageIngredient } from '@/api/actualUsage'

export function ActualIngredientsEditor({ session, analysis, inventoryReady, disabled, preparedDraft, onRowsChange, onReset }) {
  const id = useId()
  const [adding, setAdding] = useState(false)
  const [choice, setChoice] = useState('')
  const [addError, setAddError] = useState('')
  const [resetting, setResetting] = useState(false)
  const update = (key, patch) => onRowsChange(session.rows.map((row) => row.key === key ? { ...row, ...patch } : row))
  function add() {
    try { onRowsChange(addUsageIngredient(session.rows, analysis.options.find((option) => option.key === choice))); setChoice(''); setAddError(''); setAdding(false) }
    catch (failure) { setAddError(failure.message) }
  }
  return <section aria-label="실제로 사용할 재료" className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
    <header><h4 className="font-extrabold">실제로 사용할 재료</h4><p className="mt-1 text-xs leading-6 text-gray-500">레시피와 다르게 요리할 예정이라면 재료와 수량을 수정해 주세요. 입력 내용은 이 화면에서만 확인하며 저장하지 않아요.</p></header>
    {session.notice && <p role="status" className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">{session.notice}</p>}
    <fieldset disabled={disabled} className="space-y-4"><legend className="sr-only">사용 재료와 수량 수정</legend>
      {session.rows.map((row) => {
        const comparison = analysis.comparisons.get(row.key)
        return <div key={row.key} className={`min-w-0 space-y-3 rounded-xl border p-3 ${row.enabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}>
          <div className="flex items-start gap-3"><input id={`${id}-${row.key}`} type="checkbox" checked={row.enabled} onChange={(event) => update(row.key, { enabled: event.target.checked })} className="mt-1 h-5 w-5 shrink-0 accent-emerald-600" /><label htmlFor={`${id}-${row.key}`} className="min-w-0 flex-1 break-all text-sm font-bold">{row.ingredientName}<span className="ml-2 text-xs font-normal text-gray-500">{row.added ? '추가 재료' : '레시피 재료'}{!row.enabled ? ' · 사용하지 않음' : ''}</span></label>{row.added && <button type="button" aria-label={`${row.ingredientName} 추가 재료 제거`} onClick={() => onRowsChange(session.rows.filter((item) => item.key !== row.key))} className="btn-secondary min-h-11 shrink-0 px-3"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>}</div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2"><p className="self-center break-all text-xs text-gray-500">레시피 기준: {row.added ? '레시피에 없는 재료' : formatQuantity(row.recipeQuantity, row.unit)}</p><label className="min-w-0"><span className="label">{row.ingredientName} 실제 사용할 양</span><div className="flex min-w-0 items-center gap-2"><input type="number" min="0.001" max="999999999.999" step="0.001" disabled={!row.enabled} value={row.quantity} onChange={(event) => update(row.key, { quantity: event.target.value })} aria-invalid={Boolean(analysis.errors[row.key])} aria-describedby={analysis.errors[row.key] ? `${id}-error-${row.key}` : undefined} className="input min-h-11 min-w-0 flex-1" /><span className="break-all text-sm font-semibold">{row.unit}</span></div></label></div>
          {row.enabled && <p className="break-all text-xs text-gray-600">사용 가능한 냉장고 재고: {comparison?.stockText || (inventoryReady ? '비교 가능한 재고 없음' : '확인 필요')}</p>}
          {row.enabled && analysis.errors[row.key] && <p id={`${id}-error-${row.key}`} role="alert" className="break-all text-xs text-rose-700">{analysis.errors[row.key]}</p>}
        </div>
      })}
      <div className="grid gap-2 sm:flex sm:flex-wrap"><button type="button" disabled={!inventoryReady} onClick={() => { setAdding(!adding); setAddError('') }} className="btn-secondary min-h-11"><Plus aria-hidden="true" className="h-4 w-4" />재료 추가</button><button type="button" disabled={!analysis.dirty} onClick={() => setResetting(true)} className="btn-secondary min-h-11">레시피 기준으로 되돌리기</button></div>
      {adding && <div className="space-y-3 rounded-xl bg-gray-50 p-3"><label><span className="label">추가로 사용할 냉장고 재료</span><select value={choice} onChange={(event) => { setChoice(event.target.value); setAddError('') }} className="input min-h-11"><option value="">재료를 선택해 주세요</option>{analysis.options.map((option) => <option key={option.key} value={option.key}>{option.ingredientName} · {formatQuantity(option.quantity, option.unit)} · {[...new Set(option.lots.map((lot) => STORAGE_LABEL[lot.storageLocation]))].join('·')}</option>)}</select></label>{!analysis.options.length && <p className="text-xs text-gray-500">사용 가능한 냉장고 재료가 없어요.</p>}<button type="button" disabled={!choice || !inventoryReady} onClick={add} className="btn-secondary min-h-11">선택한 재료 추가</button>{addError && <p role="alert" className="text-xs text-rose-700">{addError}</p>}<p className="text-xs leading-5 text-gray-500">추가는 실제 사용 계획의 임시 입력일 뿐 냉장고에 새 재료를 등록하거나 수량을 바꾸지 않아요.</p></div>}
      {resetting && <div role="group" aria-label="레시피 기준 복원 확인" className="space-y-3 rounded-xl bg-amber-50 p-3"><h5 className="text-sm font-bold">수정한 재료와 수량을 되돌릴까요?</h5><p className="text-xs leading-6 text-gray-600">추가 재료는 제거하고 모든 레시피 재료를 기본 수량으로 사용할 예정이에요.</p><div className="grid gap-2 sm:flex sm:flex-wrap"><button type="button" onClick={() => { onReset(); setResetting(false); setAdding(false); setChoice(''); setAddError('') }} className="btn-primary min-h-11">되돌리기</button><button type="button" onClick={() => setResetting(false)} className="btn-secondary min-h-11">수정 내용 계속 확인하기</button></div></div>}
    </fieldset>
    {analysis.empty && <p role="alert" className="text-sm text-rose-700">사용할 재료를 하나 이상 선택해 주세요.</p>}
    {analysis.dirty && <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><h5 className="text-sm font-bold text-amber-900">레시피에서 변경한 내용이 있어요.</h5><p className="text-sm leading-6 text-amber-900">재료와 수량을 수정했어요. 실제 사용량에 따른 재고 반영 기능은 준비 중이에요.</p><h6 className="text-xs font-bold text-gray-700">수정한 사용 재료 요약 · 입력 확인용</h6><ul className="space-y-1 text-xs text-gray-700">{session.rows.filter((row) => row.enabled).map((row) => <li key={row.key} className="break-all">{row.ingredientName} · {row.quantity || '수량 입력 필요'}{row.quantity ? row.unit : ''}{row.added ? ' · 추가' : ''}</li>)}</ul><p className="text-xs leading-5 text-gray-600">{preparedDraft ? '입력값을 확인했어요. 아직 저장하거나 재고에 반영하지 않아요.' : '입력값과 냉장고 재고를 확인해 주세요.'} 기존 레시피 기준의 사용 계획과는 다릅니다.</p><button type="button" disabled className="btn-primary min-h-11">요리 완료</button></div>}
  </section>
}

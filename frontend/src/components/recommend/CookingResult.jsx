import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { cookingChangeQuantity } from '@/api/cookingUx'
import { formatQuantity } from '@/lib/format'

export function CookingResult({ event, offerCancel, canCancel, onCancel }) {
  const restored = event.status === 'RESTORED'
  return <section role="status" aria-label="요리 처리 결과" className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:p-5">
    <div className="flex items-start gap-3"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" /><div><h4 className="font-extrabold text-emerald-950">{restored ? '요리 완료를 취소했어요' : '요리가 완료됐어요!'}</h4><p className="mt-1 text-sm leading-6 text-emerald-800">{restored ? '사용했던 재료가 원래 보관된 곳에 복원됐어요.' : '사용한 재료가 냉장고 재고에 반영됐어요.'}</p></div></div>
    <ul className="space-y-2">{event.changes?.map((change, index) => <li key={index} className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm"><span className="min-w-0 break-all font-semibold">{change.ingredientName}</span><span className="break-all text-emerald-800">{formatQuantity(cookingChangeQuantity(change), change.unit)} {restored ? '복원' : '사용'}</span></li>)}</ul>
    <details className="text-xs text-emerald-800"><summary className="flex min-h-11 cursor-pointer items-center">사용한 보관 묶음 상세</summary><ul className="space-y-1">{event.changes?.map((change, index) => <li key={index} className="break-all">묶음 {change.lotId} · {change.ingredientName} · {formatQuantity(cookingChangeQuantity(change), change.unit)} {restored ? '복원' : '사용'}</li>)}</ul></details>
    <div className="grid gap-2 sm:flex sm:flex-wrap"><Link to="/fridge" className="btn-primary min-h-11">냉장고 확인</Link>{!restored && offerCancel && <button type="button" disabled={!canCancel} onClick={onCancel} className="btn-secondary min-h-11">요리 완료 취소</button>}</div>
  </section>
}

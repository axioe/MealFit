import { ExpirationBadge } from '@/components/common/StatusBadge'
import { STORAGE_LABEL } from '@/lib/labels'
import { formatQuantity } from '@/lib/format'
import { cookingPreviewState, plannedUsage } from '@/api/cookingUx'

export function CookingPreview({ preview, canComplete, onComplete }) {
  return <section aria-label="요리 전 재료 확인" className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-4 md:p-5">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-extrabold">요리 전 재료 확인</h4><p className="mt-1 break-all text-sm text-gray-600">{preview.recipeName} · {preview.servings}인분</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${preview.canCook ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{cookingPreviewState(preview)}</span></header>
    {!preview.canCook && <p className="break-all rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{preview.blockedReason}</p>}
    <ul className="divide-y divide-gray-100">{preview.ingredients.map((ingredient, index) => {
      const usage = plannedUsage(ingredient.deductions)
      return <li key={`${ingredient.ingredientName}-${index}`} className="min-w-0 space-y-3 py-4 first:pt-0">
        <h5 className="break-all font-bold text-gray-900">{ingredient.ingredientName}</h5>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-gray-500">필요한 양</dt><dd className="mt-1 break-all font-semibold">{formatQuantity(ingredient.requiredQty, ingredient.unit)}</dd></div>
          <div><dt className="text-xs text-gray-500">사용할 양</dt><dd className="mt-1 break-all font-bold text-emerald-700">{usage.length ? usage.map((item) => formatQuantity(item.quantity, item.unit)).join(' + ') : '사용할 재료 없음'}</dd></div>
          <div><dt className="text-xs text-gray-500">사용 가능한 보유량</dt><dd className="mt-1 break-all font-semibold">{formatQuantity(ingredient.availableQty, ingredient.unit)}</dd></div>
        </dl>
        {Number(ingredient.shortageQty) > 0 && <p className="break-all text-sm font-bold text-rose-700">{formatQuantity(ingredient.shortageQty, ingredient.unit)} 더 필요해요.</p>}
        {ingredient.deductions.length > 0 && <div className="space-y-2"><p className="text-xs font-semibold text-gray-500">이렇게 나누어 사용해요</p><ul className="space-y-2">{ingredient.deductions.map((lot, lotIndex) => <li key={`${lot.lotId}-${lotIndex}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 text-xs"><span className="break-all font-semibold">{STORAGE_LABEL[lot.storageLocation]} · {formatQuantity(lot.quantity, lot.unit)} 사용</span><ExpirationBadge status={lot.expirationStatus} date={lot.expiryDate} /></li>)}</ul><details className="text-xs text-gray-500"><summary className="flex min-h-11 cursor-pointer items-center">보관 묶음 상세</summary><ul className="space-y-1">{ingredient.deductions.map((lot, lotIndex) => <li key={lotIndex} className="break-all">묶음 {lot.lotId} · {STORAGE_LABEL[lot.storageLocation]} · {lot.expiryDate || '소비기한 미등록'} · {formatQuantity(lot.quantity, lot.unit)} 사용</li>)}</ul></details></div>}
      </li>
    })}</ul>
    <p className="text-xs leading-5 text-gray-500">사용 후 남은 양은 요리 완료 후 냉장고에서 확인해 주세요. 소비기한이 지났거나 단위가 맞지 않는 재료는 사용량에 포함하지 않아요. 완료할 때 재고를 한 번 더 확인해요.</p>
    <button type="button" disabled={!canComplete} onClick={onComplete} className="btn-primary min-h-11 w-full sm:w-auto">요리 완료</button>
  </section>
}

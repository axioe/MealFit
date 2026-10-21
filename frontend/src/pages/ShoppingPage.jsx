import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PackageCheck, RefreshCw, ShoppingCart } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { useShopping } from '@/api/shopping'
import { ShoppingItemDialog } from '@/components/shopping/ShoppingItemDialog'
import { Spinner } from '@/components/common/Spinner'
import { SHOPPING_ITEM_STATUS } from '@/lib/enums'
import { SHOPPING_ITEM_STATUS_LABEL } from '@/lib/labels'
import { formatQuantity } from '@/lib/format'

export function ShoppingPage() {
  const { data, isPending, isError, error, isFetching, refetch } = useShopping()
  const [selection, setSelection] = useState(null)
  const [message, setMessage] = useState('')
  const items = data ?? []
  const waiting = items.filter((item) => Number(item.purchasedQty) > 0).length
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <p className="max-w-xl text-sm leading-6 text-gray-600">확정한 식단의 부족분을 확인하고, 구매한 재료를 냉장고에 넣어 보세요.</p>
      <button type="button" disabled={isFetching || Boolean(selection)} onClick={() => refetch()} className="btn-secondary min-h-11"><RefreshCw aria-hidden="true" className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />새로고침</button>
    </div>
    <div className="grid grid-cols-2 gap-3"><div className="card min-w-0"><p className="text-xs text-gray-500">장보기 재료</p><p className="mt-2 text-2xl font-extrabold">{items.length}<span className="ml-1 text-sm font-medium">종</span></p></div><div className="card min-w-0"><p className="text-xs text-gray-500">구매 후 입고 대기</p><p className="mt-2 text-2xl font-extrabold text-emerald-700">{waiting}<span className="ml-1 text-sm font-medium">종</span></p></div></div>
    <p className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">구매 기록과 냉장고 입고는 별도 단계입니다. ‘구매 완료’도 냉장고 입고가 끝났다는 뜻은 아닙니다.</p>
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message} <Link to="/fridge" className="font-bold underline">냉장고 확인</Link></p>}
    {isError && <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700"><p className="whitespace-pre-wrap break-all">{getErrorMessage(error)}</p>{data && <p className="mt-2">이전에 불러온 목록을 표시합니다. 새로고침 후 작업해 주세요.</p>}</div>}
    {isPending ? <div className="card flex min-h-48 items-center justify-center gap-3"><Spinner />장보기 목록을 불러오고 있습니다.</div> : data && (items.length === 0 ? <div className="card py-12 text-center"><ShoppingCart aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-gray-300" /><h3 className="font-bold">장보기 목록이 비어 있어요</h3><p className="mt-2 text-sm text-gray-500">부족한 재료가 없거나 아직 확정한 식단이 없습니다.</p><Link to="/recommend" className="btn-primary mt-5 min-h-11">식단 추천받기</Link></div> : <ul className="space-y-4">{items.map((item) => <li key={item.id} className="card min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-all text-base font-bold">{item.ingredientName}</h3><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === SHOPPING_ITEM_STATUS.PURCHASED ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{SHOPPING_ITEM_STATUS_LABEL[item.status]}</span></div>
      <dl className="grid grid-cols-3 gap-2 text-xs"><div><dt className="text-gray-500">사야 할 총량</dt><dd className="mt-1 break-all font-bold">{formatQuantity(item.requiredQty, item.unit)}</dd></div><div><dt className="text-gray-500">입고 대기</dt><dd className="mt-1 break-all font-bold">{formatQuantity(item.purchasedQty, item.unit)}</dd></div><div><dt className="text-gray-500">더 살 수량</dt><dd className="mt-1 break-all font-bold text-emerald-700">{formatQuantity(item.remainingQty, item.unit)}</dd></div></dl>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={Boolean(selection) || isFetching || isError || item.status === SHOPPING_ITEM_STATUS.PURCHASED || Number(item.remainingQty) <= 0} onClick={() => { setMessage(''); setSelection({ item, mode: 'purchase' }) }} className="btn-secondary min-h-11">구매 수량 기록</button><button type="button" disabled={Boolean(selection) || isFetching || isError || Number(item.purchasedQty) <= 0} onClick={() => { setMessage(''); setSelection({ item, mode: 'stockIn' }) }} className="btn-primary min-h-11"><PackageCheck aria-hidden="true" className="h-4 w-4" />구매분 입고</button></div>
    </li>)}</ul>)}
    <p className="text-xs leading-5 text-gray-500">사야 할 총량은 서버가 현재 사용 가능한 재고와 최소 유지량을 반영해 계산합니다. 재고 원수량과 레시피 필요량은 이 API에서 제공하지 않습니다.</p>
    {selection && <ShoppingItemDialog key={`${selection.mode}-${selection.item.id}`} {...selection} onClose={() => setSelection(null)} onSuccess={(text) => { setSelection(null); setMessage(text) }} />}
  </div>
}

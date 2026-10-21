import { useEffect, useId, useRef, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { useInventoryTransactions } from '@/api/inventory'
import { Spinner } from '@/components/common/Spinner'
import { INVENTORY_TRANSACTION_TYPE } from '@/lib/enums'
import { INVENTORY_TRANSACTION_TYPE_LABEL } from '@/lib/labels'

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
})
const quantityFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 3 })

function formatDate(value) {
  if (!value) return '날짜 정보 없음'
  const zoned = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : value + '+09:00'
  const date = new Date(zoned)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

export function InventoryHistoryPanel({ lotId, lots, onSelectLot, onClose }) {
  const id = useId()
  const titleRef = useRef(null)
  const [type, setType] = useState('ALL')
  const { data, isPending, isError, error, isFetching, refetch } = useInventoryTransactions(lotId)
  const lotMap = new Map(lots.map((lot) => [lot.id, lot]))
  const rows = (data ?? []).filter((row) => type === 'ALL' || row.type === type)
    .toSorted((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || b.id - a.id)

  useEffect(() => {
    titleRef.current.focus({ preventScroll: true })
    titleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [lotId])

  return (
    <section className="card min-w-0 space-y-4" aria-labelledby={`${id}-title`}>
      <div className="flex items-center justify-between gap-2">
        <h3 id={`${id}-title`} ref={titleRef} tabIndex={-1} className="scroll-mt-24 text-base font-bold text-gray-900 outline-none">재고 변경 이력</h3>
        <div className="flex gap-1">
          <button type="button" aria-label="이력 새로고침" disabled={isFetching} onClick={() => refetch()} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"><RefreshCw aria-hidden="true" className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /></button>
          <button type="button" aria-label="변경 이력 닫기" onClick={onClose} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100"><X aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={`${id}-lot`} className="label">조회할 묶음</label>
          <select id={`${id}-lot`} value={lotId ?? 'ALL'} onChange={(event) => onSelectLot(event.target.value === 'ALL' ? null : Number(event.target.value))} className="input min-h-11">
            <option value="ALL">전체 이력</option>
            {lotId != null && !lotMap.has(lotId) && <option value={lotId}>묶음 #{lotId}</option>}
            {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.ingredientName} · 묶음 #{lot.id}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-type`} className="label">변경 유형</label>
          <select id={`${id}-type`} value={type} onChange={(event) => setType(event.target.value)} className="input min-h-11">
            <option value="ALL">전체 유형</option>
            {Object.values(INVENTORY_TRANSACTION_TYPE).map((value) => <option key={value} value={value}>{INVENTORY_TRANSACTION_TYPE_LABEL[value]}</option>)}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-500">최신순 · 한국 시간 기준 · 보관 위치와 소비기한만 수정한 경우 수량 이력은 남지 않습니다.</p>
      {isPending ? <div className="flex min-h-32 items-center justify-center"><Spinner /></div> : (
        <>
          {isError && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <p className="whitespace-pre-wrap break-all">{getErrorMessage(error)}</p>
            {data && <p className="mt-1 text-xs">이전에 불러온 이력을 표시하고 있습니다.</p>}
            <button type="button" disabled={isFetching} onClick={() => refetch()} className="btn-secondary mt-2 min-h-11 text-xs">이력 다시 시도</button>
          </div>}
          {data && (rows.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">조건에 맞는 변경 이력이 없습니다.</p> : (
            <ul className="max-h-[32rem] space-y-3 overflow-y-auto">
              {rows.map((row) => {
                const lot = lotMap.get(row.lotId)
                return (
                  <li key={row.id} className="min-w-0 rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 break-all text-sm font-bold text-gray-900">{lot?.ingredientName ?? `묶음 #${row.lotId}`}</p>
                      <span className={`text-sm font-bold ${row.qtyChange > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{row.qtyChange > 0 ? '+' : ''}{quantityFormatter.format(row.qtyChange)}{lot?.unit ?? ''}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">{INVENTORY_TRANSACTION_TYPE_LABEL[row.type] ?? '기타 변경'}</span>
                      <span>묶음 #{row.lotId}</span><time dateTime={row.createdAt}>{formatDate(row.createdAt)}</time>
                    </div>
                    {row.memo && <p className="mt-2 whitespace-pre-wrap break-all text-xs leading-5 text-gray-600">{row.memo}</p>}
                  </li>
                )
              })}
            </ul>
          ))}
        </>
      )}
    </section>
  )
}

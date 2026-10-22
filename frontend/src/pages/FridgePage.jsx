import { useId, useState } from 'react'
import { Archive, ChevronDown, History, Package, Plus, Refrigerator, RefreshCw, Search, Snowflake, TriangleAlert, X } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { useInventory } from '@/api/inventory'
import { InventoryHistoryPanel } from '@/components/common/InventoryHistoryPanel'
import { InventoryLotDialog } from '@/components/common/InventoryLotDialog'
import { StockInDialog } from '@/components/common/StockInDialog'
import { Spinner } from '@/components/common/Spinner'
import { ExpirationBadge } from '@/components/common/StatusBadge'
import { EXPIRATION_STATUS, LOT_STATUS, STORAGE_LOCATION } from '@/lib/enums'
import { LOT_STATUS_LABEL, STORAGE_LABEL } from '@/lib/labels'

const ALL_STORAGE = 'ALL'
const STORAGE_FILTERS = [
  { value: ALL_STORAGE, label: '전체', icon: Package },
  { value: STORAGE_LOCATION.FRIDGE, label: STORAGE_LABEL[STORAGE_LOCATION.FRIDGE], icon: Refrigerator },
  { value: STORAGE_LOCATION.FREEZER, label: STORAGE_LABEL[STORAGE_LOCATION.FREEZER], icon: Snowflake },
  { value: STORAGE_LOCATION.PANTRY, label: STORAGE_LABEL[STORAGE_LOCATION.PANTRY], icon: Archive },
]
const EXPIRATION_PRIORITY = [
  EXPIRATION_STATUS.EXPIRED,
  EXPIRATION_STATUS.TODAY,
  EXPIRATION_STATUS.IMMINENT,
  EXPIRATION_STATUS.NORMAL,
  EXPIRATION_STATUS.UNKNOWN,
]
const quantityFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 3 })

function formatQuantity(quantity, unit) {
  return `${quantityFormatter.format(quantity)}${unit}`
}

function summarizeLots(lots) {
  const activeLots = lots.filter((lot) => lot.status === LOT_STATUS.ACTIVE)
  // 소수 셋째 자리까지 정수로 합산해 표시 오차를 줄인다.
  const total = activeLots.reduce((sum, lot) => sum + Math.round(Number(lot.quantity) * 1000), 0)
  const expired = activeLots
    .filter((lot) => lot.expirationStatus === EXPIRATION_STATUS.EXPIRED)
    .reduce((sum, lot) => sum + Math.round(Number(lot.quantity) * 1000), 0)
  return { totalQuantity: total / 1000, availableQuantity: (total - expired) / 1000, expiredQuantity: expired / 1000 }
}

function LotCard({ lot, inactive = false, onEdit, onDispose, onHistory }) {
  return (
    <li className={`min-w-0 rounded-xl border p-4 ${inactive ? 'border-gray-200 bg-gray-100/70' : 'border-gray-200 bg-white'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`min-w-0 break-all text-base font-bold ${inactive ? 'text-gray-500' : 'text-gray-900'}`}>
          {formatQuantity(lot.quantity, lot.unit)}
        </span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          {STORAGE_LABEL[lot.storageLocation]}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${inactive ? 'bg-gray-200 text-gray-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {LOT_STATUS_LABEL[lot.status]}
        </span>
      </div>
      <dl className="mt-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
        <div className="flex flex-wrap items-center gap-2">
          <dt>소비기한</dt>
          <dd className="min-w-0">
            <ExpirationBadge status={lot.expirationStatus} date={lot.expiryDate} />
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt>최소 유지량</dt>
          <dd className="min-w-0 break-all text-gray-700">{formatQuantity(lot.minStockQty, lot.unit)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt>묶음 번호</dt>
          <dd>#{lot.id}</dd>
        </div>
        {lot.memo && (
          <div className="min-w-0 sm:col-span-2">
            <dt className="sr-only">메모</dt>
            <dd className="whitespace-pre-wrap break-all text-gray-600">{lot.memo}</dd>
          </div>
        )}
      </dl>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
        {!inactive && lot.status === LOT_STATUS.ACTIVE && <>
          <button type="button" onClick={() => onEdit(lot)} className="btn-secondary min-h-11 text-xs">수정</button>
          <button type="button" onClick={() => onDispose(lot)} className="min-h-11 cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">폐기</button>
        </>}
        <button type="button" onClick={() => onHistory(lot.id)} className="btn-secondary min-h-11 text-xs">이 묶음 이력</button>
      </div>
    </li>
  )
}

function InventoryGroup({ group, onEdit, onDispose, onHistory }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const panelId = useId()
  const activeLots = group.lots.filter((lot) => lot.status === LOT_STATUS.ACTIVE)
  const usableLots = activeLots.filter((lot) => lot.expirationStatus !== EXPIRATION_STATUS.EXPIRED)
  const expiredLots = activeLots.filter((lot) => lot.expirationStatus === EXPIRATION_STATUS.EXPIRED)
  const worstStatus = EXPIRATION_PRIORITY.find((status) => activeLots.some((lot) => lot.expirationStatus === status))
  const earliestExpiry = activeLots.map((lot) => lot.expiryDate).filter(Boolean).sort()[0]

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <h3>
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={panelId}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="flex min-h-11 w-full cursor-pointer items-start gap-3 p-4 text-left transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-emerald-600 md:p-5"
        >
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${activeLots.length ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-100 text-gray-500'}`}>
            {group.ingredientName.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="break-all text-base font-bold text-gray-900">{group.ingredientName}</span>
              <span className="min-w-0 break-all text-sm font-semibold text-gray-700">총 {formatQuantity(group.totalQuantity, group.unit)}</span>
            </span>
            <span className="mt-1 block text-xs font-normal leading-5 text-gray-500">
              {activeLots.length ? `보관 중 ${activeLots.length}개 묶음` : '활성 재고 없음'}

            </span>
            <span className="mt-2 flex flex-wrap items-center gap-2">
              {worstStatus && <ExpirationBadge status={worstStatus} />}
              <span className="text-xs font-normal text-gray-500">
                {earliestExpiry ? `가장 빠른 소비기한 ${earliestExpiry}` : activeLots.length ? '소비기한 미등록' : '보관 기록을 확인해 주세요'}
              </span>
            </span>
          </span>
          <ChevronDown aria-hidden="true" className={`mt-2 h-5 w-5 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </h3>
      <dl className="grid grid-cols-2 gap-3 border-t border-gray-100 px-4 py-3 text-xs md:px-5">
        <div>
          <dt className="text-gray-500">사용 가능</dt>
          <dd className="mt-1 break-all text-sm font-bold text-emerald-700">{formatQuantity(group.availableQuantity, group.unit)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">기한 경과</dt>
          <dd className={`mt-1 break-all text-sm font-bold ${group.expiredQuantity > 0 ? 'text-rose-700' : 'text-gray-600'}`}>{formatQuantity(group.expiredQuantity, group.unit)}</dd>
        </div>
      </dl>
      <div id={panelId} hidden={!isExpanded} className="space-y-4 border-t border-gray-200 bg-gray-50 p-4 md:p-5">
        {usableLots.length > 0 && (
          <section aria-label="보관 중인 묶음">
            <h4 className="mb-2 text-xs font-bold text-gray-700">보관 중인 묶음</h4>
            <ul className="space-y-2">{usableLots.map((lot) => <LotCard key={lot.id} lot={lot} onEdit={onEdit} onDispose={onDispose} onHistory={onHistory} />)}</ul>
          </section>
        )}
        {expiredLots.length > 0 && (
          <section aria-label="유통기한 경과 묶음">
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-rose-700">
              <TriangleAlert aria-hidden="true" className="h-4 w-4" />유통기한이 지난 묶음
            </h4>
            <p className="mb-2 text-xs text-rose-700">사용 가능 수량에서 제외된 재고입니다.</p>
            <ul className="space-y-2">{expiredLots.map((lot) => <LotCard key={lot.id} lot={lot} onEdit={onEdit} onDispose={onDispose} onHistory={onHistory} />)}</ul>
          </section>
        )}
      </div>
    </article>
  )
}

export function FridgePage() {
  const { data, isPending, isError, error, isFetching, refetch } = useInventory()
  const [showStockIn, setShowStockIn] = useState(false)
  const [lotAction, setLotAction] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyLotId, setHistoryLotId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [storageFilter, setStorageFilter] = useState(ALL_STORAGE)
  const groups = data?.groups ?? []
  const allLots = groups.flatMap((group) => group.lots)
  const search = searchQuery.trim().toLocaleLowerCase('ko-KR')
  const filteredGroups = groups
    .filter((group) => group.ingredientName.toLocaleLowerCase('ko-KR').includes(search))
    .map((group) => ({
      ...group,
      lots: group.lots.filter((lot) => storageFilter === ALL_STORAGE || lot.storageLocation === storageFilter),
    }))
  const visibleGroups = filteredGroups
    .map((group) => {
      const lots = group.lots.filter((lot) => lot.status === LOT_STATUS.ACTIVE)
      return { ...group, lots, ...summarizeLots(lots) }
    })
    .filter((group) => group.lots.length > 0)
  const archivedGroups = filteredGroups
    .map((group) => ({
      ...group,
      lots: group.lots.filter((lot) => lot.status === LOT_STATUS.DEPLETED || lot.status === LOT_STATUS.DISPOSED),
    }))
    .filter((group) => group.lots.length > 0)
  const archivedLotCount = archivedGroups.reduce((count, group) => count + group.lots.length, 0)
  const visibleActiveLots = visibleGroups.flatMap((group) => group.lots).filter((lot) => lot.status === LOT_STATUS.ACTIVE)
  const activeIngredientCount = new Set(visibleGroups.filter((group) => group.lots.some((lot) => lot.status === LOT_STATUS.ACTIVE)).map((group) => group.ingredientName)).size
  const imminentCount = visibleActiveLots.filter((lot) => lot.expirationStatus === EXPIRATION_STATUS.IMMINENT || lot.expirationStatus === EXPIRATION_STATUS.TODAY).length
  const hasFilters = searchQuery !== '' || storageFilter !== ALL_STORAGE
  const hasAnyActiveLots = groups.some((group) => group.lots.some((lot) => lot.status === LOT_STATUS.ACTIVE))

  function openEdit(lot) {
    setSuccessMessage('')
    setLotAction({ lot, mode: 'adjust' })
  }

  function openDispose(lot) {
    setSuccessMessage('')
    setLotAction({ lot, mode: 'dispose' })
  }

  function openHistory(lotId = null) {
    setHistoryLotId(lotId)
    setShowHistory(true)
  }

  function resetFilters() {
    setSearchQuery('')
    setStorageFilter(ALL_STORAGE)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-6 text-gray-600">재료별 수량과 소비기한을 한눈에 확인해 보세요.</p>
        <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => openHistory()} className="btn-secondary min-h-11 text-xs"><History aria-hidden="true" className="h-4 w-4" />재고 변경 이력</button>
        <button type="button" onClick={() => refetch()} disabled={isFetching} className="btn-secondary min-h-11 text-xs">
          <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? '불러오는 중...' : '새로고침'}
        </button>
        <button type="button" onClick={() => { setSuccessMessage(''); setShowStockIn(true) }} className="btn-primary min-h-11 text-xs">
          <Plus aria-hidden="true" className="h-4 w-4" />식재료 추가
        </button>
        </div>
      </div>
      {successMessage && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{successMessage}</p>}
      {lotAction && <InventoryLotDialog key={`${lotAction.mode}-${lotAction.lot.id}`} lot={lotAction.lot} mode={lotAction.mode}
        onClose={() => setLotAction(null)}
        onSuccess={(lot, disposed) => {
          setLotAction(null)
          setSuccessMessage(disposed
            ? `${lot.ingredientName} 폐기가 처리되었습니다. 남은 수량은 ${formatQuantity(lot.quantity, lot.unit)}입니다.`
            : `${lot.ingredientName} 묶음 #${lot.id} 정보가 저장되었습니다.`)
        }} />}
      {showHistory && <InventoryHistoryPanel lotId={historyLotId} lots={allLots} onSelectLot={setHistoryLotId} onClose={() => setShowHistory(false)} />}
      {showStockIn && <StockInDialog onClose={() => setShowStockIn(false)} onSuccess={(lot) => {
        setShowStockIn(false)
        resetFilters()
        setSuccessMessage(`${lot.ingredientName} ${formatQuantity(lot.quantity, lot.unit)}이(가) 새 묶음으로 등록되었습니다.`)
      }} />}


      <section aria-label="재고 검색 및 보관 위치 필터" className="space-y-3">
        <div className="relative">
          <label htmlFor="fridge-search" className="sr-only">식재료명 검색</label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input id="fridge-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="식재료명 검색 (예: 두부, 양파)" className="input min-h-11 pl-10 pr-11 [&::-webkit-search-cancel-button]:appearance-none" />
          {searchQuery && (
            <button type="button" aria-label="검색어 지우기" onClick={() => setSearchQuery('')} className="absolute top-0 right-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-emerald-600">
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
        <div role="group" aria-label="보관 위치" className="grid grid-cols-4 gap-2 sm:flex">
          {STORAGE_FILTERS.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" aria-pressed={storageFilter === value} onClick={() => setStorageFilter(value)} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:px-5 ${storageFilter === value ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50'}`}>
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{label}
            </button>
          ))}
        </div>
      </section>

      {isPending ? (
        <div className="card flex min-h-60 flex-col items-center justify-center gap-4">
          <Spinner /><p className="text-sm text-gray-500">냉장고 재고를 불러오고 있습니다.</p>
        </div>
      ) : (
        <>
          {isError && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="min-w-0">
                <p className="flex items-start gap-2 whitespace-pre-wrap break-all text-sm text-rose-700"><TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{getErrorMessage(error)}</p>
                {data && <p className="mt-2 text-xs text-rose-700">이전에 불러온 재고를 표시하고 있습니다.</p>}
              </div>
              <button type="button" onClick={() => refetch()} disabled={isFetching} className="btn-secondary min-h-11 text-xs">{isFetching ? '불러오는 중...' : '다시 시도'}</button>
            </div>
          )}
          {data && (
            <>
              <section aria-label="현재 조회 조건의 재고 요약" className="grid grid-cols-3 gap-2 md:gap-4">
                {[
                  { label: '보관 재료', count: activeIngredientCount, unit: '종' },
                  { label: '활성 묶음', count: visibleActiveLots.length, unit: '개' },
                  { label: '오늘·임박', count: imminentCount, unit: '개' },
                ].map(({ label, count, unit }) => (
                  <div key={label} className="min-w-0 rounded-2xl border border-gray-200 bg-white p-3 md:p-5">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="mt-2 text-2xl font-extrabold text-gray-900">{count}<span className="ml-1 text-sm font-medium text-gray-500">{unit}</span></p>
                  </div>
                ))}
              </section>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500" aria-live="polite">
                <p>검색 결과 <span className="font-semibold text-gray-700">{visibleGroups.length}</span>개 재료·단위 그룹</p>
                <p>소비기한 기준일 {data.asOfDate}</p>
              </div>
              {!hasAnyActiveLots && groups.length > 0 && (
                <p className="rounded-xl border border-gray-200 bg-gray-100 p-4 text-sm text-gray-600">현재 보관 중인 재고가 없습니다. ‘소진·폐기 기록 보기’에서 이전 묶음을 확인할 수 있습니다.</p>
              )}
              {visibleGroups.length === 0 ? (
                <div className="card flex min-h-60 flex-col items-center justify-center px-5 text-center">
                  <Refrigerator aria-hidden="true" className="mb-4 h-10 w-10 text-gray-300" />
                  <h3 className="text-base font-bold text-gray-900">{!hasAnyActiveLots ? '보관 중인 재고가 없습니다' : '조건에 맞는 재료가 없습니다'}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{!hasAnyActiveLots ? '새 식재료를 등록하고 소비기한별로 관리해 보세요.' : '검색어나 보관 위치를 바꿔서 다시 확인해 주세요.'}</p>
                  {!hasAnyActiveLots && <button type="button" onClick={() => { setSuccessMessage(''); setShowStockIn(true) }} className="btn-primary mt-4 min-h-11 text-xs">식재료 추가</button>}
                  {hasFilters && <button type="button" onClick={resetFilters} className="btn-secondary mt-4 min-h-11 text-xs">검색·필터 초기화</button>}
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleGroups.map((group) => <InventoryGroup key={JSON.stringify([group.ingredientName, group.unit])} group={group} onEdit={openEdit} onDispose={openDispose} onHistory={openHistory} />)}
                </div>
              )}
              <details className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
                <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-gray-600">소진·폐기 기록 보기 ({archivedLotCount}개 묶음)</summary>
                <p className="mt-2 text-xs text-gray-500">현재 검색·보관 필터에 맞는 기록입니다. 기본 재고와 합계에는 포함되지 않습니다.</p>
                {archivedGroups.length === 0 ? <p className="py-6 text-sm text-gray-500">조건에 맞는 소진·폐기 기록이 없습니다.</p> : (
                  <div className="mt-4 space-y-4">{archivedGroups.map((group) => (
                    <section key={JSON.stringify([group.ingredientName, group.unit])} aria-label={`${group.ingredientName} ${group.unit} 소진·폐기 기록`}>
                      <h3 className="mb-2 break-all text-sm font-bold text-gray-700">{group.ingredientName} <span className="font-normal text-gray-500">({group.unit})</span></h3>
                      <ul className="space-y-2">{group.lots.map((lot) => <LotCard key={lot.id} lot={lot} inactive onHistory={openHistory} />)}</ul>
                    </section>
                  ))}</div>
                )}
              </details>
              <p className="text-xs leading-5 text-gray-500">총수량은 활성 묶음 기준이며, 사용 가능 수량은 기한 경과 재고를 제외합니다. 기한 미등록 재고는 포함하며, 단위가 다른 재료는 따로 표시합니다.</p>
            </>
          )}
        </>
      )}
    </div>
  )
}

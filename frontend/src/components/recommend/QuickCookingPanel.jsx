import { useRef, useState } from 'react'
import { Plus, RefreshCw, Search, Sparkles } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { useInventory } from '@/api/inventory'
import { searchIngredients, selectableIngredients } from '@/api/quickCooking'
import { prepareServerQuickInput } from '@/api/quickRecipeRequests'
import { useQuickRecommendation } from '@/api/quickRecommendations'
import { QuickRecipeDetail } from './QuickRecipeDetail'
import { QuickRecipeResults } from './QuickRecipeResults'
import { QuickStockForm, IngredientIcon } from './QuickStockForm'
import { EXPIRATION_STATUS, LOT_STATUS } from '@/lib/enums'
import { Link } from 'react-router-dom'
import { StockInDialog } from '@/components/common/StockInDialog'
import { ExpirationBadge } from '@/components/common/StatusBadge'
import { STORAGE_LABEL } from '@/lib/labels'

export function QuickCookingPanel() {
  const inventory = useInventory()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [showStockIn, setShowStockIn] = useState(false)
  const [message, setMessage] = useState('')
  const [maxCookTimeMin, setMaxCookTimeMin] = useState('15')
  const recommendation = useQuickRecommendation()
  const [detail, setDetail] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const items = selectableIngredients(inventory.data)
  const chosen = items.filter((item) => selected.includes(item.key))
  const visible = searchIngredients(items, search)
  const ready = !inventory.isFetching && !inventory.isError
  const signature = JSON.stringify([maxCookTimeMin, chosen.map((item) => [item.key, item.quantity, item.lots])])
  const currentResult = ready && result?.signature === signature ? result : null

  async function requestRecommendation() {
    if (lock.current || !ready || !chosen.length) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      setResult(null)
      const response = await recommendation.mutateAsync(prepareServerQuickInput(chosen, maxCookTimeMin))
      setDetail(null)
      setResult({ signature, ...response })
    } catch (failure) {
      setError(getErrorMessage(failure, failure.message || 'AI 추천 결과를 불러오지 못했습니다. 다시 시도해 주세요.'))
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  const activeLots = (inventory.data?.groups ?? []).flatMap((group) => group.lots ?? []).filter((lot) => lot.status === LOT_STATUS.ACTIVE)
  const imminent = activeLots.filter((lot) => [EXPIRATION_STATUS.TODAY, EXPIRATION_STATUS.IMMINENT].includes(lot.expirationStatus)).length
  const expired = activeLots.filter((lot) => lot.expirationStatus === EXPIRATION_STATUS.EXPIRED).length
  if (detail) return <QuickRecipeDetail key={detail.recipe.key} recipe={detail.recipe} initialMode={detail.mode} inventory={inventory} onBack={() => setDetail(null)} />
  return <div className="space-y-6">
    <header className="rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 p-5 text-white md:p-6">
      <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Sparkles aria-hidden="true" className="h-4 w-4" />스마트 냉장고 · 15분 간편 요리</span>
      <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">손질부터 완성까지 15분! 냉장고 맞춤 요리</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100">냉장고 속 재료를 한눈에 확인하고, 오늘 사용할 재료를 골라 보세요.</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/20 pt-4 sm:grid-cols-4">{[
        ['사용 가능한 재료', inventory.isError || inventory.isPending ? '확인 중' : items.length + '종·단위'],
        ['소비기한 임박·오늘', inventory.isError || inventory.isPending ? '확인 중' : imminent + '개 묶음'],
        ['기한 경과 · 추천 제외', inventory.isError || inventory.isPending ? '확인 중' : expired + '개 묶음'],
        ['선택한 재료', chosen.length + '종·단위'],
      ].map(([title, value]) => <div key={title} className="rounded-xl bg-white/10 p-3"><dt className="text-xs text-emerald-100">{title}</dt><dd className="mt-1 text-base font-extrabold">{value}</dd></div>)}</dl>
    </header>
    <QuickStockForm onSuccess={() => setMessage('실제 냉장고에 등록했습니다. 갱신된 목록에서 재료를 선택해 주세요.')} />
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    <section className="card space-y-4" aria-label="냉장고 재료 선택">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">사용할 재료 선택</h3><div className="flex flex-wrap gap-2"><button type="button" className="btn-secondary min-h-11" disabled={inventory.isFetching || busy} onClick={() => inventory.refetch()}><RefreshCw className="h-4 w-4" aria-hidden="true" />새로고침</button><button type="button" className="btn-primary min-h-11" disabled={busy} onClick={() => setShowStockIn(true)}><Plus className="h-4 w-4" aria-hidden="true" />새 재료 추가</button></div></div>
      <p className="text-xs leading-5 text-gray-500">새 재료 추가는 실제 냉장고에 저장됩니다. 같은 재료·단위는 묶어서 선택하며, 서로 다른 단위는 환산하지 않습니다.</p>
      <label className="flex items-center gap-2"><Search aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" /><span className="sr-only">냉장고 재료 검색</span><input className="input min-w-0 flex-1" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="식재료명 검색" /></label>
      {inventory.isFetching && <p role="status" className="text-sm text-gray-500">냉장고 재료를 불러오는 중입니다…</p>}
      {inventory.isError && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><p>{getErrorMessage(inventory.error)}</p><button className="btn-secondary mt-2 min-h-11" type="button" onClick={() => inventory.refetch()}>재료 조회 다시 시도</button><p className="mt-2">조회에 성공한 뒤 재료를 선택해 주세요.</p></div>}
      {!inventory.isPending && !inventory.isError && !visible.length && <p className="py-8 text-center text-sm text-gray-500">{items.length ? '검색 결과가 없습니다.' : '추천에 사용할 재료가 없습니다. 냉장고에 새 재료를 추가해 주세요.'}</p>}
      <fieldset disabled={!ready || busy} className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <legend className="sr-only">여러 재료를 선택할 수 있습니다</legend>
        {visible.map((item) => <label key={item.key} className={`relative flex min-w-0 cursor-pointer flex-col items-center gap-3 rounded-xl border p-3 text-center transition-colors hover:border-emerald-400 ${selected.includes(item.key) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
          <input type="checkbox" checked={selected.includes(item.key)} onChange={() => setSelected((previous) => previous.includes(item.key) ? previous.filter((key) => key !== item.key) : [...previous, item.key])} className="absolute right-2 top-2 h-4 w-4 accent-emerald-600" />
          <IngredientIcon name={item.ingredientName} /><span className="min-w-0 space-y-2"><span className="block break-all font-bold text-gray-900">{item.ingredientName}</span><span className="block break-all text-sm text-emerald-700">{item.quantity}{item.unit} 보유</span><span className="block text-xs text-gray-500">{[...new Set(item.lots.map((lot) => STORAGE_LABEL[lot.storageLocation]))].join(' · ')}</span><span className="flex flex-wrap justify-center gap-1">{[...new Set(item.lots.map((lot) => lot.expirationStatus))].map((status) => <ExpirationBadge key={status} status={status} />)}</span></span>
        </label>)}
      </fieldset>
      <div className="space-y-2 border-t border-gray-100 pt-4"><div className="flex flex-wrap justify-between gap-2"><h4 className="text-xs font-bold text-gray-700">현재 사용 가능한 보유 재료</h4><Link to="/fridge" className="text-xs font-bold text-emerald-700">전체 냉장고 관리 →</Link></div><div className="flex flex-wrap gap-2">{items.map((item) => <span key={item.key} className="max-w-full break-all rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">{item.ingredientName} {item.quantity}{item.unit}</span>)}</div></div>
    </section>
    <section className="card space-y-4" aria-label="15분 요리 요청">
      <div><p className="text-xs font-bold text-emerald-600">RECIPE MATCH</p><h3 className="mt-1 font-extrabold">추천 기준 및 재료 확인</h3><p className="mt-1 text-xs leading-5 text-gray-500">15분 이내 · 활성 재고 사용 · 기한 경과 제외 · 다른 단위 임의 환산 없음</p></div>
      <p className="rounded-xl bg-violet-50 p-3 text-xs leading-6 text-violet-900">Gemini AI가 현재 냉장고 재고로 추천해요. 추천만으로 재고는 바뀌지 않으며, 실제 사용량은 조리 전 서버 미리보기에서 다시 확인해요.</p>
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">선택한 재료 {chosen.length}개</h3><button type="button" disabled={!chosen.length || busy} onClick={() => setSelected([])} className="btn-secondary min-h-11">선택 해제</button></div>
      <div className="flex flex-wrap gap-2">{chosen.map((item) => <span key={item.key} className="max-w-full break-all rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{item.ingredientName} {item.quantity}{item.unit}</span>)}</div>
      <label className="block max-w-xs"><span className="label">최대 조리 시간 (분)</span><input type="number" min="1" max="15" step="1" value={maxCookTimeMin} disabled={busy} onChange={(event) => setMaxCookTimeMin(event.target.value)} className="input min-h-11" /></label>
      <p className="text-xs leading-5 text-gray-500">인분과 필요 수량은 AI 응답 기준으로 표시해요. 조리 시간은 예상치예요.</p>
      <button type="button" disabled={!ready || !chosen.length || busy} onClick={requestRecommendation} className="btn-primary min-h-11"><Sparkles className="h-4 w-4" aria-hidden="true" />{busy ? 'AI 요리 추천 중…' : currentResult ? '다시 추천하기' : '15분 요리 추천받기'}</button>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {result && !currentResult && <p role="status" className="text-sm text-gray-500">재료 또는 재고가 변경됐습니다. 최신 선택으로 다시 추천받아 주세요.</p>}
    </section>
    {currentResult && !currentResult.recipes.length && <p role="status" className="card text-sm text-gray-500">표시할 추천 요리가 없어요. 재료를 확인하고 다시 시도해 주세요.</p>}
    {busy && <p role="status" className="card text-sm text-violet-800">AI가 요리를 추천하고 있어요. 잠시만 기다려 주세요.</p>}
    {currentResult && <QuickRecipeResults recipes={currentResult.recipes} onRecipe={(recipe) => setDetail({ recipe, mode: 'detail' })} onPrepare={(recipe) => setDetail({ recipe, mode: 'prepare' })} />}
    {showStockIn && <StockInDialog onClose={() => setShowStockIn(false)} onSuccess={() => { setShowStockIn(false); setMessage('실제 냉장고에 등록했습니다. 갱신된 목록에서 재료를 선택해 주세요.') }} />}
  </div>
}

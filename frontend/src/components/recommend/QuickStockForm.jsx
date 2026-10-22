import { defaultFavorites } from '@/api/favoriteIngredients'
import { FavoriteIngredientsManager } from './FavoriteIngredientsManager'
import { useRef, useState } from 'react'
import { Plus, Package } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { useStockIn } from '@/api/inventory'
import { validRecipeDate } from '@/api/recipeInventory'
import { STORAGE_LABEL } from '@/lib/labels'
import { STORAGE_LOCATION } from '@/lib/enums'

const UNITS = ['개', 'g', 'kg', 'mL', 'L', '모', '쪽', '봉지', '팩', '마리']
export function IngredientIcon({ name }) {
  const icon = defaultFavorites.find((item) => item.ingredientName === name)?.icon
  return <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">{icon ?? <Package className="h-7 w-7 text-emerald-600" />}</span>
}

export function QuickStockForm({ onSuccess }) {
  const [form, setForm] = useState({ ingredientName: '', quantity: '', unit: '개', storageLocation: STORAGE_LOCATION.FRIDGE, expiryDate: '' })
  const [showFavorites, setShowFavorites] = useState(false)
  const [error, setError] = useState('')
  const mutation = useStockIn()
  const lock = useRef(false)
  const update = (event) => { setForm((previous) => ({ ...previous, [event.target.name]: event.target.value })); setError('') }
  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    if (!form.ingredientName.trim() || form.ingredientName.trim().length > 100
      || !/^\d+(?:\.\d{1,3})?$/.test(form.quantity) || Number(form.quantity) <= 0 || Number(form.quantity) > 999999999.999
      || !UNITS.includes(form.unit) || !Object.values(STORAGE_LOCATION).includes(form.storageLocation)
      || (form.expiryDate && !validRecipeDate(form.expiryDate))) {
      setError('재료명(100자 이내), 0보다 큰 수량(정수 9자리·소수 3자리 이내), 보관 위치와 소비기한을 확인해 주세요.'); return
    }
    lock.current = true
    setError('')
    try {
      await mutation.mutateAsync({ ingredientName: form.ingredientName.trim(), quantity: Number(form.quantity), unit: form.unit, storageLocation: form.storageLocation, ...(form.expiryDate && { expiryDate: form.expiryDate }) })
      setForm((previous) => ({ ...previous, ingredientName: '', quantity: '', expiryDate: '' }))
      onSuccess()
    } catch (failure) { setError(getErrorMessage(failure)) }
    finally { lock.current = false }
  }
  return <section aria-label="냉장고 식재료 등록" className="card space-y-5">
    <div><h3 className="flex items-center gap-2 font-extrabold"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />냉장고 식재료 등록 및 관리</h3><p className="mt-1 text-xs leading-5 text-gray-500">자주 쓰는 재료를 선택하거나 직접 입력해 주세요. 등록 버튼을 누르면 실제 냉장고에 새 로트로 저장됩니다.</p></div>
    <fieldset disabled={mutation.isPending} className="space-y-3"><legend className="mb-3 text-xs font-bold text-gray-700">⚡ 자주 사용하는 재료 · 기본 즐겨찾기</legend>
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-gray-500">선택 시 이름·기본 수량·단위만 입력됩니다.</p><button type="button" onClick={() => setShowFavorites(true)} className="btn-secondary min-h-11">즐겨찾기 관리</button></div><div className="grid grid-cols-4 gap-2 lg:grid-cols-8">{defaultFavorites.map(({ id, ingredientName: name, quantity, icon, unit }) => <button key={id} type="button" onClick={() => { setForm((previous) => ({ ...previous, ingredientName: name, quantity, unit })); setError('') }} className="flex min-w-0 flex-col items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-bold text-gray-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50"><span aria-hidden="true" className="text-2xl">{icon}</span><span className="break-all">{name}</span><span className="text-[10px] font-normal text-gray-500">{quantity}{unit}</span></button>)}</div>
    </fieldset>
    <form onSubmit={submit}>
      <fieldset disabled={mutation.isPending} className="grid min-w-0 grid-cols-2 items-end gap-3 border-t border-gray-100 pt-4 lg:grid-cols-6">
        <label className="col-span-2 min-w-0 lg:col-span-1"><span className="label">재료명 검색·직접 입력</span><input name="ingredientName" required maxLength="100" value={form.ingredientName} onChange={update} className="input min-h-11" placeholder="예: 양파" /></label>
        <label className="min-w-0"><span className="label">수량</span><input name="quantity" type="number" min="0.001" max="999999999.999" step="0.001" required value={form.quantity} onChange={update} className="input min-h-11" placeholder="구매한 수량" /></label>
        <label className="min-w-0"><span className="label">단위</span><select name="unit" value={form.unit} onChange={update} className="input min-h-11">{UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
        <label className="min-w-0"><span className="label">보관 위치</span><select name="storageLocation" value={form.storageLocation} onChange={update} className="input min-h-11">{Object.values(STORAGE_LOCATION).map((value) => <option key={value} value={value}>{STORAGE_LABEL[value]}</option>)}</select></label>
        <label className="min-w-0"><span className="label">소비기한 (선택)</span><input name="expiryDate" type="date" value={form.expiryDate} onChange={update} className="input min-h-11 min-w-0" /></label>
        <button type="submit" className="btn-primary col-span-2 min-h-11 lg:col-span-1"><Plus aria-hidden="true" className="h-4 w-4" />{mutation.isPending ? '등록 중…' : '재료 등록'}</button>
      </fieldset>
      {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    </form>
    {showFavorites && <FavoriteIngredientsManager items={defaultFavorites} onClose={() => setShowFavorites(false)} />}
  </section>
}

import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { favoriteSupport } from '@/api/favoriteIngredients'

export function FavoriteIngredientsManager({ items, onClose }) {
  const dialog = useRef(null)
  const [selection, setSelection] = useState(null)
  const [draft, setDraft] = useState({ ingredientName: '', quantity: '', unit: '개' })
  useEffect(() => { const node = dialog.current; node.showModal(); return () => node.close() }, [])
  function choose(action, item) {
    setSelection({ action, item })
    setDraft(item ? { ingredientName: item.ingredientName, quantity: item.quantity, unit: item.unit } : { ingredientName: '', quantity: '', unit: '개' })
  }
  return <dialog ref={dialog} aria-label="자주 사용하는 재료 관리" onCancel={(event) => { event.preventDefault(); onClose() }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl backdrop:bg-black/40">
    <header className="flex items-center justify-between gap-3"><h3 className="text-lg font-extrabold">자주 사용하는 재료 관리</h3><button type="button" aria-label="즐겨찾기 관리 닫기" onClick={onClose} className="btn-secondary min-h-11 px-3"><X aria-hidden="true" className="h-4 w-4" /></button></header>
    <p className="my-4 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">서버 연동 준비 중입니다. 현재는 기본 목록만 사용합니다. 추가·수정 내용을 입력해 볼 수 있지만 저장·삭제는 지원하지 않으며, 창을 닫으면 입력 내용이 사라집니다. 실제 냉장고 재고에는 영향을 주지 않습니다.</p>
    <button type="button" onClick={() => choose('add')} className="btn-secondary min-h-11"><Plus aria-hidden="true" className="h-4 w-4" />즐겨찾기 추가</button>
    <ul className="my-4 space-y-2">{items.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3"><span className="min-w-0 break-all text-sm font-semibold">{item.icon} {item.ingredientName} · {item.quantity}{item.unit}</span><div className="flex gap-1"><button type="button" aria-label={`${item.ingredientName} 즐겨찾기 수정`} onClick={() => choose('edit', item)} className="btn-secondary min-h-11 px-3"><Pencil aria-hidden="true" className="h-4 w-4" /></button><button type="button" aria-label={`${item.ingredientName} 즐겨찾기 삭제`} onClick={() => choose('delete', item)} className="btn-secondary min-h-11 px-3"><Trash2 aria-hidden="true" className="h-4 w-4" /></button></div></li>)}</ul>
    {selection && <section aria-label="즐겨찾기 편집" className="space-y-3 border-t border-gray-100 pt-4"><h4 className="font-bold">{selection.action === 'delete' ? '즐겨찾기 삭제' : selection.action === 'add' ? '즐겨찾기 추가' : '즐겨찾기 수정'}</h4>
      {selection.action === 'delete' ? <p className="break-all text-sm">{selection.item.ingredientName} · 서버 API 연결 후 삭제할 수 있습니다.</p> : <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2"><span className="label">즐겨찾기 재료명</span><input maxLength="100" value={draft.ingredientName} onChange={(event) => setDraft({ ...draft, ingredientName: event.target.value })} className="input min-h-11" /></label>
        <label className="min-w-0"><span className="label">기본 수량</span><input type="number" min="0.001" max="999999999.999" step="0.001" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} className="input min-h-11" /></label>
        <label><span className="label">즐겨찾기 단위</span><input maxLength="20" value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} className="input min-h-11" /></label>
      </div>}
      <button type="button" disabled={!favoriteSupport.canPersist} className="btn-primary min-h-11">{selection.action === 'delete' ? '삭제 확정 · 서버 연동 준비 중' : '저장 · 서버 연동 준비 중'}</button>
    </section>}
  </dialog>
}

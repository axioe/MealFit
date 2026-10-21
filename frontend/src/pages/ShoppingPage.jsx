import React, { useState } from 'react';
import { Check, CheckCircle2, PackageCheck, Plus, RefreshCw, ShoppingCart, Trash2, X } from 'lucide-react';
export function ShoppingPage() {
    const items = [];
    const isLoading = false;
    // Modals
    const [showAddManualModal, setShowAddManualModal] = useState(false);
    const [restockingItem, setRestockingItem] = useState(null);
    // Manual Add Form
    const [manualName, setManualName] = useState('');
    const [manualQty, setManualQty] = useState("");
    const [manualUnit, setManualUnit] = useState('개');
    const [manualNote, setManualNote] = useState('');
    // Restock Form
    const [purchasedQty, setPurchasedQty] = useState("");
    const [restockStorage, setRestockStorage] = useState('fridge');
    const [restockExpDate, setRestockExpDate] = useState('');
    const isRestocking = false;
    const handleOpenRestockModal = (item) => {
        const totalNeeded = item.autoDeficitQuantity + item.manualQuantity;
        setRestockingItem(item);
        setPurchasedQty(totalNeeded > 0 ? totalNeeded : 1);
        setRestockStorage('fridge');
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setRestockExpDate(d.toISOString().slice(0, 10));
    };
    // Group items by category
    const activeItems = items.filter(i => !i.isExcluded && i.status !== 'bought');
    const excludedItems = items.filter(i => i.isExcluded && i.status !== 'bought');
    const completedItems = items.filter(i => i.status === 'bought');
    return (<>
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            구매 예정: {activeItems.length}개 품목
          </div>
          {completedItems.length > 0 && (<div className="px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold">
              구매 완료: {completedItems.length}개
            </div>)}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-2xs min-h-[44px] cursor-pointer" disabled>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`}/>
            <span>새로 계산</span>
          </button>

          <button type="button" onClick={() => setShowAddManualModal(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs min-h-[44px] cursor-pointer">
            <Plus className="w-4 h-4"/>
            <span>수동 품목 추가</span>
          </button>
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (<div className="py-20 text-center text-gray-400 text-sm">장바구니 부족분을 계산 중입니다...</div>) : activeItems.length === 0 && completedItems.length === 0 && excludedItems.length === 0 ? (<div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-200">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
          <h4 className="font-bold text-gray-800 text-base mb-1">장바구니가 비어 있습니다.</h4>
          <p className="text-xs text-gray-500 mb-5 max-w-md mx-auto leading-relaxed">
            식단을 추천받아 확정하시면, 냉장고 보유 재고와 비교하여 부족한 식재료만 자동으로 계산되어 이곳에 담깁니다.
          </p>
          <button type="button" onClick={() => setShowAddManualModal(true)} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-xs hover:bg-emerald-700 cursor-pointer">
            <Plus className="w-4 h-4"/> 필요한 재료 직접 추가
          </button>
        </div>) : (<div className="space-y-6">
          {/* Active Items to Buy */}
          {activeItems.length > 0 && (<div className="space-y-3">
              <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                구매 필요 품목 ({activeItems.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeItems.map(item => {
                    const totalQty = Number((item.autoDeficitQuantity + item.manualQuantity).toFixed(2));
                    return (<div key={item.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
                      <div>
                        {/* Title and Exclude Checkbox */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <input type="checkbox" checked={item.isExcluded} title="장보기 목록에서 임시 제외" className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" disabled/>
                            <h4 className="font-bold text-base text-gray-900">{item.ingredientName}</h4>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-black text-rose-600 tracking-tight">
                              {totalQty} {item.unit}
                            </span>
                            <span className="block text-[10px] text-gray-400 font-medium">구매 권장량</span>
                          </div>
                        </div>

                        {/* Quantity Breakdown (Auto deficit vs Manual) */}
                        <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                          {item.autoDeficitQuantity > 0 && (<span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                              식단 부족분: {item.autoDeficitQuantity}{item.unit}
                            </span>)}
                          {item.manualQuantity > 0 && (<span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold text-[11px]">
                              수동 추가: {item.manualQuantity}{item.unit}
                            </span>)}
                          {item.status === 'partial' && (<span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold text-[11px]">
                              부분 구매됨
                            </span>)}
                        </div>

                        {/* Connected Meal Sources (Audit Reason) */}
                        {item.sources && item.sources.length > 0 && (<div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-600 space-y-1 mb-3">
                            <p className="font-bold text-gray-700">연결된 식단:</p>
                            {item.sources.map((s, idx) => (<div key={idx} className="flex items-center justify-between">
                                <span>• {s.date} {s.mealType === 'breakfast' ? '아침' : s.mealType === 'lunch' ? '점심' : '저녁'} ({s.recipeTitle})</span>
                                <span className="font-medium">{s.requiredQty}{s.unit}</span>
                              </div>))}
                          </div>)}

                        {item.note && (<p className="text-[11px] text-gray-500 italic mb-3">
                            메모: {item.note}
                          </p>)}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-2">
                        <button type="button" onClick={() => handleOpenRestockModal(item)} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs min-h-[44px] cursor-pointer">
                          <PackageCheck className="w-4 h-4"/>
                          <span>구매 완료 & 냉장고 입고</span>
                        </button>
                        {item.manualQuantity > 0 && item.autoDeficitQuantity === 0 && (<button type="button" className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer" title="삭제" disabled>
                            <Trash2 className="w-4 h-4"/>
                          </button>)}
                      </div>
                    </div>);
                })}
              </div>
            </div>)}

          {/* Excluded Items */}
          {excludedItems.length > 0 && (<div className="space-y-3 pt-4">
              <h3 className="font-bold text-sm text-gray-500 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                장보기 제외 목록 ({excludedItems.length})
              </h3>
              <div className="space-y-2">
                {excludedItems.map(item => (<div key={item.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs opacity-70">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={item.isExcluded} className="w-4 h-4 rounded text-emerald-600 cursor-pointer" disabled/>
                      <span className="font-bold text-gray-700 line-through">{item.ingredientName}</span>
                      <span className="text-gray-500">({item.autoDeficitQuantity + item.manualQuantity}{item.unit})</span>
                    </div>
                    <span className="text-[11px] text-gray-400">구매 제외 상태</span>
                  </div>))}
              </div>
            </div>)}

          {/* Completed Items */}
          {completedItems.length > 0 && (<div className="space-y-3 pt-4">
              <h3 className="font-bold text-sm text-gray-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600"/>
                입고 완료된 품목 ({completedItems.length})
              </h3>
              <div className="space-y-2">
                {completedItems.map(item => (<div key={item.id} className="p-3 rounded-xl bg-white border border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600"/>
                      <span className="font-semibold text-gray-800">{item.ingredientName}</span>
                    </div>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                      냉장고 입고 완료
                    </span>
                  </div>))}
              </div>
            </div>)}
        </div>)}

      {/* Manual Add Item Modal */}
      {showAddManualModal && (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">장바구니 품목 직접 추가</h3>
              <button onClick={() => setShowAddManualModal(false)} className="text-gray-400 p-1 cursor-pointer">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={event => event.preventDefault()} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">재료명 *</label>
                <input type="text" required placeholder="예: 그릭요거트, 방울토마토" value={manualName} onChange={e => setManualName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">수량 *</label>
                  <input type="number" step="any" min="0.1" required value={manualQty} onChange={e => setManualQty(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">단위 *</label>
                  <select value={manualUnit} onChange={e => setManualUnit(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"><option value="" disabled>선택하세요</option>
                    <option value="개">개</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="팩">팩</option>
                    <option value="봉지">봉지</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">메모 (선택)</label>
                <input type="text" placeholder="예: 무가당으로 살 것" value={manualNote} onChange={e => setManualNote(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button type="button" onClick={() => setShowAddManualModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold min-h-[44px] cursor-pointer">
                  취소
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[44px] cursor-pointer" disabled>
                  추가하기
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Restock Modal (Requirement #8) */}
      {restockingItem && (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                📦 구매 완료 및 냉장고 입고
              </h3>
              <button onClick={() => setRestockingItem(null)} className="text-gray-400 p-1 cursor-pointer">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              <strong>{restockingItem.ingredientName}</strong> 구매 완료 내역을 냉장고 재고 묶음으로 즉시 입고합니다. (부분 구매 지원)
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  실제 구매 수량 ({restockingItem.unit}) *
                </label>
                <input type="number" step="any" min="0.1" required value={purchasedQty} onChange={e => setPurchasedQty(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">보관 위치 *</label>
                  <select value={restockStorage} onChange={e => setRestockStorage(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"><option value="" disabled>선택하세요</option>
                    <option value="fridge">냉장 보관</option>
                    <option value="freezer">냉동 보관</option>
                    <option value="pantry">실온 보관</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">유통/소비기한</label>
                  <input type="date" value={restockExpDate} onChange={e => setRestockExpDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"/>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button type="button" onClick={() => setRestockingItem(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold min-h-[44px] cursor-pointer">
                  취소
                </button>
                <button type="button" disabled={isRestocking} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[44px] cursor-pointer disabled:opacity-50">
                  {isRestocking ? '입고 처리 중...' : '냉장고에 입고하기'}
                </button>
              </div>
            </div>
          </div>
        </div>)}
    </>);
}

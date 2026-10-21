import React, { useState } from 'react';
import { ChevronDown, ChevronUp, History, Plus, Refrigerator, Search, Trash2, X } from 'lucide-react';
import { ExpirationBadge } from '@/components/common/StatusBadge';
import { getExpirationStatus } from '@/lib/expiration';
export function FridgePage() {
    const groups = [];
    const standardIngredients = [];
    const transactions = [];
    const isLoading = false;
    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [storageFilter, setStorageFilter] = useState('all');
    const [expandedGroups, setExpandedGroups] = useState({});
    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingLot, setEditingLot] = useState(null);
    const [disposingLot, setDisposingLot] = useState(null);
    const [disposeQty, setDisposeQty] = useState("");
    const [disposeReason, setDisposeReason] = useState('기한 경과로 인한 폐기');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    // Form state for Add/Edit
    const [formData, setFormData] = useState({ ingredientName: "", quantity: "", unit: "", storage: "", expirationType: "", expirationDate: "", minStock: "", memo: "" });
    const todayStr = new Date().toISOString().slice(0, 10);
    const toggleGroup = (key) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };
    const openAddModal = (defaultName) => {
        setEditingLot(null);
        setFormData({
            ingredientName: defaultName || '',
            quantity: 1,
            unit: '개',
            storage: 'fridge',
            expirationType: 'expiration',
            expirationDate: '',
            minStock: 0,
            memo: ''
        });
        setShowAddModal(true);
    };
    const openEditModal = (lot) => {
        setEditingLot(lot);
        setFormData({
            ingredientName: lot.ingredientName,
            quantity: lot.quantity,
            unit: lot.unit,
            storage: lot.storage,
            expirationType: lot.expirationType,
            expirationDate: lot.expirationDate || '',
            minStock: lot.minStock || 0,
            memo: lot.memo || ''
        });
        setShowAddModal(true);
    };
    const handleOpenDisposeModal = (lot) => {
        setDisposingLot(lot);
        setDisposeQty(lot.quantity);
        setDisposeReason('기한 경과로 인한 폐기');
    };
    // Filter groups
    const filteredGroups = groups.filter(g => {
        const matchSearch = g.ingredientName.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchSearch)
            return false;
        if (storageFilter === 'all')
            return true;
        return g.lots.some(l => l.storage === storageFilter);
    });
    return (<>
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
          <input type="text" placeholder="식재료명 검색 (예: 달걀, 두부, 양파)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-emerald-500 shadow-2xs"/>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHistoryModal(true)} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs min-h-[44px] cursor-pointer">
            <History className="w-4 h-4 text-gray-500"/>
            <span>수량 변경 이력</span>
          </button>

          <button onClick={() => openAddModal()} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs min-h-[44px] cursor-pointer">
            <Plus className="w-4 h-4"/>
            <span>재료 등록</span>
          </button>
        </div>
      </div>

      {/* Storage Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {[
            { key: 'all', label: '전체 재료' },
            { key: 'fridge', label: '🧊 냉장 보관' },
            { key: 'freezer', label: '❄️ 냉동 보관' },
            { key: 'pantry', label: '🧺 실온 보관' }
        ].map(tab => (<button key={tab.key} onClick={() => setStorageFilter(tab.key)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer shrink-0 ${storageFilter === tab.key
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {tab.label}
          </button>))}
      </div>

      {/* Main Inventory Group List */}
      {isLoading ? (<div className="text-center py-16 text-gray-400 text-sm">냉장고 재고를 불러오는 중입니다...</div>) : filteredGroups.length === 0 ? (<div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-200">
          <Refrigerator className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
          <h4 className="font-bold text-gray-800 text-base mb-1">등록된 식재료가 없습니다.</h4>
          <p className="text-xs text-gray-500 mb-5 max-w-md mx-auto">
            달걀, 두부, 양파 등 자주 쓰는 재료를 등록해두시면 AI가 기한 임박 재료를 우선 소진하는 식단을 추천해드립니다.
          </p>
          <button onClick={() => openAddModal()} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-xs hover:bg-emerald-700 cursor-pointer">
            <Plus className="w-4 h-4"/> 첫 재료 등록하기
          </button>
        </div>) : (<div className="space-y-4">
          {filteredGroups.map(group => {
                const isExpanded = expandedGroups[group.ingredientName] ?? false;
                const lotsCount = group.lots.length;
                return (<div key={group.ingredientName} className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition-all">
                {/* Group Summary Row */}
                <div onClick={() => toggleGroup(group.ingredientName)} className="p-4 md:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0 border border-emerald-100">
                      {group.ingredientName[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base text-gray-900 truncate">
                          {group.ingredientName}
                        </h4>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                          총 {group.totalQuantity} {group.unit}
                        </span>
                        {lotsCount > 1 && (<span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {lotsCount}개 묶음 분리 관리
                          </span>)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>가장 빠른 기한: {group.earliestExpiration || '미등록'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <ExpirationBadge status={group.worstStatus} date={group.earliestExpiration}/>
                    <button type="button" className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                      {isExpanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                    </button>
                  </div>
                </div>

                {/* Expanded Distinct Lots (Requirement #5) */}
                {isExpanded && (<div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-gray-500 px-1 font-semibold">
                      <span>별도 관리 묶음 상세:</span>
                      <button onClick={e => {
                            e.stopPropagation();
                            openAddModal(group.ingredientName);
                        }} className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer">
                        <Plus className="w-3.5 h-3.5"/> 이 재료 새 묶음 추가
                      </button>
                    </div>

                    {group.lots.map(lot => {
                            const lotStatus = getExpirationStatus(lot.expirationDate, 3, todayStr);
                            const storageLabel = {
                                fridge: '🧊 냉장',
                                freezer: '❄️ 냉동',
                                pantry: '🧺 실온'
                            }[lot.storage];
                            return (<div key={lot.id} className="p-3.5 rounded-xl bg-white border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-800">
                                {lot.quantity} {lot.unit}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium text-[11px]">
                                {storageLabel}
                              </span>
                              <ExpirationBadge status={lotStatus} date={lot.expirationDate}/>
                            </div>
                            <div className="text-gray-500 text-[11px] flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              <span>기한 유형: {lot.expirationType === 'use_by' ? '소비기한' : lot.expirationType === 'expiration' ? '유통기한' : lot.expirationType === 'custom' ? '직접지정' : '미등록'}</span>
                              {lot.minStock ? <span>최소유지: {lot.minStock}{lot.unit}</span> : null}
                              {lot.memo ? <span className="text-gray-600 italic">“{lot.memo}”</span> : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                            <button onClick={() => openEditModal(lot)} className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium min-h-[36px] cursor-pointer">
                              수정
                            </button>
                            <button onClick={() => handleOpenDisposeModal(lot)} className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-medium min-h-[36px] cursor-pointer">
                              폐기 기록
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer" title="삭제" disabled>
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </div>
                        </div>);
                        })}
                  </div>)}
              </div>);
            })}
        </div>)}

      {/* Add / Edit Lot Modal */}
      {showAddModal && (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base md:text-lg font-bold text-gray-900">
                {editingLot ? '재고 묶음 정보 수정' : '신규 재료 묶음 등록'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Quick Pick Standard Ingredients */}
            {!editingLot && (<div className="mb-4">
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                  자주 쓰는 식재료 빠른 선택:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-200">
                  {standardIngredients.slice(0, 10).map(std => (<button key={std.id} type="button" className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 text-xs text-gray-700 font-medium transition-colors cursor-pointer" disabled>
                      {std.name} ({std.standardUnit})
                    </button>))}
                </div>
              </div>)}

            <form onSubmit={event => event.preventDefault()} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">재료명 *</label>
                <input type="text" required placeholder="예: 달걀, 두부, 양파" value={formData.ingredientName} onChange={e => setFormData({ ...formData, ingredientName: e.target.value })} disabled={Boolean(editingLot)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500 disabled:bg-gray-100"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">수량 *</label>
                  <input type="number" step="any" required min="0.1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">단위 *</label>
                  <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500 bg-white"><option value="" disabled>선택하세요</option>
                    <option value="개">개</option>
                    <option value="g">g (그램)</option>
                    <option value="kg">kg (킬로그램)</option>
                    <option value="ml">ml (밀리리터)</option>
                    <option value="L">L (리터)</option>
                    <option value="모">모 (두부)</option>
                    <option value="쪽">쪽 (마늘)</option>
                    <option value="봉지">봉지</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">보관 위치 *</label>
                  <select value={formData.storage} onChange={e => setFormData({ ...formData, storage: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500 bg-white"><option value="" disabled>선택하세요</option>
                    <option value="fridge">냉장 보관</option>
                    <option value="freezer">냉동 보관</option>
                    <option value="pantry">실온 보관</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">기한 구분</label>
                  <select value={formData.expirationType} onChange={e => setFormData({ ...formData, expirationType: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500 bg-white"><option value="" disabled>선택하세요</option>
                    <option value="expiration">유통기한</option>
                    <option value="use_by">소비기한</option>
                    <option value="custom">직접지정 예정일</option>
                    <option value="unknown">기한 모름/미등록</option>
                  </select>
                </div>
              </div>

              {formData.expirationType !== 'unknown' && (<div>
                  <label className="font-bold text-gray-700 block mb-1">기한 날짜 (YYYY-MM-DD)</label>
                  <input type="date" value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500 bg-white"/>
                </div>)}

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  최소 유지 수량 (선택 - 이 수량 밑으로 떨어지면 자동 장바구니 추가)
                </label>
                <input type="number" min="0" step="any" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">메모 (선택)</label>
                <input type="text" placeholder="예: 마트 세일 구매분, 어제 개봉함" value={formData.memo} onChange={e => setFormData({ ...formData, memo: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 min-h-[44px] cursor-pointer">
                  취소
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs min-h-[44px] cursor-pointer" disabled>
                  {editingLot ? '수정 완료' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Dispose Waste Modal */}
      {disposingLot && (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              🗑️ 식재료 폐기 기록
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              <strong>{disposingLot.ingredientName}</strong> (현재 보유: {disposingLot.quantity}{disposingLot.unit})
            </p>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="font-bold text-gray-700 block mb-1">폐기할 수량 ({disposingLot.unit}):</label>
                <input type="number" step="any" max={disposingLot.quantity} min="0.1" value={disposeQty} onChange={e => setDisposeQty(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-rose-500"/>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">폐기 사유:</label>
                <select value={disposeReason} onChange={e => setDisposeReason(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"><option value="" disabled>선택하세요</option>
                  <option value="기한 경과로 인한 폐기">소비/유통기한 경과</option>
                  <option value="변질 및 부패">변질 및 냄새/부패</option>
                  <option value="보관 부주의">보관 부주의 (실온 방치 등)</option>
                  <option value="기타 손상">기타 파손 및 오염</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDisposingLot(null)} className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold min-h-[44px] cursor-pointer">
                취소
              </button>
              <button type="button" className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold min-h-[44px] cursor-pointer" disabled>
                폐기 확정
              </button>
            </div>
          </div>
        </div>)}

      {/* History Ledger Modal */}
      {showHistoryModal && (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                📋 수량 변경 원장 이력
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 p-1 cursor-pointer">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {transactions.length === 0 ? (<p className="text-xs text-gray-500 py-10 text-center">기록된 이력이 없습니다.</p>) : (transactions.map(txn => {
                const typeLabel = {
                    purchase_in: '입고 (+)',
                    cook_deduct: '조리 차감 (-)',
                    cook_restore: '조리 복원 (+)',
                    manual_adjust: '수동 수정',
                    dispose: '폐기 (-)'
                }[txn.type];
                const isPositive = txn.deltaQuantity > 0;
                return (<div key={txn.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{txn.ingredientName}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${txn.type === 'purchase_in' ? 'bg-emerald-100 text-emerald-800' :
                        txn.type === 'cook_deduct' ? 'bg-blue-100 text-blue-800' :
                            txn.type === 'dispose' ? 'bg-rose-100 text-rose-800' :
                                'bg-gray-200 text-gray-800'}`}>
                            {typeLabel}
                          </span>
                        </div>
                        <p className="text-gray-500 mt-0.5">{txn.reason} ({txn.timestamp.slice(0, 16).replace('T', ' ')})</p>
                      </div>

                      <span className={`font-mono font-bold text-sm ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? `+${txn.deltaQuantity}` : txn.deltaQuantity} {txn.unit}
                      </span>
                    </div>);
            }))}
            </div>

            <div className="pt-3 border-t border-gray-100 mt-3 text-right">
              <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold text-xs hover:bg-gray-200 cursor-pointer min-h-[40px]">
                닫기
              </button>
            </div>
          </div>
        </div>)}
    </>);
}

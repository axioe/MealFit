const COMMON_FRIDGE_ITEMS = [];
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Camera, Check, CheckCircle2, ChevronDown, ChevronUp, Clock, Flame, Plus, RefreshCw, Search, ShoppingCart, Sparkles, Trash2, Upload, Utensils, X } from 'lucide-react';
import { getExpirationStatus } from '@/lib/expiration';
export function FridgeTailoredDietTab({ diet = {} } = {}) {
    const navigate = useNavigate();
    // Inventory state
    const inventoryLots = [];
    const standardIngredients = [];
    // Recommendations state
    const matchedRecipes = [];
    const isLoadingRecipes = false;
    const trainerProfile = null;
    const todayWorkout = null;
    // Quick Ingredient Search & Add Form state
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [formName, setFormName] = useState('');
    const [formQuantity, setFormQuantity] = useState("");
    const [formUnit, setFormUnit] = useState('개');
    const [formExpirationDate, setFormExpirationDate] = useState('');
    const isAddingIngredient = false;
    // Photo Scan (Gemini Vision) state
    const fileInputRef = useRef(null);
    const [selectedImageBase64, setSelectedImageBase64] = useState(null);
    const isScanningImage = false;
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewItems, setReviewItems] = useState([]);
    const isSubmittingBatch = false;
    // Cooking state
    const [cookingModalRecipe, setCookingModalRecipe] = useState(null);
    const isCookingSubmitting = false;
    // Expanded recipe steps
    const [expandedRecipeIds, setExpandedRecipeIds] = useState({});
    // Feedback toast banner
    const [toastMessage, setToastMessage] = useState(null);
    const todayStr = new Date().toISOString().slice(0, 10);
    const toggleRecipeSteps = (id) => {
        setExpandedRecipeIds(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const filteredStandard = standardIngredients.filter(s => searchQuery.trim() && s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 6);
    const goalLabel = trainerProfile?.workoutGoal === 'loss' ? '체중 감량' :
        trainerProfile?.workoutGoal === 'hypertrophy' ? '근육 증가' :
            trainerProfile?.workoutGoal === 'stamina' ? '체력 증진' : '균형 건강 유지';
    const userBudget = diet?.budgetPerMeal || trainerProfile?.budgetPerMeal || '';
    // Expiring items
    const expiringLots = inventoryLots.filter(l => {
        const s = getExpirationStatus(l.expirationDate, 3, todayStr);
        return s === 'today' || s === 'imminent' || s === 'expired';
    });
    return (<div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (<div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm transition-all ${toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                toastMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                    'bg-blue-50 border-blue-200 text-blue-900'}`}>
          <div className="mt-0.5 shrink-0">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600"/> :
                toastMessage.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-600"/> :
                    <Sparkles className="w-5 h-5 text-blue-600"/>}
          </div>
          <div className="flex-1 text-xs">
            <h5 className="font-bold text-sm leading-tight">{toastMessage.title}</h5>
            {toastMessage.desc && <p className="mt-1 leading-relaxed opacity-90">{toastMessage.desc}</p>}
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4"/>
          </button>
        </div>)}

      {/* Section 1: Top Status & AI Coaching Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 rounded-2xl p-5 md:p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5"/>
              <span>Gemini 3.8 Flash 스마트 냉장고 셰프</span>
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">
              손질부터 완성까지 15분! 냉장고 맞춤 식단
            </h3>
            <p className="text-xs md:text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed">
              냉장고에 있는 재료를 우선 활용하여 음식물 쓰레기를 줄이고, 오늘의 운동과 피트니스 목표에 최적화된 검증 레시피(15분 이내)를 추천합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={isLoadingRecipes} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 min-h-[42px]">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecipes ? 'animate-spin text-emerald-600' : ''}`}/>
              <span>{isLoadingRecipes ? 'AI 맞춤 분석 중...' : '추천 레시피 새로고침'}</span>
            </button>
          </div>
        </div>

        {/* Current State Badges */}
        <div className="mt-5 pt-4 border-t border-emerald-500/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px]">내 냉장고 재료</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">{inventoryLots.length}종 보유</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px]">기한 임박/경과</span>
            <span className="text-base font-extrabold text-amber-300 mt-0.5 block">{expiringLots.length}건 소진 필요</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px]">사용자 피트니스 목표</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">{goalLabel}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-emerald-200 block text-[11px]">한 끼 식사 예산</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">{userBudget.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* Section 2: 식재료 등록 (원터치 버튼 + 검색 추가 + 사진 인식) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
          <div>
            <h4 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              냉장고 식재료 등록 및 관리
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              원터치 버튼, 검색, 또는 냉장고 사진을 올려 보유 재료를 등록하면 맞춤 요리가 즉시 계산됩니다.
            </p>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 self-start sm:self-auto">
            현재 보유: {inventoryLots.length}개 품목
          </span>
        </div>

        {/* 1) 자주 쓰는 재료 원터치 추가 버튼들 */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <span>⚡ 자주 쓰는 재료 원터치 추가</span>
              <span className="text-[11px] font-normal text-gray-500">(클릭 시 기본 분량과 유통기한으로 즉시 등록)</span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {COMMON_FRIDGE_ITEMS.map((item) => {
            const alreadyHas = inventoryLots.some(l => l.ingredientName.trim() === item.name.trim());
            return (<button key={item.name} type="button" disabled={isAddingIngredient} className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer relative group ${alreadyHas
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 hover:bg-emerald-100'
                    : 'bg-gray-50/80 border-gray-200 text-gray-800 hover:bg-white hover:border-emerald-400 hover:shadow-xs'}`} title={`${item.name} ${item.defaultQty}${item.defaultUnit} 즉시 추가 (유통기한 +${item.defaultDays}일)`}>
                  <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="text-xs font-extrabold">{item.name}</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">{item.defaultQty}{item.defaultUnit}</span>
                  {alreadyHas && (<span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>)}
                </button>);
        })}
          </div>
        </div>

        {/* 2) 식재료 검색 추가 폼 */}
        <div className="pt-2">
          <label className="text-xs font-bold text-gray-800 block mb-2">
            🔍 식재료 검색 & 직접 추가 (유통기한 선택 입력)
          </label>

          <form onSubmit={event => event.preventDefault()} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 relative">
              {/* Ingredient Name with Autocomplete */}
              <div className="sm:col-span-4 relative">
                <div className="relative">
                  <input type="text" value={formName} onChange={e => {
            setFormName(e.target.value);
            setSearchQuery(e.target.value);
            setShowSearchDropdown(true);
        }} onFocus={() => setShowSearchDropdown(true)} placeholder="재료명 검색 (예: 두부, 양파, 계란)" className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none"/>
                </div>

                {/* Autocomplete Dropdown */}
                {showSearchDropdown && filteredStandard.length > 0 && (<div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                    {filteredStandard.map(std => (<button key={std.id} type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 flex items-center justify-between border-b border-gray-50 last:border-none" disabled>
                        <span className="font-bold text-gray-800">{std.name}</span>
                        <span className="text-[10px] text-gray-500">{std.standardUnit} | 기본 {std.defaultShelfDays}일 보관</span>
                      </button>))}
                  </div>)}
              </div>

              {/* Quantity */}
              <div className="sm:col-span-2">
                <input type="number" min="0.1" step="any" value={formQuantity} onChange={e => setFormQuantity(Number(e.target.value))} placeholder="수량" className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
              </div>

              {/* Unit */}
              <div className="sm:col-span-2">
                <select value={formUnit} onChange={e => setFormUnit(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="" disabled>선택하세요</option>
                  <option value="개">개</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="모">모</option>
                  <option value="캔">캔</option>
                  <option value="팩">팩</option>
                  <option value="공기">공기</option>
                  <option value="대">대</option>
                  <option value="통">통</option>
                  <option value="봉">봉</option>
                  <option value="장">장</option>
                </select>
              </div>

              {/* Expiration Date (선택 입력) */}
              <div className="sm:col-span-2">
                <input type="date" value={formExpirationDate} onChange={e => setFormExpirationDate(e.target.value)} title="유통기한 (선택 입력)" className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
              </div>

              {/* Submit Button */}
              <div className="sm:col-span-2">
                <button type="submit" className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[40px]" disabled>
                  <Plus className="w-3.5 h-3.5"/>
                  <span>냉장고 추가</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              * 유통기한은 선택 사항이며, 입력 시 기한 임박 요리 추천과 유통기한 알림에 우선 반영됩니다.
            </p>
          </form>
        </div>

        {/* 3) (선택 기능) 냉장고 사진 올리기 (Gemini Vision) */}
        <div className="pt-2 border-t border-gray-100">
          <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-emerald-50/60 rounded-xl p-4 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Camera className="w-5 h-5"/>
              </div>
              <div>
                <h5 className="font-extrabold text-xs text-gray-900 flex items-center gap-1.5">
                  <span>📷 냉장고 사진으로 식재료 자동 인식 (선택 기능)</span>
                  <span className="px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800 text-[10px] font-bold">Gemini Vision</span>
                </h5>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  냉장고나 장바구니 사진을 올리면 AI가 재료 목록을 뽑아주며, 사용자가 확인·수정한 뒤에만 최종 등록됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" disabled/>

              {!selectedImageBase64 ? (<button type="button" onClick={() => fileInputRef.current?.click()} className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[42px]">
                  <Upload className="w-3.5 h-3.5"/>
                  <span>냉장고 사진 선택 / 촬영</span>
                </button>) : (<div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-300 shrink-0">
                    <img src={selectedImageBase64} alt="Preview" className="w-full h-full object-cover"/>
                  </div>
                  <button type="button" disabled={isScanningImage} className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 min-h-[42px]">
                    <Sparkles className={`w-3.5 h-3.5 ${isScanningImage ? 'animate-spin' : ''}`}/>
                    <span>{isScanningImage ? 'Gemini 분석 중...' : '식재료 목록 분석하기'}</span>
                  </button>
                  <button type="button" onClick={() => {
                setSelectedImageBase64(null);
                if (fileInputRef.current)
                    fileInputRef.current.value = '';
            }} className="px-2.5 py-2.5 rounded-xl border border-gray-300 text-gray-500 hover:bg-gray-100 text-xs" title="사진 취소">
                    <X className="w-4 h-4"/>
                  </button>
                </div>)}
            </div>
          </div>
        </div>

        {/* 4) 현재 보유 중인 냉장고 식재료 칩 리스트 */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700">현재 보관 중인 식재료 ({inventoryLots.length}개):</span>
            <button type="button" onClick={() => navigate('/fridge')} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
              <span>전체 냉장고 관리 페이지 이동</span>
              <ChevronDown className="w-3 h-3 -rotate-90"/>
            </button>
          </div>

          {inventoryLots.length === 0 ? (<div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs text-gray-500">
              냉장고가 비어있습니다. 상단의 자주 쓰는 재료 원터치 버튼이나 검색을 통해 식재료를 등록해보세요!
            </div>) : (<div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {inventoryLots.map(lot => {
                const expStatus = getExpirationStatus(lot.expirationDate, 3, todayStr);
                const isImminent = expStatus === 'imminent' || expStatus === 'today';
                const isExpired = expStatus === 'expired';
                return (<div key={lot.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border ${isExpired
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : isImminent
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                    <span>{lot.ingredientName}</span>
                    <span className="text-gray-500 font-semibold">{lot.quantity}{lot.unit}</span>
                    {lot.expirationDate && (<span className={`text-[10px] px-1 py-0.2 rounded-sm ${isExpired ? 'bg-rose-200 text-rose-900' :
                            isImminent ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-700'}`}>
                        {isExpired ? '기한만료' : isImminent ? '임박' : lot.expirationDate.slice(5)}
                      </span>)}
                    <button type="button" className="text-gray-400 hover:text-rose-600 ml-0.5 cursor-pointer" title="삭제" disabled>
                      <X className="w-3 h-3"/>
                    </button>
                  </div>);
            })}
            </div>)}
        </div>
      </div>

      {/* Section 3: 냉장고 맞춤 식단 추천 결과 목록 */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-600"/>
              <span>AI 냉장고 맞춤 15분 레시피 추천 ({matchedRecipes.length}선)</span>
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-1">
              <span className="font-semibold text-gray-800">정렬 기준:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">1순위: 보유 재료 즉시 요리</span>
              <span>➔</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">2순위: 기한 임박 재료 우선 소진</span>
              <span>➔</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">3순위: 1~2개 부족 재료 요리</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>목표: <strong className="text-gray-800">{goalLabel}</strong></span>
            <span>|</span>
            <span>운동: <strong className="text-gray-800">{todayWorkout?.title || '기본 루틴'}</strong></span>
          </div>
        </div>

        {/* Recommendations Grid */}
        {isLoadingRecipes ? (<div className="py-20 text-center bg-white rounded-2xl border border-gray-200">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin mx-auto mb-3"></div>
            <p className="font-bold text-gray-800 text-sm">보유 식재료 매칭 및 Gemini 15분 맞춤 식단 분석 중...</p>
            <p className="text-xs text-gray-500 mt-1">알레르기·기피 재료를 철저히 배제하고 최적의 레시피 3~5개를 선별합니다.</p>
          </div>) : matchedRecipes.length === 0 ? (<div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-6">
            <Utensils className="w-10 h-10 text-gray-400 mx-auto mb-2"/>
            <p className="text-sm font-bold text-gray-700">조건에 맞는 레시피를 찾을 수 없습니다.</p>
            <p className="text-xs text-gray-500 mt-1">상단에서 계란, 두부, 밥 등 기본 재료를 추가해보세요.</p>
          </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matchedRecipes.map((item, idx) => {
                const recipe = item.recipe;
                const isExpanded = !!expandedRecipeIds[recipe.id];
                const missingCount = item.missingIngredients.length;
                // Match tier tag
                const tierBadge = item.matchTier === 'ready_now' ? (<span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px] flex items-center gap-1">
                  <Check className="w-3 h-3"/>
                  <span>즉시 조리 가능 (부족 0개)</span>
                </span>) : item.matchTier === 'expiring_priority' ? (<span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600"/>
                  <span>임박 재료 우선 소진</span>
                </span>) : (<span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[11px] flex items-center gap-1">
                  <span>부족 재료 {missingCount}개</span>
                </span>);
                return (<div key={recipe.id} className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all hover:shadow-md ${item.matchTier === 'ready_now'
                        ? 'border-emerald-300 ring-1 ring-emerald-200'
                        : item.matchTier === 'expiring_priority'
                            ? 'border-amber-300'
                            : 'border-gray-200'}`}>
                  <div>
                    {/* Header Bar */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {tierBadge}
                      </div>

                      {/* Cook Time Badge */}
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        <Clock className="w-3.5 h-3.5"/>
                        <span>{recipe.cookTimeMinutes}분 완성</span>
                      </span>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Recipe Title & Desc */}
                      <div>
                        <h4 className="font-extrabold text-lg text-gray-900 leading-snug">
                          {recipe.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {recipe.description}
                        </p>
                      </div>

                      {/* Nutrition Stats (Calories, Protein, Carbs, Fat) */}
                      <div className="grid grid-cols-4 gap-1.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">열량</span>
                          <span className="font-extrabold text-gray-900 flex items-center justify-center gap-0.5 text-xs">
                            <Flame className="w-3 h-3 text-amber-500"/>
                            {recipe.nutrition.calories}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-700 block font-semibold">단백질</span>
                          <span className="font-extrabold text-emerald-700 text-xs">
                            {recipe.nutrition.protein}g
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">탄수</span>
                          <span className="font-extrabold text-gray-800 text-xs">
                            {recipe.nutrition.carbs}g
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">지방</span>
                          <span className="font-extrabold text-gray-800 text-xs">
                            {recipe.nutrition.fat}g
                          </span>
                        </div>
                      </div>

                      {/* Gemini 1-Line AI Reason */}
                      {item.aiReason && (<div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-emerald-200/80 text-xs text-emerald-950">
                          <p className="font-bold text-[11px] text-emerald-800 flex items-center gap-1 mb-0.5">
                            <Sparkles className="w-3 h-3 text-emerald-600"/>
                            <span>Gemini 트레이너 추천 이유:</span>
                          </p>
                          <p className="text-xs leading-relaxed font-medium">{item.aiReason}</p>
                        </div>)}

                      {/* Ingredients State: Available vs Missing */}
                      <div className="space-y-2 text-xs">
                        {/* Missing Ingredients */}
                        {missingCount > 0 ? (<div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/70 text-rose-900">
                            <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                              <span className="flex items-center gap-1 text-rose-700">
                                <AlertCircle className="w-3.5 h-3.5"/>
                                <span>부족한 재료 ({missingCount}개):</span>
                              </span>
                              <span className="text-[11px] font-semibold text-rose-600">
                                예상 구매비: {item.missingCost.toLocaleString()}원
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {item.missingIngredients.map((m, i) => (<span key={i} className="px-2 py-0.5 rounded-md bg-white border border-rose-200 text-rose-800 font-semibold text-[11px]">
                                  {m.name} {m.quantity}{m.unit}
                                </span>))}
                            </div>
                          </div>) : (<div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-600"/>
                            <span>필요한 모든 재료를 냉장고에 보유하고 있습니다!</span>
                          </div>)}

                        {/* Substitute Ingredients Guide */}
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs space-y-1">
                          <div className="font-bold text-[11px] text-amber-900 flex items-center gap-1">
                            <span>🔄 대체 재료 안내:</span>
                          </div>
                          {item.substituteNote ? (<p className="text-[11px] font-semibold text-amber-900">
                              {item.substituteNote}
                            </p>) : (<div className="text-[11px] text-amber-800">
                              {recipe.ingredients.filter(ing => ing.substitutes && ing.substitutes.length > 0).map((ing, i) => (<span key={i} className="block">
                                  • {ing.name}이(가) 없으면 <strong>{ing.substitutes?.join(', ')}</strong>(으)로 대체 가능
                                </span>))}
                            </div>)}
                        </div>

                        {/* Budget Consideration Tag */}
                        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                          <span>한 끼 예산: {userBudget.toLocaleString()}원</span>
                          <span className={item.isWithinBudget ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                            {item.isWithinBudget ? '✅ 예산 범위 내' : '⚠️ 예산 초과'}
                          </span>
                        </div>
                      </div>

                      {/* Recipe Steps (Accordion) */}
                      {isExpanded && (<div className="pt-2 border-t border-gray-100 text-xs">
                          <h6 className="font-bold text-gray-800 mb-1.5">15분 초간단 조리 순서:</h6>
                          <ol className="space-y-1.5 list-decimal pl-4 text-gray-600">
                            {recipe.steps.map((st, sIdx) => (<li key={sIdx} className="leading-relaxed">{st}</li>))}
                          </ol>
                        </div>)}
                    </div>
                  </div>

                  {/* Card Action Buttons Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50/80 space-y-2">
                    <div className="flex items-center gap-2">
                      {/* Cook Complete Button */}
                      <button type="button" onClick={() => setCookingModalRecipe(item)} className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]">
                        <Utensils className="w-3.5 h-3.5"/>
                        <span>요리 완료 (재료 차감)</span>
                      </button>

                      {/* Add Missing to Shopping Cart */}
                      {missingCount > 0 && (<button type="button" className="py-2.5 px-3 rounded-xl border border-gray-300 hover:border-emerald-500 bg-white hover:bg-emerald-50 text-gray-800 hover:text-emerald-800 font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer min-h-[40px]" title="부족한 재료를 장보기 목록에 담기" disabled>
                          <ShoppingCart className="w-3.5 h-3.5"/>
                          <span className="hidden sm:inline">장보기에 담기</span>
                        </button>)}
                    </div>

                    {/* Toggle Recipe Steps */}
                    <button type="button" onClick={() => toggleRecipeSteps(recipe.id)} className="w-full py-1 text-center text-[11px] font-semibold text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1">
                      <span>{isExpanded ? '조리법 접기' : '15분 조리 순서 보기'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                    </button>
                  </div>
                </div>);
            })}
          </div>)}
      </div>

      {/* Modal 1: Photo Recognition Review & Edit Modal (사용자 확인·수정한 뒤에만 등록) */}
      {showReviewModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 md:p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h4 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600"/>
                  <span>AI 인식 식재료 검토 및 수정</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Gemini가 감지한 식재료입니다. 수량, 단위, 유통기한을 자유롭게 확인 및 수정한 후 최종 등록하세요.
                </p>
              </div>
              <button type="button" onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Editable Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
              {reviewItems.map((item, idx) => (<div key={item.id} className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center gap-2.5 ${item.isSelected ? 'bg-white border-emerald-300' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={item.isSelected} onChange={e => {
                    const checked = e.target.checked;
                    setReviewItems(prev => prev.map((it, i) => i === idx ? { ...it, isSelected: checked } : it));
                }} className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500"/>
                    <input type="text" value={item.name} onChange={e => {
                    const val = e.target.value;
                    setReviewItems(prev => prev.map((it, i) => i === idx ? { ...it, name: val } : it));
                }} className="font-bold text-xs text-gray-900 px-2 py-1.5 rounded-lg border border-gray-300 w-28 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="재료명"/>
                  </div>

                  <div className="flex items-center gap-1.5 flex-1">
                    {/* Quantity */}
                    <input type="number" min="0.1" step="any" value={item.quantity} onChange={e => {
                    const val = Number(e.target.value);
                    setReviewItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                }} className="w-16 font-semibold text-xs text-gray-900 px-2 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="수량"/>

                    {/* Unit */}
                    <input type="text" value={item.unit} onChange={e => {
                    const val = e.target.value;
                    setReviewItems(prev => prev.map((it, i) => i === idx ? { ...it, unit: val } : it));
                }} className="w-14 font-semibold text-xs text-gray-900 px-2 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="단위"/>

                    {/* Storage */}
                    <select value={item.storage} onChange={e => {
                    const val = e.target.value;
                    setReviewItems(prev => prev.map((it, i) => i === idx ? { ...it, storage: val } : it));
                }} className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-300 bg-white"><option value="" disabled>선택하세요</option>
                      <option value="fridge">냉장</option>
                      <option value="freezer">냉동</option>
                      <option value="pantry">실온/팬트리</option>
                    </select>

                    {/* Expiration Date */}
                    <input type="date" value={item.expirationDate} onChange={e => {
                    const val = e.target.value;
                    setReviewItems(prev => prev.map((it, i) => i === idx ? { ...it, expirationDate: val } : it));
                }} className="flex-1 font-semibold text-xs text-gray-900 px-2 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500" title="유통기한"/>

                    <button type="button" onClick={() => setReviewItems(prev => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-rose-600 p-1" title="항목 제거">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>))}

              <button type="button" onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 7);
                setReviewItems(prev => [
                    ...prev,
                    {
                        id: `manual_${Date.now()}`,
                        name: '',
                        quantity: 1,
                        unit: '개',
                        storage: 'fridge',
                        expirationDate: d.toISOString().slice(0, 10),
                        memo: '직접 추가',
                        isSelected: true
                    }
                ]);
            }} className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 hover:border-emerald-500 text-gray-600 hover:text-emerald-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                <Plus className="w-3.5 h-3.5"/>
                <span>+ 누락된 재료 직접 추가하기</span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button type="button" onClick={() => setShowReviewModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50">
                취소
              </button>
              <button type="button" disabled={isSubmittingBatch || reviewItems.filter(i => i.isSelected).length === 0} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                <Check className="w-4 h-4"/>
                <span>선택한 식재료 최종 등록하기 ({reviewItems.filter(i => i.isSelected).length}개)</span>
              </button>
            </div>
          </div>
        </div>)}

      {/* Modal 2: Cooking Completion Confirmation Modal (사용한 재료 냉장고 차감) */}
      {cookingModalRecipe && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 md:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-600"/>
                <span>요리 완료 및 냉장고 재료 차감</span>
              </h4>
              <button type="button" onClick={() => setCookingModalRecipe(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div>
              <h5 className="font-extrabold text-base text-emerald-800">
                {cookingModalRecipe.recipe.title}
              </h5>
              <p className="text-xs text-gray-500 mt-0.5">
                요리를 완료하셨습니까? 아래의 레시피 소요 재료가 냉장고 재고에서 자동으로 차감됩니다.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
              <span className="font-bold text-gray-700 block">차감 대상 식재료 목록:</span>
              <div className="space-y-1">
                {cookingModalRecipe.recipe.ingredients.map((ing, i) => (<div key={i} className="flex items-center justify-between text-gray-700 py-0.5">
                    <span className="font-medium">• {ing.name}</span>
                    <span className="font-bold text-gray-900">{ing.quantity} {ing.unit}</span>
                  </div>))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setCookingModalRecipe(null)} className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50">
                닫기
              </button>
              <button type="button" disabled={isCookingSubmitting} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                <Check className="w-4 h-4"/>
                <span>{isCookingSubmitting ? '재고 차감 처리 중...' : '요리 완료 확인 (차감 실행)'}</span>
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}

import React, { useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Clock, Flame, RefreshCw, Sparkles, Utensils } from 'lucide-react';
import { FridgeTailoredDietTab } from '@/components/FridgeTailoredDietTab';
export function RecommendPage({ diet = {} } = {}) {
    // Tab State: 'fridge' (new 냉장고 맞춤 식단) | 'daily' (existing 일일 AI 식단)
    const [activeTab, setActiveTab] = useState('fridge');
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const [targetDate, setTargetDate] = useState(tomorrowStr);
    const isGenerating = false;
    const isConfirming = false;
    const draftRecommendations = null;
    const draftPlans = [];
    return (<>
      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
        <button type="button" onClick={() => setActiveTab('fridge')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${activeTab === 'fridge'
            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
          <Sparkles className="w-4 h-4"/>
          <span>냉장고 맞춤 식단 (15분 초간단 요리)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 font-bold">NEW</span>
        </button>

        <button type="button" className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${activeTab === 'daily'
            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`} onClick={() => setActiveTab("daily")}>
          <Utensils className="w-4 h-4"/>
          <span>일일 AI 식단 (아침·점심·저녁)</span>
        </button>
      </div>

      {/* Tab 1: 냉장고 맞춤 식단 (15분 초간단 요리) */}
      {activeTab === 'fridge' && (<FridgeTailoredDietTab />)}

      {/* Tab 2: 기존 일일 AI 식단 (아침·점심·저녁) 유지 */}
      {activeTab === 'daily' && (<>
          {/* Target Date Bar */}
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">추천 대상 날짜</label>
                <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="text-base font-bold text-gray-900 border-none bg-transparent p-0 focus:outline-none"/>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button type="button" disabled={isGenerating} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all shadow-2xs min-h-[44px] cursor-pointer disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-emerald-600' : ''}`}/>
                <span>{isGenerating ? 'AI 분석 중...' : '새로 추천받기'}</span>
              </button>

              <button type="button" disabled={isConfirming || draftPlans.length === 0} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all min-h-[44px] cursor-pointer disabled:opacity-50">
                <CheckCircle2 className="w-4 h-4"/>
                <span>이 식단 전체 확정하기 (장바구니 반영)</span>
              </button>
            </div>
          </div>

          {/* Allergies / Exclusions Info banner */}
          <div className="p-3.5 rounded-xl bg-gray-100 border border-gray-200 text-xs text-gray-700 mb-6 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"/>
            <div className="leading-relaxed">
              <span className="font-bold text-gray-900">식단 추천 원칙 준수 중: </span>
              <span>
                알레르기·제외 식재료(
                {diet?.allergies?.length ? diet.allergies.join(', ') : '없음'}
                ) 철저 배제, 가용 시간({diet?.cookTimeMinutes || 20}분 이내), 냉장고 재료 우선 활용.
              </span>
            </div>
          </div>

          {/* Meals Grid: Breakfast, Lunch, Dinner */}
      {isGenerating ? (<div className="py-20 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin mx-auto mb-3"></div>
          <p className="font-bold text-gray-800 text-sm">냉장고 기한 임박 재료와 영양 밸런스를 계산하고 있습니다...</p>
          <p className="text-xs text-gray-500 mt-1">Gemini 3.8 Flash 엔진이 한식 친숙 요리를 맞춤 생성 중입니다.</p>
        </div>) : !draftRecommendations ? (<div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Utensils className="w-10 h-10 text-gray-400 mx-auto mb-2"/>
          <p className="text-sm font-semibold text-gray-700">추천된 식단이 없습니다.</p>
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['breakfast', 'lunch', 'dinner'].map(mealType => {
                    const recipe = draftRecommendations[mealType];
                    if (!recipe)
                        return null;
                    const mealTitle = {
                        breakfast: '🌅 아침 식단',
                        lunch: '☀️ 점심 식단',
                        dinner: '🌙 저녁 식단'
                    }[mealType];
                    return (<div key={mealType} className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-emerald-300 transition-all">
                <div>
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-800">{mealTitle}</span>
                    <button type="button" title="이 끼니만 다시 추천" className="text-gray-400 hover:text-emerald-600 text-xs flex items-center gap-1 cursor-pointer" disabled>
                      <RefreshCw className="w-3 h-3"/>
                      <span>다시 추천</span>
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="font-extrabold text-lg text-gray-900 leading-snug">
                        {recipe.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {recipe.description}
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-3 text-xs bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 text-emerald-900 font-medium">
                      <span className="flex items-center gap-1 font-bold">
                        <Clock className="w-3.5 h-3.5 text-emerald-600"/>
                        {recipe.cookTimeMinutes}분
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500"/>
                        {recipe.nutrition.calories} kcal
                      </span>
                      <span>단백질 {recipe.nutrition.protein}g</span>
                    </div>

                    {/* Recommendation Reason */}
                    {recipe.recommendationReason && (<div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900">
                        <p className="font-semibold text-[11px] text-amber-800 mb-0.5">💡 추천 사유:</p>
                        <p className="text-[11px] leading-tight">{recipe.recommendationReason}</p>
                      </div>)}

                    {/* Ingredients Checklist */}
                    <div>
                      <h5 className="text-xs font-bold text-gray-700 mb-2">필요 재료 ({recipe.servings}인분 기준):</h5>
                      <div className="space-y-1.5">
                        {recipe.ingredients.map((ing, idx) => (<div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50 border border-gray-100">
                            <span className="font-medium text-gray-800">{ing.name}</span>
                            <span className="font-semibold text-gray-600">{ing.quantity} {ing.unit}</span>
                          </div>))}
                      </div>
                    </div>

                    {/* Recipe Steps preview */}
                    <div>
                      <h5 className="text-xs font-bold text-gray-700 mb-1.5">조리 순서:</h5>
                      <ol className="space-y-1 text-xs text-gray-600 list-decimal pl-4">
                        {recipe.steps.map((st, i) => (<li key={i} className="leading-relaxed">{st}</li>))}
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Nutrition Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-500 flex items-center justify-between">
                  <span>탄: {recipe.nutrition.carbs}g | 지: {recipe.nutrition.fat}g</span>
                  <span className="truncate max-w-[140px]" title={recipe.nutrition.source}>
                    {recipe.nutrition.source}
                  </span>
                </div>
              </div>);
                })}
        </div>)}
    </>)}
    </>);
}

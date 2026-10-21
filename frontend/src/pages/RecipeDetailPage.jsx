import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Flame, Info, RotateCcw, Utensils } from 'lucide-react';
import { MealStatusBadge } from '@/components/common/StatusBadge';
export function RecipeDetailPage() {
    const navigate = useNavigate();
    const recipe = null;
    const associatedPlan = null;
    const isLoading = false;
    // Cooking Modal State
    const [showCookingModal, setShowCookingModal] = useState(false);
    const actualServings = "";
    const deductionPreview = null;
    const isSubmitting = false;
    if (isLoading) {
        return (<>
        <div className="py-20 text-center text-gray-500">레시피를 불러오는 중입니다...</div>
      </>);
    }
    if (!recipe) {
        return (<>
        <div className="py-20 text-center">
          <p className="text-gray-600 mb-4">해당 레시피 정보를 찾을 수 없습니다.</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold cursor-pointer">
            뒤로 가기
          </button>
        </div>
      </>);
    }
    return (<>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-4 cursor-pointer">
        <ArrowLeft className="w-4 h-4"/> 이전 화면으로 돌아가기
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden mb-8">
        {/* Hero Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/30">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
                {recipe.tags?.[0] || '균형 식단'}
              </span>
              {associatedPlan && (<MealStatusBadge status={associatedPlan.status} intakeStatus={associatedPlan.intakeStatus}/>)}
            </div>

            {/* Action Buttons */}
            {associatedPlan && (<div className="flex items-center gap-2">
                {associatedPlan.status === 'confirmed' && (<button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs min-h-[44px] cursor-pointer" disabled>
                    <CheckCircle2 className="w-4 h-4"/>
                    <span>요리 완료 및 재고 차감</span>
                  </button>)}

                {associatedPlan.status === 'cooking_done' && associatedPlan.cookingEventId && (<button className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold shadow-2xs min-h-[44px] cursor-pointer" disabled>
                    <RotateCcw className="w-4 h-4"/>
                    <span>요리 취소 (재고 복원)</span>
                  </button>)}
              </div>)}
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            {recipe.title}
          </h1>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-3xl">
            {recipe.description}
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-gray-700">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 font-semibold">
              <Clock className="w-4 h-4 text-emerald-600"/>
              조리 시간 {recipe.cookTimeMinutes}분
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 font-semibold">
              <Flame className="w-4 h-4 text-amber-500"/>
              {recipe.nutrition.calories} kcal
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 font-medium">
              단백질 {recipe.nutrition.protein}g | 탄수화물 {recipe.nutrition.carbs}g | 지방 {recipe.nutrition.fat}g
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Ingredients list */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-600"/>
              필요 재료 ({actualServings}인분 기준)
            </h3>

            <div className="space-y-2">
              {recipe.ingredients.map((ing, idx) => {
            const scaledQty = Number(((ing.quantity / (recipe.servings || 1)) * actualServings).toFixed(2));
            return (<div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{ing.name}</span>
                    <span className="font-bold text-gray-600">{scaledQty} {ing.unit}</span>
                  </div>);
        })}
            </div>

            {recipe.recommendationReason && (<div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <p className="font-bold mb-1">💡 추천 이유:</p>
                <p className="leading-relaxed">{recipe.recommendationReason}</p>
              </div>)}
          </div>

          {/* Cooking Steps */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-bold text-base text-gray-900">
              단계별 조리 순서
            </h3>

            <div className="space-y-4">
              {recipe.steps.map((step, idx) => (<div key={idx} className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-gray-200 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed pt-0.5">
                    {step}
                  </p>
                </div>))}
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-500 mt-6 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400 shrink-0"/>
              <span>영양성분 출처: {recipe.nutrition.source}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cooking Modal */}
      {showCookingModal && deductionPreview && (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              🍳 요리 완료 및 재고 차감 확인
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              조리 후 냉장고의 가용 재고 묶음 중 기한이 빠른 순서대로 자동 차감됩니다.
            </p>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4">
              <span className="text-sm font-semibold text-gray-700">실제 조리 인분:</span>
              <div className="flex items-center gap-2">
                <button type="button" className="w-8 h-8 rounded-lg bg-white border border-gray-300 font-bold text-gray-700 flex items-center justify-center cursor-pointer" disabled>
                  -
                </button>
                <span className="font-bold text-base px-2">{actualServings}인분</span>
                <button type="button" className="w-8 h-8 rounded-lg bg-white border border-gray-300 font-bold text-gray-700 flex items-center justify-center cursor-pointer" disabled>
                  +
                </button>
              </div>
            </div>

            {/* Deductions Preview */}
            <div className="space-y-2.5 mb-6 text-xs">
              <h4 className="font-bold text-gray-600">차감 예정 재고 묶음:</h4>
              {deductionPreview.deductions.map((d, idx) => (<div key={idx} className="p-3 rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-center justify-between font-bold text-gray-800">
                    <span>{d.ingredientName}</span>
                    <span>필요량: {d.requiredQty}{d.unit}</span>
                  </div>

                  {d.lotAllocations.length === 0 ? (<p className="text-rose-600 font-semibold mt-1">
                      ⚠️ 냉장고에 등록된 가용 재고가 없습니다. (부족: {d.deficit}{d.unit})
                    </p>) : (<div className="space-y-1 mt-1.5 pt-1.5 border-t border-gray-100 text-gray-600">
                      {d.lotAllocations.map((alloc, aIdx) => (<div key={aIdx} className="flex items-center justify-between">
                          <span>• 묶음 기한 {alloc.lotExpiration || '미등록'}</span>
                          <span className="font-bold text-emerald-700">-{alloc.deductQty}{alloc.unit} 차감</span>
                        </div>))}
                    </div>)}
                </div>))}
            </div>

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShowCookingModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold min-h-[44px] cursor-pointer">
                취소
              </button>
              <button type="button" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[44px] cursor-pointer disabled:opacity-50">
                {isSubmitting ? '차감 중...' : '사용량 확정 및 차감'}
              </button>
            </div>
          </div>
        </div>)}
    </>);
}

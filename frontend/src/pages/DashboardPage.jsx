import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ChevronRight, Clock, Dumbbell, Flame, Refrigerator, Scale, ShoppingCart, Sparkles, Utensils } from 'lucide-react';
import { ExpirationBadge, MealStatusBadge } from '@/components/common/StatusBadge';
import { TodayAiCoachingCard } from '@/components/TodayAiCoachingCard';
import { TrainerOnboardingModal } from '@/components/TrainerOnboardingModal';
import { getExpirationStatus } from '@/lib/expiration';
export function DashboardPage({ user = {}, profile = {}, diet = {} } = {}) {
    const todayPlans = [];
    const expiringLots = [];
    const shoppingItems = [];
    const workoutPlan = null;
    const workoutLog = null;
    // Trainer Profile Onboarding State
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [, setTrainerProfile] = useState(null);
    // Cooking modal state
    const [selectedPlanForCooking, setSelectedPlanForCooking] = useState(null);
    const cookingServings = "";
    const cookingDeductionPreview = null;
    const isCookingSubmitting = false;
    const todayStr = new Date().toISOString().slice(0, 10);
    // Find today's workout day in routine
    const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
    const todayWorkoutDay = workoutPlan?.weeklyRoutine?.[currentDayIndex] || workoutPlan?.weeklyRoutine?.[0];
    return (<>
      {/* 1. 오늘의 AI 코칭 카드 (홈 화면 맨 위) */}
      <TodayAiCoachingCard />

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden mb-6">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300"/>
            맞춤 웰니스 파트너
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            안녕하세요, {profile?.nickname || user?.name || '회원'}님!
          </h2>
          <p className="text-emerald-100 text-sm md:text-base leading-relaxed mb-5">
            {diet?.goal === 'loss' ? '체중 감량과 건강한 식습관' : '균형 잡힌 영양과 지속 가능한 건강'}을 위해 오늘도 밀핏이 함께합니다.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/recommend" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm shadow-sm hover:bg-emerald-50 transition-all cursor-pointer min-h-[44px]">
              <Sparkles className="w-4 h-4 text-emerald-600"/>
              내일 식단 AI 추천받기
            </Link>
            <Link to="/fridge" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-800/80 text-white font-medium text-sm transition-all border border-emerald-500/30 min-h-[44px]">
              <Refrigerator className="w-4 h-4"/>
              냉장고 재료 등록
            </Link>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Meals & Workout (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Meals Section */}
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Utensils className="w-4 h-4"/>
                </div>
                <h3 className="font-bold text-base md:text-lg text-gray-900">오늘의 식단</h3>
              </div>
              <Link to="/calendar" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
                주간 식단표 <ChevronRight className="w-3.5 h-3.5"/>
              </Link>
            </div>

            {todayPlans.length === 0 ? (<div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Utensils className="w-10 h-10 text-gray-400 mx-auto mb-2.5"/>
                <p className="text-sm font-semibold text-gray-700 mb-1">오늘 등록된 식단이 없습니다.</p>
                <p className="text-xs text-gray-500 mb-4">냉장고 재료를 활용한 최적의 식단을 AI로 추천받아보세요.</p>
                <Link to="/recommend" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs">
                  <Sparkles className="w-3.5 h-3.5"/> 식단 추천받기
                </Link>
              </div>) : (<div className="space-y-3.5">
                {todayPlans.map(plan => {
                const mealLabel = {
                    breakfast: '아침',
                    lunch: '점심',
                    dinner: '저녁',
                    snack: '간식'
                }[plan.mealType] || '식사';
                return (<div key={plan.id} className="p-4 rounded-xl border border-gray-200 bg-white hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                            {mealLabel}
                          </span>
                          <MealStatusBadge status={plan.status} intakeStatus={plan.intakeStatus}/>
                        </div>
                        <Link to={`/recipes/${plan.recipeId}`} className="font-bold text-sm md:text-base text-gray-900 hover:text-emerald-600 truncate block">
                          {plan.recipeSnapshot.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400"/>
                            {plan.recipeSnapshot.cookTimeMinutes}분
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-500"/>
                            {plan.recipeSnapshot.nutrition.calories} kcal
                          </span>
                          <span>단백질 {plan.recipeSnapshot.nutrition.protein}g</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        {plan.status === 'confirmed' && (<button className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs min-h-[44px] cursor-pointer" disabled>
                            요리 완료
                          </button>)}
                        <button className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all min-h-[44px] cursor-pointer flex items-center gap-1 ${plan.intakeStatus === 'consumed'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`} disabled>
                          <CheckCircle2 className={`w-3.5 h-3.5 ${plan.intakeStatus === 'consumed' ? 'text-emerald-600' : 'text-gray-400'}`}/>
                          {plan.intakeStatus === 'consumed' ? '섭취완료' : '먹음 체크'}
                        </button>
                      </div>
                    </div>);
            })}
              </div>)}
          </div>

          {/* Today's Workout Section */}
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4"/>
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg text-gray-900">오늘의 맞춤 운동</h3>
                  <p className="text-xs text-gray-500">
                    {todayWorkoutDay ? todayWorkoutDay.focusArea : '주간 루틴 생성 필요'}
                  </p>
                </div>
              </div>
              <Link to="/workout" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
                전체 루틴 보기 <ChevronRight className="w-3.5 h-3.5"/>
              </Link>
            </div>

            {!todayWorkoutDay ? (<div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Dumbbell className="w-8 h-8 text-gray-400 mx-auto mb-2"/>
                <p className="text-xs font-medium text-gray-600 mb-3">체력과 장비에 맞춘 주간 루틴을 생성하세요.</p>
                <Link to="/workout" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700">
                  루틴 생성하기
                </Link>
              </div>) : (<div className="p-4 rounded-xl border border-gray-200 bg-teal-50/40">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                      {todayWorkoutDay.dayName} {todayWorkoutDay.isRestDay ? '휴식일' : '운동일'}
                    </span>
                    <h4 className="font-bold text-sm md:text-base text-gray-900 mt-1">
                      {todayWorkoutDay.title}
                    </h4>
                  </div>
                  <button className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] cursor-pointer shadow-xs ${workoutLog?.completed
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-emerald-500'}`} disabled>
                    <CheckCircle2 className="w-4 h-4"/>
                    {workoutLog?.completed ? '운동 완료됨!' : '운동 완료 체크'}
                  </button>
                </div>

                {!todayWorkoutDay.isRestDay && (<div className="space-y-1.5 text-xs text-gray-700">
                    <p className="font-semibold text-gray-800 mb-1">주요 동작 (총 {todayWorkoutDay.durationMinutes}분):</p>
                    {todayWorkoutDay.mainExercises.slice(0, 3).map((ex, i) => (<div key={i} className="flex items-center justify-between py-1 border-b border-gray-200/60 last:border-none">
                        <span>• {ex.name}</span>
                        <span className="font-medium text-gray-500">{ex.sets}세트 × {ex.reps}</span>
                      </div>))}
                  </div>)}
              </div>)}
          </div>
        </div>

        {/* Right Column: Refrigerator Alerts & Shopping & Weight (1 Col) */}
        <div className="space-y-6">
          {/* Smart Refrigerator Alerts */}
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4"/>
                </div>
                <h3 className="font-bold text-sm md:text-base text-gray-900">기한 임박 식재료</h3>
              </div>
              <Link to="/fridge" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center">
                냉장고 <ChevronRight className="w-3.5 h-3.5"/>
              </Link>
            </div>

            {expiringLots.length === 0 ? (<p className="text-xs text-gray-500 py-4 text-center bg-gray-50 rounded-xl">
                기한 임박한 식재료가 없습니다. 안심하세요! 👍
              </p>) : (<div className="space-y-2">
                {expiringLots.slice(0, 4).map(lot => {
                const status = getExpirationStatus(lot.expirationDate, 3, todayStr);
                return (<div key={lot.id} className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-800">{lot.ingredientName}</p>
                        <p className="text-gray-500">{lot.quantity}{lot.unit} ({lot.storage === 'fridge' ? '냉장' : lot.storage === 'freezer' ? '냉동' : '실온'})</p>
                      </div>
                      <ExpirationBadge status={status} date={lot.expirationDate}/>
                    </div>);
            })}
              </div>)}
          </div>

          {/* Auto Shopping Summary */}
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4"/>
                </div>
                <h3 className="font-bold text-sm md:text-base text-gray-900">장바구니 부족분</h3>
              </div>
              <Link to="/shopping" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center">
                목록 보기 <ChevronRight className="w-3.5 h-3.5"/>
              </Link>
            </div>

            {shoppingItems.length === 0 ? (<p className="text-xs text-gray-500 py-4 text-center bg-gray-50 rounded-xl">
                필요한 추가 장보기 항목이 없습니다.
              </p>) : (<div className="space-y-2">
                {shoppingItems.slice(0, 4).map(item => (<div key={item.id} className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-800">{item.ingredientName}</p>
                      <p className="text-[11px] text-gray-500">
                        부족: <span className="font-bold text-rose-600">{item.autoDeficitQuantity + item.manualQuantity}{item.unit}</span>
                      </p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                      구매 필요
                    </span>
                  </div>))}
              </div>)}
          </div>

          {/* Weight Glance */}
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Scale className="w-4 h-4"/>
                </div>
                <h3 className="font-bold text-sm md:text-base text-gray-900">체중 추이</h3>
              </div>
              <Link to="/weight" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center">
                기록하기 <ChevronRight className="w-3.5 h-3.5"/>
              </Link>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-2xl font-black text-gray-900 tracking-tight">
                  {profile?.currentWeight || '--'}
                </span>
                <span className="text-xs text-gray-500 ml-1">kg</span>
              </div>
              <div className="text-right text-xs">
                <span className="text-gray-500">목표: </span>
                <span className="font-bold text-emerald-700">{profile?.targetWeight || '--'} kg</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 p-2 rounded-lg">
              체중은 수분과 근육량에 따라 일일 1~2kg 변동할 수 있습니다. 단기 증감에 일희일비하지 마세요.
            </p>
          </div>
        </div>
      </div>

      {/* Cooking Completion & Stock Deduction Modal */}
      {selectedPlanForCooking && cookingDeductionPreview && (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                🍳 요리 완료 & 재고 차감 확인
              </h3>
              <button onClick={() => setSelectedPlanForCooking(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                ✕
              </button>
            </div>

            <div className="mb-4 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
              <p className="font-bold text-emerald-900 text-sm">{selectedPlanForCooking.recipeSnapshot.title}</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                실제 조리한 인분에 맞춰 냉장고의 해당 재고 묶음에서 수량이 자동 차감됩니다.
              </p>
            </div>

            {/* Servings Adjuster */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4">
              <span className="text-sm font-semibold text-gray-700">실제 조리 인분:</span>
              <div className="flex items-center gap-2">
                <button type="button" className="w-8 h-8 rounded-lg bg-white border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer" disabled>
                  -
                </button>
                <span className="font-bold text-base px-2">{cookingServings}인분</span>
                <button type="button" className="w-8 h-8 rounded-lg bg-white border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer" disabled>
                  +
                </button>
              </div>
            </div>

            {/* Deduction Breakdown */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">차감 예정 재고 묶음:</h4>
              {cookingDeductionPreview.deductions.map((d, idx) => (<div key={idx} className="p-3 rounded-xl border border-gray-200 text-xs bg-white">
                  <div className="flex items-center justify-between font-bold text-gray-800 mb-1">
                    <span>{d.ingredientName}</span>
                    <span>필요: {d.requiredQty}{d.unit}</span>
                  </div>

                  {d.lotAllocations.length === 0 ? (<p className="text-rose-600 font-semibold mt-1">
                      ⚠️ 냉장고에 등록된 가용 재고가 없습니다. (부족: {d.deficit}{d.unit})
                    </p>) : (<div className="space-y-1 mt-1.5 pt-1.5 border-t border-gray-100">
                      {d.lotAllocations.map((alloc, aIdx) => (<div key={aIdx} className="flex items-center justify-between text-gray-600">
                          <span>
                            • 묶음 기한 {alloc.lotExpiration || '미등록'} (현재 {alloc.currentStock}{alloc.unit})
                          </span>
                          <span className="font-bold text-emerald-700">-{alloc.deductQty}{alloc.unit} 차감</span>
                        </div>))}
                    </div>)}
                </div>))}
            </div>

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSelectedPlanForCooking(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 min-h-[44px] cursor-pointer">
                취소
              </button>
              <button type="button" disabled={isCookingSubmitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm min-h-[44px] cursor-pointer disabled:opacity-50">
                {isCookingSubmitting ? '차감 처리 중...' : '사용량 확정 및 차감'}
              </button>
            </div>
          </div>
        </div>)}

      {/* First-Launch Trainer Profile Onboarding Modal */}
      <TrainerOnboardingModal isOpen={showOnboarding} onComplete={(newProfile) => {
            setTrainerProfile(newProfile);
            setShowOnboarding(false);
        }} initialProfile={profile ? {
            age: profile.age,
            height: profile.height,
            weight: profile.currentWeight,
            workoutGoal: 'loss',
            workoutLevel: 'beginner'
        } : undefined}/>
    </>);
}

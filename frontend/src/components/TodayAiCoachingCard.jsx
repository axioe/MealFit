import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BatteryCharging, CheckCircle2, ChevronDown, ChevronRight, Clock, Dumbbell, Heart, Moon, Refrigerator, RefreshCw, ShieldAlert, Sparkles, X, Zap } from 'lucide-react';
import { SORE_MUSCLE_OPTIONS } from "@/lib/profileOptions";
export function TodayAiCoachingCard() {
    const condition = null;
    const coachingData = null;
    const [showExercisesDetail, setShowExercisesDetail] = useState(false);
    const isAiLoading = false;
    // 30s Condition Check Modal State
    const [showCheckModal, setShowCheckModal] = useState(false);
    const [sleepHours, setSleepHours] = useState('');
    const [sleepQuality, setSleepQuality] = useState('');
    const [fatigueLevel, setFatigueLevel] = useState('');
    const [soreMuscles, setSoreMuscles] = useState([]);
    const [availableMinutes, setAvailableMinutes] = useState('');
    const [conditionNotes, setConditionNotes] = useState('');
    const handleOpenModal = () => {
        if (condition) {
            setSleepHours(condition.sleepHours);
            setSleepQuality(condition.sleepQuality);
            setFatigueLevel(condition.fatigueLevel);
            setSoreMuscles(condition.soreMuscles && condition.soreMuscles.length > 0 ? condition.soreMuscles : ['없음']);
            setAvailableMinutes(condition.availableMinutes);
            setConditionNotes(condition.notes || '');
        }
        else {
            setSleepHours('');
            setSleepQuality('');
            setFatigueLevel('');
            setSoreMuscles([]);
            setAvailableMinutes('');
            setConditionNotes('');
        }
        setShowCheckModal(true);
    };
    const handleToggleSoreMuscle = (muscle) => {
        if (muscle === '없음') {
            setSoreMuscles(['없음']);
            return;
        }
        setSoreMuscles(prev => {
            const withoutNone = prev.filter(m => m !== '없음');
            if (withoutNone.includes(muscle)) {
                const remaining = withoutNone.filter(m => m !== muscle);
                return remaining.length > 0 ? remaining : ['없음'];
            }
            else {
                return [...withoutNone, muscle];
            }
        });
    };
    const hasData = coachingData?.hasConditionData;
    const isBadCondition = coachingData?.isBadCondition || coachingData?.recommendedWorkout?.isRecoveryMode;
    return (<div className="mb-6">
      {/* Main AI Trainer Card Container */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-lg border border-emerald-900/40 relative overflow-hidden">
        {/* Subtle decorative glowing mesh */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"/>

        {/* Header Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-slate-950"/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-extrabold tracking-tight">
                  오늘의 AI 코칭
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  AI Trainer
                </span>
                {isAiLoading && (<span className="flex items-center gap-1 text-[11px] text-teal-300 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin"/> AI 분석 중
                  </span>)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                오늘 무엇을 할지 실시간 컨디션과 냉장고 재고로 결정해 드립니다
              </p>
            </div>
          </div>

          {/* Action / State Controls */}
          <div className="flex items-center gap-2">
            {null}
            {hasData && (<button onClick={handleOpenModal} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white transition-all cursor-pointer flex items-center gap-1 border border-emerald-500/30">
                <span>컨디션 재측정</span>
              </button>)}
          </div>
        </div>

        {/* Bad Condition Alert & Active Recovery Mode Banner (Requirement #4) */}
        {hasData && isBadCondition && (<div className="relative z-10 mb-5 p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-200 flex items-start gap-3 backdrop-blur-sm">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"/>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-amber-300">
                  🚨 액티브 리커버리 모드 적용 (부상 방지)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-bold border border-amber-400/30">
                  저강도 이완 추천
                </span>
              </div>
              <p className="text-xs text-amber-100 leading-relaxed">
                컨디션 체크 결과 수면 부족, 높은 피로도 또는 근육통 부위가 감지되었습니다.
                고강도 근력 트레이닝을 일시 중단하고, <strong>가벼운 걷기·관절 가동성·스트레칭 위주의 회복 루틴</strong>으로 안전하게 조정되었습니다.
              </p>
            </div>
          </div>)}

        {/* State 1: No Condition Check Yet */}
        {!hasData ? (<div className="relative z-10 py-6 md:py-8 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 mb-4 border border-white/10 shadow-inner">
              <Sparkles className="w-7 h-7"/>
            </div>

            <h3 className="text-lg md:text-xl font-bold mb-2 text-white">
              오늘의 운동과 식단, AI가 정해드립니다
            </h3>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-6">
              수면 시간, 피로도, 근육통, 오늘 가용 시간만 30초 체크해주세요.<br className="hidden sm:inline"/>
              오늘 최적의 <span className="text-emerald-400 font-semibold">추천 운동 루틴</span>과 <span className="text-teal-300 font-semibold">냉장고 맞춤 식단</span>을 바로 완성합니다.
            </p>

            <button onClick={handleOpenModal} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm md:text-base shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer min-h-[48px]">
              <Zap className="w-5 h-5 fill-slate-950"/>
              <span>30초 컨디션 체크 시작하기</span>
              <ArrowRight className="w-4 h-4"/>
            </button>

            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400"/> 수면 & 피로도 맞춤
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400"/> WHO 150분 기준
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400"/> 냉장고 파먹기 연동
              </span>
            </div>
          </div>) : (
        /* State 2: Today's AI Coaching Dashboard Content */
        <div className="relative z-10 space-y-5">
            {/* 1. 오늘의 상태 요약 */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5"/> 오늘의 상태 요약
                </span>
                <span className="text-[11px] text-slate-400">
                  {condition?.date} 컨디션 측정 완료
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Sleep Summary */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                    <Moon className="w-4 h-4"/>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-medium">수면</span>
                    <span className="text-xs md:text-sm font-bold text-white block truncate">
                      {coachingData.conditionSummary?.sleepText || '--'}
                    </span>
                  </div>
                </div>

                {/* Fatigue Summary */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                    <BatteryCharging className="w-4 h-4"/>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-medium">피로도</span>
                    <span className="text-xs md:text-sm font-bold text-white block truncate">
                      {coachingData.conditionSummary?.fatigueText || '--'}
                    </span>
                  </div>
                </div>

                {/* Sore Muscles */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4"/>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-medium">근육통</span>
                    <span className="text-xs md:text-sm font-bold text-white block truncate">
                      {coachingData.conditionSummary?.soreMusclesText || '없음'}
                    </span>
                  </div>
                </div>

                {/* Available Minutes */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4"/>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-medium">가용 시간</span>
                    <span className="text-xs md:text-sm font-bold text-white block truncate">
                      {coachingData.conditionSummary?.availableTimeText || '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2 & 3: Two Columns for Recommended Workout + Recommended Meal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 2. 오늘의 추천 운동 */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                        <Dumbbell className="w-4 h-4"/>
                      </div>
                      <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                        오늘의 추천 운동
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 font-bold border border-teal-500/30">
                      {coachingData.recommendedWorkout?.timeOrSets}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base md:text-lg font-bold text-white">
                      {coachingData.recommendedWorkout?.exerciseName}
                    </h3>
                    {coachingData.recommendedWorkout?.isRecoveryMode && (<span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                        회복 루틴
                      </span>)}
                  </div>

                  <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/40 text-xs text-teal-200 leading-relaxed mb-3">
                    <p className="font-semibold text-[11px] text-teal-300 mb-0.5">💡 추천 이유:</p>
                    <p>{coachingData.recommendedWorkout?.reason}</p>
                  </div>

                  {/* Overload / Progress Tag */}
                  {coachingData.recommendedWorkout?.overloadNote && (<div className="mb-3 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 shrink-0"/>
                      <span>{coachingData.recommendedWorkout.overloadNote}</span>
                    </div>)}

                  {/* Exercises Accordion / Preview */}
                  {coachingData.recommendedWorkout?.exercises && coachingData.recommendedWorkout.exercises.length > 0 && (<div className="mb-3">
                      <button type="button" onClick={() => setShowExercisesDetail(prev => !prev)} className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold transition-colors cursor-pointer py-1">
                        <span>오늘 세부 동작 ({coachingData.recommendedWorkout.exercises.length}개)</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExercisesDetail ? 'rotate-180' : ''}`}/>
                      </button>

                      {showExercisesDetail && (<div className="space-y-2 mt-2 pt-2 border-t border-white/10">
                          {coachingData.recommendedWorkout.exercises.map((ex, idx) => (<div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-white">
                                  {idx + 1}. {ex.name}
                                </span>
                                <span className="text-teal-300 font-semibold text-[11px]">
                                  {ex.sets}세트 × {ex.reps}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-normal">
                                {ex.tips}
                              </p>
                              {ex.alternative && (<p className="text-[10px] text-teal-400 mt-0.5">
                                  대체: {ex.alternative}
                                </p>)}
                            </div>))}
                        </div>)}
                    </div>)}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    집중 부위: {coachingData.recommendedWorkout?.focusArea || '전신 루틴'}
                  </span>
                  <Link to="/workout" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                    <span>전체 플래너 보기</span>
                    <ChevronRight className="w-3.5 h-3.5"/>
                  </Link>
                </div>
              </div>

              {/* 3. 냉장고 맞춤 추천 식단 1개 */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                        <Refrigerator className="w-4 h-4"/>
                      </div>
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                        냉장고 맞춤 추천 식단
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 font-bold border border-emerald-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3"/>
                      {coachingData.recommendedMeal?.cookTimeMinutes}분 완성
                    </span>
                  </div>

                  <h3 className="text-base md:text-lg font-bold text-white mb-2">
                    {coachingData.recommendedMeal?.title}
                  </h3>

                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200 leading-relaxed mb-3">
                    <p className="font-semibold text-[11px] text-emerald-300 mb-0.5">💡 영양 & 재고 소진 이유:</p>
                    <p>{coachingData.recommendedMeal?.reason}</p>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <span className="text-[11px] text-slate-400 block font-semibold">사용 재료:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {coachingData.recommendedMeal?.usedIngredients?.map((ing, i) => (<span key={i} className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 text-xs font-medium border border-white/10">
                          {ing}
                        </span>))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    단백질 {coachingData.recommendedMeal?.protein || '—'}g · 약 {coachingData.recommendedMeal?.calories || '—'}kcal
                  </span>
                  <Link to="/recommend" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                    <span>식단 전체보기</span>
                    <ChevronRight className="w-3.5 h-3.5"/>
                  </Link>
                </div>
              </div>
            </div>
          </div>)}
      </div>

      {/* 30-Second Condition Check Modal (Requirement #1) */}
      {showCheckModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-emerald-600"/>
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    30초 오늘의 컨디션 체크
                  </h3>
                  <p className="text-xs text-gray-500">
                    오늘의 몸 상태에 맞춰 최적의 플랜을 구성합니다
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setShowCheckModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={event => event.preventDefault()} className="space-y-4 text-xs">
              {/* 1. 수면 시간 */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-600"/>
                    수면 시간 & 수면의 질
                  </label>
                  <span className="font-bold text-indigo-700 text-sm">{sleepHours}시간</span>
                </div>

                <input type="range" min="3" max="12" step="0.5" value={sleepHours} onChange={e => setSleepHours(Number(e.target.value))} className="w-full accent-indigo-600 cursor-pointer"/>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                { id: 'good', label: '개운함 (숙면)' },
                { id: 'fair', label: '보통 (무난)' },
                { id: 'poor', label: '피곤함 (부족)' }
            ].map(item => (<button type="button" key={item.id} onClick={() => setSleepQuality(item.id)} className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${sleepQuality === item.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {item.label}
                    </button>))}
                </div>
              </div>

              {/* 2. 피로도 */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2.5">
                <label className="font-bold text-gray-800 flex items-center gap-1.5">
                  <BatteryCharging className="w-4 h-4 text-amber-600"/>
                  현재 느끼는 피로도 (낮음/보통/높음)
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                { id: 'low', label: '낮음 (에너지 충분)' },
                { id: 'normal', label: '보통 (적당함)' },
                { id: 'high', label: '높음 (지침/피로)' }
            ].map(item => (<button type="button" key={item.id} onClick={() => setFatigueLevel(item.id)} className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${fatigueLevel === item.id
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {item.label}
                    </button>))}
                </div>
              </div>

              {/* 3. 근육통 부위 (다중 선택) - Requirement #1 & #4 */}
              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-600"/>
                    근육통 부위 (다중 선택)
                  </label>
                  <span className="text-[11px] text-rose-700 font-semibold">
                    {soreMuscles.includes('없음') ? '없음' : `${soreMuscles.length}개 부위`}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  근육통이 있는 부위는 고강도 근력 대신 쉬운 대체 동작 또는 회복 루틴이 적용됩니다.
                </p>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {SORE_MUSCLE_OPTIONS.map(m => {
                const isSelected = soreMuscles.includes(m);
                return (<button type="button" key={m} onClick={() => handleToggleSoreMuscle(m)} className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center truncate ${isSelected
                        ? m === '없음'
                            ? 'bg-gray-700 text-white border-gray-700'
                            : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {m}
                      </button>);
            })}
                </div>
              </div>

              {/* 4. 오늘 운동 가능 시간 */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600"/>
                    오늘 운동 가능 시간 (10~90분)
                  </label>
                  <span className="font-bold text-emerald-800 text-sm">{availableMinutes}분</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map(mins => (<button type="button" key={mins} onClick={() => setAvailableMinutes(mins)} className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${availableMinutes === mins
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {mins}분
                    </button>))}
                </div>
              </div>

              {/* Optional Memo */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  오늘 몸 상태 메모 (선택)
                </label>
                <input type="text" placeholder="예: 어제 야근해서 어깨가 좀 뭉침, 가볍게 하고 싶음" value={conditionNotes} onChange={e => setConditionNotes(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-emerald-500"/>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={() => setShowCheckModal(false)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer min-h-[44px]">
                  취소
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 cursor-pointer min-h-[44px]" disabled>
                  오늘의 코칭 완료하기
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}

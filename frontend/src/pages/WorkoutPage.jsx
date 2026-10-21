import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, RefreshCw, Send, ShieldCheck, Sparkles } from 'lucide-react';
export function WorkoutPage({ profile = {}, fitness = {} } = {}) {
    const workoutPlan = null;
    const workoutLogs = [];
    const [selectedDayIdx, setSelectedDayIdx] = useState(0);
    const [naturalPrompt, setNaturalPrompt] = useState('');
    const isLoading = false;
    const isAdjusting = false;
    const currentDayOfWeekIdx = (new Date().getDay() + 6) % 7; // Monday = 0
    // BMI Calculation
    const bmi = '—';
    const activeRoutine = workoutPlan?.weeklyRoutine || [];
    const selectedDay = activeRoutine[selectedDayIdx];
    // Weekly progress
    const completedDaysCount = workoutLogs.filter(l => l.completed).length;
    const exerciseDaysCount = activeRoutine.filter(r => !r.isRestDay).length || 1;
    const progressPercent = Math.min(100, Math.round((completedDaysCount / exerciseDaysCount) * 100));
    return (<>
      {/* Step 1: Body Profile Analysis Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                1단계 신체 프로필 분석
              </span>
              <span className="text-xs text-gray-400 font-medium">참고 지표 (의학적 진단 아님)</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {profile?.nickname || '회원'}님의 체성분 & 가동성 분석
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-center">
              <span className="text-[10px] text-gray-500 font-medium block">계산된 BMI</span>
              <span className="text-base font-black text-gray-900">{bmi}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-center">
              <span className="text-[10px] text-gray-500 font-medium block">운동 구력</span>
              <span className="text-xs font-bold text-teal-700">
                {fitness?.experience || '—'}
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-center">
              <span className="text-[10px] text-gray-500 font-medium block">주간 목표</span>
              <span className="text-xs font-bold text-emerald-700">주 {fitness?.daysPerWeek || '—'}회</span>
            </div>
          </div>
        </div>

        {/* AI Analysis Summary */}
        <div className="pt-4 space-y-3">
          <p className="text-xs md:text-sm text-gray-700 leading-relaxed bg-teal-50/50 p-3.5 rounded-xl border border-teal-100">
            {workoutPlan?.analysisSummary || '등록된 운동 루틴이 없습니다.'}
          </p>

          {/* Uncomfortable Areas Caution */}
          {fitness?.uncomfortableAreas && fitness.uncomfortableAreas.length > 0 && (<div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"/>
              <div>
                <span className="font-bold">주의 필요 부위: {fitness.uncomfortableAreas.join(', ')}</span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  관절 압박이 큰 동작은 쉬운 대체 동작(Alternative)으로 안전하게 대체 제공됩니다.
                </p>
              </div>
            </div>)}
        </div>
      </div>

      {/* WHO Guidelines & Progressive Overload Standards Card (Requirement #2) */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                WHO 권고 기준 & 점진적 과부하 (Progressive Overload)
              </span>
              <span className="text-xs text-gray-400 font-medium">과학적 트레이닝 원칙</span>
            </div>
            <h4 className="text-base font-extrabold text-gray-900">
              WHO 가이드라인 준수 및 점진적 강도 증량 상태
            </h4>
          </div>

          <button type="button" disabled={isLoading} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[40px] shrink-0">
            <Sparkles className="w-3.5 h-3.5"/>
            <span>WHO 권고 주간 플랜 생성</span>
          </button>
        </div>

        {/* 3 WHO Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-900">1. 유산소 150분+</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600"/>
            </div>
            <span className="text-base font-black text-emerald-800 block">주 160분 배정</span>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              중강도 유산소로 심폐 지구력과 대사 질환 예방 기준 충족
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-teal-900">2. 주 2일 이상 근력</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600"/>
            </div>
            <span className="text-base font-black text-teal-800 block">주 3회 근력 세션</span>
            <p className="text-[11px] text-teal-700 mt-0.5">
              상체·하체·코어 주요 대근육군 타겟 근비대 및 근지구력 훈련
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-indigo-900">3. 48시간 회복 주기</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600"/>
            </div>
            <span className="text-base font-black text-indigo-800 block">동일 부위 분할</span>
            <p className="text-[11px] text-indigo-700 mt-0.5">
              월(상체)-수(하체)-금(상체) 교차로 근육 합성 골든타임 보장
            </p>
          </div>
        </div>

        {/* Progressive Overload Tracker */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">점진적 과부하 진행도</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                누적 {completedDaysCount}회 운동 완료
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {completedDaysCount >= 10
            ? '🔥 2단계 과부하 적용 중: 지난 기록 대비 세트당 +2회 반복 증량 및 추가 세트 반영'
            : completedDaysCount >= 4
                ? '⚡ 1단계 과부하 적용 중: 지난 기록 대비 세트당 +1회 반복 자동 증량 반영'
                : '🌱 기초 적응기: 표준 세트와 올바른 운동 궤적 및 자세 습득에 집중'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] text-gray-500 block">다음 레벨까지</span>
            <span className="text-xs font-bold text-emerald-700">
              {completedDaysCount >= 10 ? '최대 과부하 유지' : `${completedDaysCount >= 4 ? 10 - completedDaysCount : 4 - completedDaysCount}회 완료 필요`}
            </span>
          </div>
        </div>

        {/* Daily Coordination Note */}
        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"/>
          <p className="leading-relaxed">
            <strong>주간 계획 ↔ 매일 컨디션 연동 원칙:</strong> 먼저 WHO 권고 주간 계획을 수립하고, 매일 아침 홈의 <strong>30초 컨디션 체크</strong>(수면·피로도·근육통)에 맞춰 오늘 할 운동의 종목과 강도가 안전하게 자동 치환·조정됩니다.
          </p>
        </div>
      </div>

      {/* Natural Language Adjustment Bar */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 md:p-5 rounded-2xl border border-emerald-200 mb-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-600"/>
          <h4 className="text-xs md:text-sm font-bold text-gray-900">실시간 자연어 컨디션 조정</h4>
          <span className="text-[11px] text-gray-500">(안전 가이드라인 유지)</span>
        </div>

        <form onSubmit={event => event.preventDefault()} className="flex gap-2">
          <input type="text" placeholder="예: '오늘은 20분만 가볍게 하고 싶어요', '덤벨 없이 맨몸으로 바꿀래요', '허리가 뻐근해요'" value={naturalPrompt} onChange={e => setNaturalPrompt(e.target.value)} disabled={isAdjusting} className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-xs md:text-sm focus:outline-emerald-500 shadow-2xs"/>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[44px] disabled:opacity-50" disabled>
            <Send className="w-3.5 h-3.5"/>
            <span>{isAdjusting ? '반영 중...' : '조정'}</span>
          </button>
        </form>
      </div>

      {/* Step 2: Weekly Schedule Tabs & Day Workout Detail */}
      <div className="space-y-6">
        {/* Weekly Tabs */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-700">주간 진행률: {progressPercent}%</span>
            <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer" disabled>
              <RefreshCw className="w-3 h-3"/> 전체 루틴 새로고침
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {activeRoutine.map((day, idx) => {
            const isSelected = selectedDayIdx === idx;
            const isToday = currentDayOfWeekIdx === idx;
            return (<button key={idx} onClick={() => setSelectedDayIdx(idx)} className={`p-2.5 rounded-xl text-center transition-all cursor-pointer min-h-[56px] flex flex-col items-center justify-between ${isSelected
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : day.isRestDay
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}>
                  <span className="text-[11px] font-bold block">{day.dayName.slice(0, 1)}</span>
                  <span className="text-[10px] mt-0.5 truncate block">
                    {day.isRestDay ? '휴식' : `${day.durationMinutes}분`}
                  </span>
                  {isToday && (<span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1"></span>)}
                </button>);
        })}
          </div>
        </div>

        {/* Selected Day Workout Card */}
        {selectedDay && (<div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {selectedDay.dayName}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {selectedDay.isRestDay ? '휴식 및 가벼운 이완' : `${selectedDay.focusArea} (${selectedDay.durationMinutes}분)`}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-extrabold text-gray-900">
                  {selectedDay.title}
                </h3>
              </div>

              <button type="button" className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer min-h-[44px]" disabled>
                <CheckCircle2 className="w-4 h-4"/>
                <span>오늘 운동 완료 체크</span>
              </button>
            </div>

            <div className="p-5 md:p-6 space-y-6">
              {/* Warm up */}
              {selectedDay.warmUp && selectedDay.warmUp.length > 0 && (<div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    1. 워밍업 (준비 운동)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDay.warmUp.map((w, i) => (<div key={i} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700">
                        • {w}
                      </div>))}
                  </div>
                </div>)}

              {/* Main Exercises */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  2. 본 운동 (메인 루틴)
                </h4>
                <div className="space-y-3">
                  {selectedDay.mainExercises.map((ex, idx) => (<div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white hover:border-emerald-300 transition-all shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h5 className="font-bold text-sm md:text-base text-gray-900">{ex.name}</h5>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <span className="px-2.5 py-1 rounded-md bg-gray-100">
                            {ex.sets}세트 × {ex.reps}
                          </span>
                          <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-500">
                            휴식 {ex.restSec}초
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 pl-8 mb-2 leading-relaxed">
                        💡 <strong>자세 팁:</strong> {ex.tips}
                      </p>

                      {ex.alternative && (<div className="ml-8 p-2 rounded-lg bg-teal-50/70 border border-teal-100 text-[11px] text-teal-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0"/>
                          <span><strong>쉬운 대체 동작:</strong> {ex.alternative}</span>
                        </div>)}
                    </div>))}
                </div>
              </div>

              {/* Cool down */}
              {selectedDay.coolDown && selectedDay.coolDown.length > 0 && (<div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    3. 쿨다운 (정리 운동 & 스트레칭)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDay.coolDown.map((c, i) => (<div key={i} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700">
                        • {c}
                      </div>))}
                  </div>
                </div>)}
            </div>

            {/* Safety notes footer */}
            {workoutPlan?.safetyNotes && (<div className="p-4 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500 leading-relaxed">
                <strong>안전 주의사항:</strong> {workoutPlan.safetyNotes.join(' ')}
              </div>)}
          </div>)}
      </div>
    </>);
}

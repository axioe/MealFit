import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Dumbbell, Sparkles } from 'lucide-react';
import { MealStatusBadge } from '@/components/common/StatusBadge';
export function CalendarPage() {
    const plans = [];
    const workoutLogs = [];
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };
    // Month grid days calculation
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = [];
    // Previous month trailing days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const d = prevMonthDays - i;
        const dateStr = new Date(year, month - 1, d).toISOString().slice(0, 10);
        calendarDays.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        calendarDays.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }
    // Next month leading days to complete full weeks
    const remaining = (7 - (calendarDays.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
        const dateStr = new Date(year, month + 1, d).toISOString().slice(0, 10);
        calendarDays.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }
    // Selected date plans
    const dayPlans = plans.filter(p => p.date === selectedDate);
    const dayWorkoutLog = workoutLogs.find(l => l.date === selectedDate);
    const monthTitle = `${year}년 ${month + 1}월`;
    return (<>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calendar Grid (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-xs">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-extrabold text-lg text-gray-900 tracking-tight">
              {monthTitle}
            </h3>

            <div className="flex items-center gap-1.5">
              <button onClick={handlePrevMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer" title="이전 달">
                <ChevronLeft className="w-5 h-5"/>
              </button>
              <button onClick={() => {
            const now = new Date();
            setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
            setSelectedDate(now.toISOString().slice(0, 10));
        }} className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                오늘
              </button>
              <button onClick={handleNextMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer" title="다음 달">
                <ChevronRight className="w-5 h-5"/>
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 mb-2">
            <div className="text-rose-500">일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div className="text-blue-500">토</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((item, idx) => {
            const isSelected = item.dateStr === selectedDate;
            const isToday = item.dateStr === new Date().toISOString().slice(0, 10);
            const dayPlansCount = plans.filter(p => p.date === item.dateStr).length;
            const hasWorkout = workoutLogs.some(l => l.date === item.dateStr && l.completed);
            return (<button key={idx} onClick={() => setSelectedDate(item.dateStr)} className={`min-h-[72px] md:min-h-[84px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                    : isToday
                        ? 'border-emerald-300 bg-white'
                        : item.isCurrentMonth
                            ? 'border-gray-100 bg-white hover:border-gray-300'
                            : 'border-transparent bg-gray-50/50 text-gray-300'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-600 text-white' : item.isCurrentMonth ? 'text-gray-800' : 'text-gray-300'}`}>
                      {item.dayNum}
                    </span>
                    {hasWorkout && (<span className="w-2 h-2 rounded-full bg-teal-500" title="운동 완료"></span>)}
                  </div>

                  {/* Badges for meals */}
                  <div className="space-y-0.5 mt-1">
                    {dayPlansCount > 0 && (<div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 truncate">
                        식단 {dayPlansCount}건
                      </div>)}
                  </div>
                </button>);
        })}
          </div>
        </div>

        {/* Right Column: Selected Day Details */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  선택한 일자
                </span>
                <h4 className="font-extrabold text-base md:text-lg text-gray-900 mt-1">
                  {selectedDate}
                </h4>
              </div>

              <Link to="/recommend" className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5"/> 식단 추천
              </Link>
            </div>

            {/* Workout Status for Selected Day */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 mb-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-teal-600"/> 오늘의 운동 상태
                </span>
                <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${dayWorkoutLog?.completed
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-gray-200 text-gray-600'}`}>
                  {dayWorkoutLog?.completed ? '운동 완료' : '미완료'}
                </span>
              </div>
            </div>

            {/* Health Vitals (혈압 · 혈당 · 수면 기록) */}
            <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 mb-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600"/> 건강 기록 (혈압·혈당·수면)
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-100 px-2 py-0.5 rounded">
                  {selectedDate.slice(5)} 기록
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                <div className="p-2 rounded-lg bg-white border border-indigo-100">
                  <span className="text-gray-400 block text-[10px]">수면</span>
                  <span className="font-bold text-indigo-900">7.5시간 (양호)</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-indigo-100">
                  <span className="text-gray-400 block text-[10px]">혈압</span>
                  <span className="font-bold text-indigo-900">118 / 78</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-indigo-100">
                  <span className="text-gray-400 block text-[10px]">공복혈당</span>
                  <span className="font-bold text-indigo-900">94 mg/dL</span>
                </div>
              </div>
            </div>

            {/* Meals List */}
            <div className="space-y-3">
              <h5 className="font-bold text-xs text-gray-500 uppercase tracking-wider">
                등록된 식단 ({dayPlans.length}):
              </h5>

              {dayPlans.length === 0 ? (<div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500">
                  이 날짜에 등록된 식단이 없습니다.
                </div>) : (dayPlans.map(plan => {
            const mealLabel = {
                breakfast: '아침',
                lunch: '점심',
                dinner: '저녁',
                snack: '간식'
            }[plan.mealType] || '식사';
            return (<div key={plan.id} className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2 text-xs shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {mealLabel}
                        </span>
                        <MealStatusBadge status={plan.status} intakeStatus={plan.intakeStatus}/>
                      </div>

                      <Link to={`/recipes/${plan.recipeId}`} className="font-bold text-sm text-gray-900 hover:text-emerald-600 block truncate">
                        {plan.recipeSnapshot.title}
                      </Link>

                      <div className="flex items-center justify-between text-gray-500 text-[11px]">
                        <span>{plan.recipeSnapshot.nutrition.calories} kcal</span>
                        <span>단백질 {plan.recipeSnapshot.nutrition.protein}g</span>
                      </div>

                      {/* Intake status buttons */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-gray-500 text-[11px]">섭취 상태:</span>
                        <div className="flex items-center gap-1">
                          <button type="button" className={`px-2 py-1 rounded text-[10px] font-semibold ${plan.intakeStatus === 'scheduled' ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:bg-gray-100'}`} disabled>
                            예정
                          </button>
                          <button type="button" className={`px-2 py-1 rounded text-[10px] font-bold ${plan.intakeStatus === 'consumed' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-emerald-50'}`} disabled>
                            먹음
                          </button>
                          <button type="button" className={`px-2 py-1 rounded text-[10px] font-semibold ${plan.intakeStatus === 'skipped' ? 'bg-rose-100 text-rose-800' : 'text-gray-400 hover:bg-rose-50'}`} disabled>
                            안 먹음
                          </button>
                        </div>
                      </div>
                    </div>);
        }))}
            </div>
          </div>
        </div>
      </div>
    </>);
}

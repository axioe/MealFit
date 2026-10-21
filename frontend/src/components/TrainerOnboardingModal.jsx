import React, { useState } from 'react';
import { Award, ChevronRight, Sparkles, Target, Zap } from 'lucide-react';
export function TrainerOnboardingModal({ isOpen }) {
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState('');
    const [workoutGoal, setWorkoutGoal] = useState('');
    const [workoutLevel, setWorkoutLevel] = useState('');
    if (!isOpen)
        return null;
    const goalOptions = [
        { id: 'loss', label: '체중 감량', desc: '체지방 연소 & 슬림 바디' },
        { id: 'hypertrophy', label: '근육 증가', desc: '근비대 & 근력 강화' },
        { id: 'stamina', label: '체력 향상', desc: '심폐 지구력 & 피로 개선' },
        { id: 'health', label: '건강 유지', desc: '체형 교정 & 일상 활력' }
    ];
    const levelOptions = [
        { id: 'starter', label: '입문', desc: '운동이 처음이거나 오랜만' },
        { id: 'beginner', label: '초급', desc: '기본 동작 가능 (3~6개월)' },
        { id: 'intermediate', label: '중급', desc: '주 3회 이상 꾸준히 1년+' },
        { id: 'advanced', label: '고급', desc: '고강도 및 분할 루틴 숙련' }
    ];
    return (<div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-200">
            <Sparkles className="w-6 h-6"/>
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-1">
            첫 실행 10초 프로필 설정
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            AI 맞춤 트레이너 시작하기
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            필수 항목만 입력하면 오늘 무엇을 할지 매일 정해드립니다.
          </p>
        </div>

        <form onSubmit={event => event.preventDefault()} className="space-y-5 text-xs">
          {/* 1. 나이, 키, 체중 */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <label className="font-bold text-gray-700 block mb-1">나이 *</label>
              <div className="relative">
                <input type="number" min="18" max="80" required value={age} onChange={e => setAge(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 bg-white focus:outline-emerald-500"/>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">세</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">키 *</label>
              <div className="relative">
                <input type="number" step="0.1" min="100" max="240" required value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 bg-white focus:outline-emerald-500"/>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">cm</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">체중 *</label>
              <div className="relative">
                <input type="number" step="0.1" min="30" max="250" required value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 bg-white focus:outline-emerald-500"/>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">kg</span>
              </div>
            </div>
          </div>

          {/* 2. 운동 목적 (체중 감량/근육 증가/체력 향상/건강 유지) */}
          <div>
            <label className="font-bold text-gray-800 text-xs flex items-center gap-1.5 mb-2">
              <Target className="w-4 h-4 text-emerald-600"/>
              운동 목적 선택 *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {goalOptions.map(item => (<button type="button" key={item.id} onClick={() => setWorkoutGoal(item.id)} className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${workoutGoal === item.id
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  <span className="font-black text-sm block mb-0.5">{item.label}</span>
                  <span className="text-[11px] text-gray-500 block truncate">{item.desc}</span>
                </button>))}
            </div>
          </div>

          {/* 3. 운동 수준 (입문/초급/중급/고급) */}
          <div>
            <label className="font-bold text-gray-800 text-xs flex items-center gap-1.5 mb-2">
              <Award className="w-4 h-4 text-teal-600"/>
              현재 운동 수준 *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {levelOptions.map(item => (<button type="button" key={item.id} onClick={() => setWorkoutLevel(item.id)} className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${workoutLevel === item.id
                ? 'bg-teal-50 border-teal-500 text-teal-950 shadow-xs ring-1 ring-teal-500'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  <span className="font-black text-sm block mb-0.5">{item.label}</span>
                  <span className="text-[11px] text-gray-500 block truncate">{item.desc}</span>
                </button>))}
            </div>
          </div>

          {/* Friendly note about optional settings */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/70 text-gray-500 text-[11px] leading-relaxed">
            💡 <strong>선택 항목 안내:</strong> 운동 환경(헬스장/집/야외), 보유 기구, 가용 시간, 통증 부위, 알레르기, 기피 음식, 식단 유형 등은 가입 부담을 덜기 위해 <strong>[설정(마이페이지)]</strong>에서 언제든지 자유롭게 추가 설정하실 수 있습니다.
          </div>

          <button type="submit" className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px]" disabled>
            <Zap className="w-4 h-4"/>
            <span>설정 완료하고 오늘 코칭 받기</span>
            <ChevronRight className="w-4 h-4"/>
          </button>
        </form>
      </div>
    </div>);
}

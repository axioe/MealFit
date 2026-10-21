import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Award, Sparkles, Target, Zap } from 'lucide-react';
export function SignupPage() {
    // Account
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [nickname, setNickname] = useState('');
    // 5 필수 항목
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");
    const [currentWeight, setCurrentWeight] = useState("");
    const [workoutGoal, setWorkoutGoal] = useState('');
    const [workoutLevel, setWorkoutLevel] = useState('');
    const error = null;
    const isSubmitting = false;
    const goalOptions = [
        { id: 'loss', label: '체중 감량' },
        { id: 'hypertrophy', label: '근육 증가' },
        { id: 'stamina', label: '체력 향상' },
        { id: 'health', label: '건강 유지' }
    ];
    const levelOptions = [
        { id: 'starter', label: '입문' },
        { id: 'beginner', label: '초급' },
        { id: 'intermediate', label: '중급' },
        { id: 'advanced', label: '고급' }
    ];
    return (<div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-gray-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-200">
            <Sparkles className="w-6 h-6"/>
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            MealFit AI 트레이너 시작하기
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            필수 항목만 입력하여 가입 부담 없이 시작하세요.
          </p>
        </div>

        {error && (<div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0"/>
            <span>{error}</span>
          </div>)}

        <form onSubmit={event => event.preventDefault()} className="space-y-4 text-xs">
          {/* 계정 기본 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">이름 *</label>
              <input type="text" required placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">닉네임</label>
              <input type="text" placeholder="밀핏러버" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">이메일 *</label>
              <input type="email" required placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">비밀번호 *</label>
              <input type="password" required placeholder="6자리 이상" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
          </div>

          {/* 필수 1: 신체 정보 (나이, 키, 체중) */}
          <div className="pt-2 border-t border-gray-100">
            <span className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider block mb-2">
              필수 신체 프로필 (첫 실행)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-bold text-gray-700 block mb-1">나이 (만) *</label>
                <input type="number" min="18" max="80" required value={age} onChange={e => setAge(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">키 (cm) *</label>
                <input type="number" min="100" max="240" required value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">체중 (kg) *</label>
                <input type="number" min="30" max="250" required value={currentWeight} onChange={e => setCurrentWeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
              </div>
            </div>
          </div>

          {/* 필수 2: 운동 목적 */}
          <div>
            <label className="font-bold text-gray-800 block mb-1.5 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-600"/>
              운동 목적 *
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {goalOptions.map(g => (<button type="button" key={g.id} onClick={() => setWorkoutGoal(g.id)} className={`py-2 px-1 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${workoutGoal === g.id
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  {g.label}
                </button>))}
            </div>
          </div>

          {/* 필수 3: 운동 수준 */}
          <div>
            <label className="font-bold text-gray-800 block mb-1.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-teal-600"/>
              운동 수준 *
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {levelOptions.map(lvl => (<button type="button" key={lvl.id} onClick={() => setWorkoutLevel(lvl.id)} className={`py-2 px-1 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${workoutLevel === lvl.id
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  {lvl.label}
                </button>))}
            </div>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            * 운동 환경, 보유 기구, 알레르기 등 선택 항목은 가입 후 <strong>[마이페이지 설정]</strong>에서 언제든 추가할 수 있습니다.
          </p>

          <button type="submit" className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 min-h-[46px] cursor-pointer disabled:opacity-50" disabled>
            <Zap className="w-4 h-4"/>
            <span>{isSubmitting ? '가입 진행 중...' : '회원가입 완료 & 코칭 시작'}</span>
          </button>
        </form>

        <div className="text-center mt-5 pt-3 border-t border-gray-100 text-xs text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-emerald-700 font-bold hover:underline">
            로그인하기
          </Link>
        </div>
      </div>
    </div>);
}

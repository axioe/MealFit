import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Lock, Mail, Sparkles } from 'lucide-react';
export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const error = null;
    const isSubmitting = false;
    return (<div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-gray-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-lg max-w-md w-full">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-200">
            <Sparkles className="w-7 h-7"/>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            MealFit <span className="text-emerald-600 text-base font-bold">밀핏</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            냉장고 재료를 활용한 AI 맞춤 식단 & 스마트 웰니스
          </p>
        </div>

        {/* 1-Click Demo Button */}
        {null}

        <div className="relative flex py-2 items-center mb-5">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold">또는 이메일 로그인</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {error && (<div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0"/>
            <span>{error}</span>
          </div>)}

        <form onSubmit={event => event.preventDefault()} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">이메일 주소</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
              <input type="email" required placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
              <input type="password" required placeholder="비밀번호 입력" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs min-h-[44px] cursor-pointer disabled:opacity-50" disabled>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
          아직 계정이 없으신가요?{' '}
          <Link to="/signup" className="text-emerald-700 font-bold hover:underline">
            회원가입하기
          </Link>
        </div>
      </div>
    </div>);
}

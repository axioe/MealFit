import { Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

/** 로그인·회원가입 공통 카드 레이아웃 */
export function AuthShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-emerald-100/50">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-200">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            MealFit <span className="text-base font-bold text-emerald-600">밀핏</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">냉장고 재료를 활용한 AI 맞춤 식단</p>
        </div>
        {children}
        <div className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-500">{footer}</div>
      </div>
    </div>
  )
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm whitespace-pre-line text-rose-700">
      {message}
    </p>
  )
}

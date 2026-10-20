import { Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { findNavTitle } from './navItems'

export function Header() {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3.5 md:px-8">
      <h2 className="text-lg font-bold tracking-tight text-gray-900 md:text-xl">{findNavTitle(pathname)}</h2>

      <div className="flex items-center gap-2 md:gap-3">
        {/* TODO(대시보드 담당): 기한 임박 재료 수, 장보기 부족 품목 수 배지 (GET /api/v1/dashboard) */}
        <Link
          to="/recommend"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:from-emerald-700 hover:to-teal-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">AI 식단 추천</span>
          <span className="sm:hidden">AI 추천</span>
        </Link>
      </div>
    </header>
  )
}

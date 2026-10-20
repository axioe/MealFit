import { LogOut, Sparkles } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useLogout } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { NAV_ITEMS } from './navItems'

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white p-4 select-none md:flex">
      <div className="mb-4 flex items-center gap-3 border-b border-gray-100 px-3 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-200">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-gray-900">
            MealFit
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-800">밀핏</span>
          </h1>
          <p className="text-xs text-gray-500">AI 식단 & 스마트 냉장고</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 font-semibold text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
              {label}
            </span>
            {badge && (
              <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center justify-between border-t border-gray-100 px-2 pt-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
            {user?.nickname?.[0] ?? 'M'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-gray-800">{user?.nickname ?? '회원'}</p>
            <p className="truncate text-[11px] text-gray-400">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="로그아웃"
          className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}

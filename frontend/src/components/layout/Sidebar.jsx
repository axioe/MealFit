import { useLogout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { NAV_ITEMS } from '@/components/layout/navItems';
import React, { useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Sparkles } from 'lucide-react';
export function Sidebar({ user: providedUser = {}, profile = {} } = {}) {
    const logout = useLogout();
    const navigate = useNavigate();
    const logoutLock = useRef(false);
    const sessionUser = useAuthStore((state) => state.user);
    const user = providedUser.id ? providedUser : (sessionUser ?? {});

    /** 서버 토큰 폐기와 로컬 상태 정리가 끝나면 로그인 화면으로 이동합니다. */
    function handleLogout() {
        if (logoutLock.current || logout.isPending) return;
        logoutLock.current = true;

        logout.mutate(undefined, {
            // 서버 응답이 실패해도 useLogout이 로컬 로그인 정보는 정리합니다.
            onSettled: () => {
                logoutLock.current = false;
                navigate('/login', { replace: true, state: null });
            },
        });
    }

    return (<aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen p-4 sticky top-0 h-screen select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200">
          <Sparkles className="w-5 h-5"/>
        </div>
        <div>
          <h1 className="font-bold text-lg text-gray-900 tracking-tight flex items-center gap-1.5">
            MealFit <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">밀핏</span>
          </h1>
          <p className="text-xs text-gray-500">AI 식단 & 스마트 냉장고</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (<NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 text-emerald-600"/>
                <span>{item.label}</span>
              </div>
              {item.badge && (<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                  {item.badge}
                </span>)}
            </NavLink>);
        })}
      </nav>

      {/* AI Engine Status Card */}
      {null}

      {/* User Footer */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
            {profile?.nickname?.[0] || user?.nickname?.[0] || user?.name?.[0] || 'M'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{profile?.nickname || user?.nickname || user?.name || '회원'}</p>
            <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button type="button" title={logout.isPending ? "로그아웃 중..." : "로그아웃"} aria-label="로그아웃" onClick={handleLogout} disabled={logout.isPending} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 min-h-11 min-w-11 flex items-center justify-center">
          <LogOut className="w-4 h-4"/>
        </button>
      </div>
    </aside>);
}

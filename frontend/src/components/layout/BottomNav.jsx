import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

export function BottomNav() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-gray-200 bg-white/95 px-2 py-1 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {NAV_ITEMS.filter((item) => item.mobile !== false).map(({ to, shortLabel, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-12 min-w-14 flex-col items-center justify-center rounded-xl px-2 py-1 transition-colors ${
                isActive ? 'font-bold text-emerald-600' : 'font-medium text-gray-500 hover:text-gray-900'
              }`
            }
          >
            <Icon className="mb-0.5 h-5 w-5" />
            <span className="text-[11px] leading-tight">{shortLabel}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

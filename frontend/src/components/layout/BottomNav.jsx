import { NAV_ITEMS } from '@/components/layout/navItems';
import React from 'react';
import { NavLink } from 'react-router-dom';
export function BottomNav() {
    return (<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 px-2 py-1 safe-area-pb shadow-lg">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {NAV_ITEMS.filter(item => item.mobile !== false).map(item => {
            const Icon = item.icon;
            return (<NavLink key={item.to} to={item.to} className={({ isActive }) => `flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl text-xs transition-colors cursor-pointer ${isActive
                    ? 'text-emerald-600 font-bold'
                    : 'text-gray-500 hover:text-gray-900 font-medium'}`}>
              <Icon className="w-5 h-5 mb-0.5"/>
              <span className="text-[11px] leading-tight">{item.shortLabel || item.label}</span>
            </NavLink>);
        })}
      </div>
    </nav>);
}

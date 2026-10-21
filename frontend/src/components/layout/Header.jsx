import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ShoppingCart, Sparkles } from 'lucide-react';
export function Header({ title, subtitle }) {
    const imminentCount = 0;
    const shoppingCount = 0;
    return (<header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3.5 sticky top-0 z-30 flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
          {title || 'MealFit'}
        </h2>
        {subtitle && <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">{subtitle}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        {imminentCount > 0 && (<Link to="/fridge" className="hidden items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full sm:flex bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors" title="기한 임박/경과 재료 확인">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600"/>
            <span>임박 {imminentCount}개</span>
          </Link>)}

        {shoppingCount > 0 && (<Link to="/shopping" className="hidden items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full sm:flex bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors" title="장바구니 부족 품목 확인">
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-600"/>
            <span>장보기 {shoppingCount}</span>
          </Link>)}

        <Link to="/recommend" className="flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-xs hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer">
          <Sparkles className="w-3.5 h-3.5"/>
          <span className="hidden sm:inline">AI 식단 추천</span>
          <span className="sm:hidden">AI 추천</span>
        </Link>
      </div>
    </header>);
}

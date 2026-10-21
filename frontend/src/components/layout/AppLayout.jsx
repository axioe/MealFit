import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { findNavItem } from '@/components/layout/navItems';
export function AppLayout() {
    const item = findNavItem(useLocation().pathname);
    return <div className="flex min-h-screen bg-gray-50 text-gray-900">
    <Sidebar />
    <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-8">
      <Header title={item.label} subtitle={item.subtitle}/>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8"><Outlet /></main>
    </div>
    <BottomNav />
  </div>;
}

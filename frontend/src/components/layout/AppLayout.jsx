import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

/** 데스크톱: 좌측 메뉴 / 모바일(md 미만): 하단 메뉴 */
export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-8">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

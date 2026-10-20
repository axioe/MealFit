import { Dumbbell, LayoutDashboard, Refrigerator, ShoppingCart, Sparkles, UserCheck } from 'lucide-react'

/**
 * 좌측 메뉴(데스크톱)와 하단 메뉴(모바일)가 같이 쓰는 목록.
 * shortLabel: 모바일 하단 메뉴용 짧은 이름 / mobile: false면 하단 메뉴에서 숨김
 */
export const NAV_ITEMS = [
  { to: '/dashboard', label: '대시보드', shortLabel: '홈', icon: LayoutDashboard },
  { to: '/recommend', label: 'AI 식단 추천', shortLabel: 'AI 추천', icon: Sparkles, badge: 'AI' },
  { to: '/fridge', label: '스마트 냉장고', shortLabel: '냉장고', icon: Refrigerator },
  { to: '/shopping', label: '자동 장보기', shortLabel: '장보기', icon: ShoppingCart },
  { to: '/workout', label: '맞춤 운동 루틴', shortLabel: '운동', icon: Dumbbell, badge: 'P1', mobile: false },
  { to: '/mypage', label: '마이페이지', shortLabel: '마이', icon: UserCheck },
]

export function findNavTitle(pathname) {
  if (pathname.startsWith('/recipes/')) return '레시피 상세'
  return NAV_ITEMS.find((item) => pathname.startsWith(item.to))?.label ?? 'MealFit'
}

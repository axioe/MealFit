import {
  LayoutDashboard,
  Refrigerator,
  ShoppingCart,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  /** 모바일 하단 메뉴용 짧은 이름 */
  shortLabel: string
  icon: LucideIcon
  badge?: string
}

/**
 * 좌측 메뉴(데스크톱)와 하단 메뉴(모바일)가 같이 쓰는 목록.
 * Phase 1 메뉴(운동·캘린더·체중)는 발표 이후 여기에 추가한다.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: '대시보드', shortLabel: '홈', icon: LayoutDashboard },
  { to: '/recommend', label: 'AI 식단 추천', shortLabel: 'AI 추천', icon: Sparkles, badge: 'AI' },
  { to: '/fridge', label: '스마트 냉장고', shortLabel: '냉장고', icon: Refrigerator },
  { to: '/shopping', label: '자동 장보기', shortLabel: '장보기', icon: ShoppingCart },
  { to: '/mypage', label: '마이페이지', shortLabel: '마이', icon: UserCheck },
]

export function findNavTitle(pathname: string): string {
  if (pathname.startsWith('/recipes/')) return '레시피 상세'
  return NAV_ITEMS.find((item) => pathname.startsWith(item.to))?.label ?? 'MealFit'
}

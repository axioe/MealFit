import { Calendar, Dumbbell, LayoutDashboard, Refrigerator, Scale, ShoppingCart, Sparkles, UserCheck } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/dashboard', label: '대시보드', shortLabel: '홈', icon: LayoutDashboard, subtitle: '오늘의 식단과 냉장고, 운동 기록을 확인하세요.' },
  { to: '/recommend', label: 'AI 식단 추천', shortLabel: 'AI 추천', icon: Sparkles, badge: 'AI', subtitle: '재료와 선호도를 반영한 식단을 확인하세요.' },
  { to: '/fridge', label: '스마트 냉장고', shortLabel: '냉장고', icon: Refrigerator, subtitle: '재료별 수량과 소비기한, 보관 위치를 관리합니다.' },
  { to: '/shopping', label: '자동 장보기', shortLabel: '장보기', icon: ShoppingCart, subtitle: '필요한 재료와 구매 목록을 확인하세요.' },
  { to: '/workout', label: '맞춤 운동 루틴', shortLabel: '운동', icon: Dumbbell, mobile: false, badge: 'P1', subtitle: '주간 운동 계획과 기록을 확인하세요.' },
  { to: '/calendar', label: '캘린더', shortLabel: '캘린더', icon: Calendar, mobile: false, badge: 'P1', subtitle: '날짜별 식단과 운동 기록을 확인하세요.' },
  { to: '/weight', label: '체중 관리', shortLabel: '체중', icon: Scale, mobile: false, badge: 'P1', subtitle: '체중 변화와 목표를 확인하세요.' },
  { to: '/mypage', label: '마이페이지', shortLabel: '마이', icon: UserCheck, subtitle: '프로필과 식단 선호도, 운동 설정을 관리합니다.' },
]
export const navItems = NAV_ITEMS
export function findNavItem(pathname) {
  if (pathname.startsWith('/recipes/')) return { label: '레시피 상세' }
  return NAV_ITEMS.find(item => pathname.startsWith(item.to)) ?? { label: 'MealFit' }
}
export function findNavTitle(pathname) { return findNavItem(pathname).label }

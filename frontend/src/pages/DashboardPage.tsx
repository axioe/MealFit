import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export function DashboardPage() {
  return (
    <PagePlaceholder
      title="대시보드"
      owner="최원석"
      description="오늘의 식단과 섭취 기록, 기한 임박 재료, 장보기 부족분을 한눈에 보여주는 홈 화면"
      todos={[
        '오늘의 3끼 카드 (상태 배지 · 먹음/건너뜀 버튼)',
        '기한 임박/오늘 만료 재료 목록 (ExpirationBadge)',
        '장보기 부족분 요약 → /shopping 이동',
        '식단이 없으면 "AI 식단 추천 받기" 유도',
      ]}
      apis={['GET /api/v1/dashboard?date=', 'POST /api/v1/intake-logs']}
    />
  )
}

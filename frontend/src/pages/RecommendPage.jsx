import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export function RecommendPage() {
  return (
    <PagePlaceholder
      title="AI 식단 추천"
      owner="김수현 (화면) · 박희진 (AI) · 유지훈 (서버 검증)"
      description="날짜별 아침/점심/저녁 추천 초안을 받고, 전체 또는 한 끼만 다시 추천받은 뒤 서버 검증을 거쳐 확정한다."
      todos={[
        '날짜 선택 + "추천 받기" (로딩 최대 20초 표시)',
        '끼니별 카드: 메뉴명, 추천 이유, 생성 모드(RecipeSourceBadge)',
        '한 끼 재추천 / 전체 재추천',
        '확정 → 알레르기·제외 재료 충돌 시 에러 메시지 표시',
        '확정 성공 시 장보기 목록으로 이동 안내',
      ]}
      apis={[
        'POST /api/v1/meal-plans/recommend',
        'POST /api/v1/meal-plans/{id}/regenerate',
        'POST /api/v1/meal-plans/{id}/confirm',
      ]}
    />
  )
}

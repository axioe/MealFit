import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export function ShoppingPage() {
  return (
    <PagePlaceholder
      title="자동 장보기"
      owner="김수현 (화면) · 유지훈 (API)"
      description="식단 확정 시 계산된 부족분을 보여주고, 구매한 만큼 냉장고에 입고한다."
      todos={[
        '부족분 목록 (필요량 · 구매량 · 상태)',
        '부분 구매 수량 입력',
        '구매분 냉장고 입고 (기한·보관 위치 입력)',
      ]}
      apis={['GET /api/v1/shopping-items', 'PATCH /api/v1/shopping-items', 'POST /api/v1/shopping-items/stock-in']}
    />
  )
}

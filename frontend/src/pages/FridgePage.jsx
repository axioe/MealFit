import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export function FridgePage() {
  return (
    <PagePlaceholder
      title="스마트 냉장고"
      owner="김수현 (화면 + API)"
      description="재료별 합계와 기한·보관 위치별 재고 묶음을 관리하고 변경 이력을 남긴다."
      todos={[
        '재료별 합계 목록 + 묶음(lot) 펼쳐보기',
        '기한 상태 5단계 배지 (정상/임박/오늘/경과/미등록)',
        '재료 입고 폼 (수량·단위·기한·보관 위치·최소 유지량)',
        '수동 조정 / 폐기',
      ]}
      apis={['GET /api/v1/inventory/lots', 'POST /api/v1/inventory/lots', 'PATCH /api/v1/inventory/lots/{id}']}
    />
  )
}

import { useParams } from 'react-router-dom'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export function RecipeDetailPage() {
  const { id } = useParams()
  return (
    <PagePlaceholder
      title={`레시피 상세 #${id}`}
      owner="김수현 (화면) · 유지훈 (조리 차감)"
      description="레시피 재료·조리 순서를 보여주고, 인분 환산과 조리 완료(재고 차감)·취소(복원)를 처리한다."
      todos={[
        '인분 조절 → 재료량 환산 표시',
        '영양 정보 (추정치 표시)',
        '조리 차감 미리보기 → 조리 완료',
        '조리 취소 시 재고 원본 복원',
      ]}
      apis={[
        'GET /api/v1/recipes/{id}?servings=',
        'GET /api/v1/cooking/preview?mealPlanId=',
        'POST /api/v1/cooking-events',
        'POST /api/v1/cooking-events/{id}/cancel',
      ]}
    />
  )
}

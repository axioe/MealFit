import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export function WorkoutPage() {
  return (
    <PagePlaceholder
      title="맞춤 운동 루틴 (Phase 1)"
      owner="유지훈"
      description="주 운동 일수·회당 시간·보유 장비를 바탕으로 AI가 요일별 루틴을 만들고, 자연어로 세션을 조정한다. 발표(10/23) 이후 진행."
      todos={[
        '루틴 설정: 주 2~6일, 회당 15/30/45/60분, 보유 장비',
        '요일별 루틴: 준비 · 본 운동(세트·횟수) · 정리 3단계',
        '"오늘은 15분만 가능해" 같은 자연어 조정',
        '운동 완료 기록',
      ]}
      apis={['GET/POST /api/v1/workout-plans', 'POST /api/v1/workout-plans/adjust', 'POST /api/v1/workout-logs']}
    />
  )
}

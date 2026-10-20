import { PagePlaceholder } from '@/components/common/PagePlaceholder'

export function MyPage() {
  return (
    <PagePlaceholder
      title="마이페이지"
      owner="최원석"
      description="식단 추천과 알레르기 검증에 쓰이는 사용자 프로필을 입력·수정한다. 가입 직후 처음 들어오는 화면."
      todos={[
        '닉네임',
        '목표: 감량 / 유지 / 증량',
        '선호 조리 시간: 10 / 20 / 30분',
        '한 끼 예산 (선택)',
        '알레르기 · 제외 재료 (TagInput 컴포넌트 사용 가능)',
        '로그아웃',
      ]}
      apis={['GET /api/v1/me/profile', 'PUT /api/v1/me/profile']}
    />
  )
}

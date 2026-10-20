import { Link } from 'react-router-dom'
import { PagePlaceholder } from '@/components/common/PagePlaceholder'

/** 메뉴 레이아웃 없이 단독으로 보이는 화면 */
export function LoginPage() {
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <PagePlaceholder
        title="로그인 · 회원가입"
        owner="최원석"
        description="이메일 회원가입·로그인과 로그인 상태 유지. 완성되면 로그인하지 않은 사용자는 이 화면으로 보낸다."
        todos={[
          '회원가입 (이메일 · 비밀번호 · 닉네임) → 가입 후 마이페이지로 이동',
          '로그인 / 로그아웃',
          '로그인 상태 유지와 만료 처리 (api/client.js 인터셉터)',
          '로그인 안 한 사용자 접근 막기 (라우터 가드)',
          '백엔드: 사용자·프로필 테이블, 인증 API, @CurrentUserId 실제 구현으로 교체',
        ]}
        apis={['POST /api/v1/auth/signup', 'POST /api/v1/auth/login', 'GET /api/v1/me']}
      />
      <Link to="/dashboard" className="btn-secondary mt-4">
        대시보드로 가기
      </Link>
    </div>
  )
}

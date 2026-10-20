// 담당: 최원석 (로그인·회원가입)
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSignup } from '@/api/auth'
import { getErrorMessage } from '@/api/client'
import { AuthShell, FormError } from './AuthShell'

export function SignupPage() {
  const signup = useSignup()
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', nickname: '' })
  const [localError, setLocalError] = useState(null)

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.password !== form.passwordConfirm) {
      setLocalError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLocalError(null)
    // 성공하면 useSignup이 마이페이지(프로필 입력)로 이동시킨다
    signup.mutate({ email: form.email, password: form.password, nickname: form.nickname })
  }

  return (
    <AuthShell
      footer={
        <>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-bold text-emerald-700 hover:underline">
            로그인
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nickname" className="label">
            닉네임
          </label>
          <input id="nickname" className="input" maxLength={20} value={form.nickname} onChange={update('nickname')} required />
        </div>
        <div>
          <label htmlFor="email" className="label">
            이메일 주소
          </label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="name@example.com"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            비밀번호 (8자 이상)
          </label>
          <input
            id="password"
            type="password"
            className="input"
            minLength={8}
            maxLength={64}
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            required
          />
        </div>
        <div>
          <label htmlFor="passwordConfirm" className="label">
            비밀번호 확인
          </label>
          <input
            id="passwordConfirm"
            type="password"
            className="input"
            autoComplete="new-password"
            value={form.passwordConfirm}
            onChange={update('passwordConfirm')}
            required
          />
        </div>
        <FormError message={localError ?? (signup.isError ? getErrorMessage(signup.error) : null)} />
        <button type="submit" className="btn-primary w-full py-3" disabled={signup.isPending}>
          {signup.isPending ? '가입 중...' : '회원가입'}
        </button>
      </form>
    </AuthShell>
  )
}

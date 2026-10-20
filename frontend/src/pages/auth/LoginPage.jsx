// 담당: 최원석 (로그인·회원가입)
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLogin } from '@/api/auth'
import { getErrorMessage } from '@/api/client'
import { AuthShell, FormError } from './AuthShell'

export function LoginPage() {
  const location = useLocation()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // 로그인이 필요해서 튕겨온 경우 원래 가려던 화면으로 돌려보낸다
    const from = location.state?.from ?? '/dashboard'
    login.mutate({ email, password, redirectTo: from })
  }

  return (
    <AuthShell
      footer={
        <>
          아직 계정이 없으신가요?{' '}
          <Link to="/signup" className="font-bold text-emerald-700 hover:underline">
            회원가입하기
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="비밀번호 입력"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <FormError message={login.isError ? getErrorMessage(login.error) : null} />
        <button type="submit" className="btn-primary w-full py-3" disabled={login.isPending}>
          {login.isPending ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </AuthShell>
  )
}

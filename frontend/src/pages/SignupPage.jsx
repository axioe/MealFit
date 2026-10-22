import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Sparkles, Zap } from 'lucide-react'
import { useSignup } from '@/api/auth'
import { getErrorMessage } from '@/api/client'

/**
 * 이메일·비밀번호·닉네임으로 가입하고 자동 로그인합니다.
 * 식단 목표·알레르기 등 추가 프로필은 가입 후 마이페이지에서 입력합니다.
 */
export function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [formError, setFormError] = useState('')
  const submitLock = useRef(false)
  const signup = useSignup()
  const navigate = useNavigate()
  const isSubmitting = signup.isPending
  const error = formError || (
    signup.isError
      ? getErrorMessage(signup.error, '회원가입하지 못했습니다.')
      : null
  )

  /** 화면에서도 검증하고, 최종 검증·중복 검사는 서버에 맡깁니다. */
  async function handleSubmit(event) {
    event.preventDefault()
    if (submitLock.current) return

    setFormError('')
    signup.reset()

    if (!nickname.trim()) {
      setFormError('닉네임을 입력해 주세요.')
      return
    }

    // 글자 수와 UTF-8 바이트 수는 다릅니다. BCrypt 제한도 확인합니다.
    if (new TextEncoder().encode(password).length > 72) {
      setFormError('비밀번호는 UTF-8 기준 72바이트 이하로 입력해 주세요.')
      return
    }

    submitLock.current = true
    try {
      await signup.mutateAsync({
        email: email.trim().toLowerCase(),
        password, // 비밀번호의 공백은 임의로 제거하지 않습니다.
        nickname: nickname.trim(),
      })

      // useSignup이 토큰·회원 정보를 저장한 뒤 프로필 입력 화면으로 이동합니다.
      navigate('/mypage', { replace: true })
    } catch {
      // 중복 이메일 등 서버 오류는 기존 오류 영역에 표시합니다.
    } finally {
      submitLock.current = false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-gray-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-200">
            <Sparkles aria-hidden="true" className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            MealFit 회원가입
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            계정 정보를 입력하고 밀핏을 시작하세요.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle aria-hidden="true" className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="signup-nickname" className="font-bold text-gray-700 block mb-1">
              닉네임 *
            </label>
            <input
              id="signup-nickname"
              type="text"
              required
              maxLength={50}
              autoComplete="nickname"
              disabled={isSubmitting}
              placeholder="밀핏러버"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="font-bold text-gray-700 block mb-1">
              이메일 *
            </label>
            <input
              id="signup-email"
              type="email"
              required
              maxLength={254}
              autoComplete="username"
              autoCapitalize="none"
              disabled={isSubmitting}
              placeholder="user@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="font-bold text-gray-700 block mb-1">
              비밀번호 *
            </label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={8}
              maxLength={64}
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-describedby="signup-password-help"
              placeholder="8자 이상 64자 이하"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"
            />
            <p id="signup-password-help" className="mt-1.5 text-[11px] text-gray-500">
              8~64자로 입력해 주세요. 한글 등 다국어 문자는 72바이트 제한이 함께 적용됩니다.
            </p>
          </div>

          {/* 가입 API가 저장하지 않는 신체·운동 정보는 이 화면에서 수집하지 않습니다. */}
          <p className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            가입 후 마이페이지로 이동합니다. 추가 프로필 저장 기능은 준비 중입니다.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 min-h-[46px] cursor-pointer disabled:opacity-50"
          >
            <Zap aria-hidden="true" className="w-4 h-4" />
            <span>{isSubmitting ? '가입 진행 중...' : '회원가입'}</span>
          </button>
        </form>

        <div className="text-center mt-5 pt-3 border-t border-gray-100 text-xs text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-emerald-700 font-bold hover:underline">
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  )
}


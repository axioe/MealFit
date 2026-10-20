// 담당: 최원석 (마이페이지)
import { CheckCircle2, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLogout } from '@/api/auth'
import { getErrorMessage } from '@/api/client'
import { useProfile, useUpdateProfile } from '@/api/me'
import { Spinner } from '@/components/common/Spinner'
import { TagInput } from '@/components/common/TagInput'
import { COOKING_TIMES, GOAL } from '@/lib/enums'
import { GOAL_LABEL } from '@/lib/labels'
import { useAuthStore } from '@/stores/authStore'

export function MyPage() {
  const { data: profile, isLoading, isError, error } = useProfile()
  const location = useLocation()
  const isOnboarding = location.state?.onboarding === true

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }
  if (isError || !profile) {
    return <p className="text-sm text-rose-600">{getErrorMessage(error, '프로필을 불러오지 못했습니다.')}</p>
  }

  return (
    <div className="space-y-6">
      {isOnboarding && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          가입을 환영합니다! 정확한 식단 추천을 위해 목표와 알레르기 정보를 먼저 입력해 주세요.
        </div>
      )}
      <ProfileForm initial={profile} />
      <AccountCard />
    </div>
  )
}

function ProfileForm({ initial }) {
  const [form, setForm] = useState(initial)
  const update = useUpdateProfile()

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    update.mutate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div>
        <h3 className="text-base font-bold text-gray-900">식단 프로필</h3>
        <p className="mt-1 text-xs text-gray-500">AI 식단 추천과 알레르기 검증에 사용됩니다.</p>
      </div>

      <div>
        <label htmlFor="nickname" className="label">
          닉네임
        </label>
        <input
          id="nickname"
          className="input max-w-xs"
          maxLength={20}
          value={form.nickname}
          onChange={(e) => set('nickname', e.target.value)}
          required
        />
      </div>

      <fieldset>
        <legend className="label">목표</legend>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(GOAL).map((goal) => (
            <ChoiceButton key={goal} selected={form.goal === goal} onClick={() => set('goal', goal)}>
              {GOAL_LABEL[goal]}
            </ChoiceButton>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">선호 조리 시간</legend>
        <div className="grid grid-cols-3 gap-2">
          {COOKING_TIMES.map((min) => (
            <ChoiceButton key={min} selected={form.cookingTimePref === min} onClick={() => set('cookingTimePref', min)}>
              {min}분 이내
            </ChoiceButton>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="budget" className="label">
          한 끼 예산 (원, 선택)
        </label>
        <input
          id="budget"
          type="number"
          min={0}
          step={500}
          className="input max-w-xs"
          placeholder="예: 8000"
          value={form.budgetPerMeal ?? ''}
          onChange={(e) => set('budgetPerMeal', e.target.value === '' ? null : Number(e.target.value))}
        />
      </div>

      <div>
        <label htmlFor="allergies" className="label">
          알레르기
        </label>
        <TagInput
          id="allergies"
          value={form.allergies}
          onChange={(v) => set('allergies', v)}
          placeholder="예: 땅콩, 새우 (Enter로 추가)"
        />
        <p className="mt-1.5 text-xs text-gray-500">알레르기 재료가 포함된 식단은 확정할 수 없습니다.</p>
      </div>

      <div>
        <label htmlFor="excluded" className="label">
          제외 재료
        </label>
        <TagInput
          id="excluded"
          value={form.excludedIngredients}
          onChange={(v) => set('excludedIngredients', v)}
          placeholder="예: 오이, 고수"
        />
      </div>

      {update.isError && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm whitespace-pre-line text-rose-700">
          {getErrorMessage(update.error)}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={update.isPending}>
          {update.isPending ? '저장 중...' : '저장'}
        </button>
        {update.isSuccess && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> 저장되었습니다
          </span>
        )}
      </div>
    </form>
  )
}

function ChoiceButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`cursor-pointer rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
        selected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  )
}

function AccountCard() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <section className="card flex items-center justify-between">
      <div>
        <h3 className="text-base font-bold text-gray-900">계정</h3>
        <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
      </div>
      <button
        type="button"
        className="btn-secondary"
        onClick={async () => {
          await logout()
          navigate('/login', { replace: true })
        }}
      >
        <LogOut className="h-4 w-4" /> 로그아웃
      </button>
    </section>
  )
}

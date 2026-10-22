import { useRef, useState } from 'react'
import { useMyProfile, useUpdateMyProfile } from '@/api/profile'
import { useAuthStore } from '@/stores/authStore'

/** 조회가 끝난 뒤 폼을 생성해 서버 값을 최초 입력값으로 사용합니다. */
export function ProfileSettings({ onDirtyChange, onSavingChange }) {
  const query = useMyProfile()
  const userId = useAuthStore((state) => state.user?.id)

  if (query.isPending) return <p role="status">프로필을 불러오는 중입니다.</p>
  if (query.isError && !query.data) return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm">
      <p>프로필을 불러오지 못했습니다.</p>
      <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className="mt-2 underline">다시 시도</button>
    </div>
  )

  // 계정 변경 시 입력 폼도 새로 생성합니다. 백그라운드 조회로 작성 중인 값을 덮지 않습니다.
  return <ProfileForm key={userId} profile={query.data} onDirtyChange={onDirtyChange} onSavingChange={onSavingChange} />
}

/** 쉼표로 입력한 재료를 공백 제거·중복 제거한 배열로 변환합니다. */
function parseIngredients(text) {
  return [...new Set(text.split(',').map((item) => item.trim()).filter(Boolean))]
}

function ProfileForm({ profile, onDirtyChange, onSavingChange }) {
  const save = useUpdateMyProfile()
  const submitLock = useRef(false)
  const [nickname, setNickname] = useState(profile.nickname)
  const [goal, setGoal] = useState(profile.goal ?? '')
  const [cookTime, setCookTime] = useState(profile.cookTimeMin ?? '')
  const [budget, setBudget] = useState(profile.mealBudget ?? '')
  const [allergies, setAllergies] = useState(profile.allergies.join(', '))
  const [excluded, setExcluded] = useState(profile.excludedIngredients.join(', '))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const inputClass = 'mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-emerald-500'

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitLock.current || save.isPending) return
    setMessage('')
    setError('')
    const body = {
      nickname: nickname.trim(),
      goal: goal || null,
      cookTimeMin: cookTime === '' ? null : Number(cookTime),
      mealBudget: budget === '' ? null : Number(budget),
      allergies: parseIngredients(allergies),
      excludedIngredients: parseIngredients(excluded),
    }
    // 서버의 길이·개수 제한과 같은 기준으로 저장 전에 확인합니다.
    if (!body.nickname || body.nickname.length > 50) {
      setError('닉네임을 1~50자로 입력해 주세요.')
      return
    }
    if (body.mealBudget !== null && (!Number.isInteger(body.mealBudget) || body.mealBudget < 1 || body.mealBudget > 2147483647)) {
      setError('한 끼 예산은 1~2,147,483,647 사이의 정수로 입력해 주세요.')
      return
    }
    if ([body.allergies, body.excludedIngredients].some((items) => items.length > 50 || items.some((item) => item.length > 100))) {
      setError('재료는 항목별 최대 50개, 재료명은 100자까지 입력할 수 있습니다.')
      return
    }
    submitLock.current = true
    onSavingChange?.(true)
    try {
      const saved = await save.mutateAsync(body)
      setNickname(saved.nickname)
      setAllergies(saved.allergies.join(', '))
      setExcluded(saved.excludedIngredients.join(', '))
      setMessage('프로필을 저장했습니다.')
      onDirtyChange?.(false)
    } catch (failure) {
      // 실패해도 작성 중인 입력값을 유지합니다.
      setError(failure.response?.data?.message ?? '저장하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.')
    } finally {
      submitLock.current = false
      onSavingChange?.(false)
    }
  }

  return (
    <form onChange={() => onDirtyChange?.(true)} onSubmit={handleSubmit} className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
      <h4 className="mb-4 text-sm font-bold text-gray-900">내 프로필 · 식단 설정</h4>
      <fieldset disabled={save.isPending} className="space-y-4 disabled:opacity-70">
        <div>
          <label htmlFor="profile-nickname" className="text-xs font-bold">닉네임 *</label>
          <input id="profile-nickname" required maxLength={50} value={nickname} onChange={(event) => { setNickname(event.target.value); setMessage('') }} className={inputClass} />
        </div>
        <div>
          <label htmlFor="profile-goal" className="text-xs font-bold">식단 목표</label>
          <select id="profile-goal" value={goal} onChange={(event) => { setGoal(event.target.value); setMessage('') }} className={inputClass}>
            <option value="">선택 안 함</option>
            <option value="LOSE">체중 감량</option>
            <option value="MAINTAIN">체중 유지</option>
            <option value="GAIN">체중 증량</option>
          </select>
        </div>
        <div>
          <label htmlFor="profile-cook-time" className="text-xs font-bold">조리 가능 시간</label>
          <select id="profile-cook-time" value={cookTime} onChange={(event) => { setCookTime(event.target.value); setMessage('') }} className={inputClass}>
            <option value="">선택 안 함</option>
            <option value="10">10분 이내</option>
            <option value="20">20분 이내</option>
            <option value="30">30분 이내</option>
          </select>
        </div>
        <div>
          <label htmlFor="profile-budget" className="text-xs font-bold">한 끼 예산 (원, 선택)</label>
          <input id="profile-budget" type="number" min="1" max="2147483647" step="1" value={budget} onChange={(event) => { setBudget(event.target.value); setMessage('') }} className={inputClass} />
        </div>
        <div>
          <label htmlFor="profile-allergies" className="text-xs font-bold text-rose-700">알레르기 재료 (쉼표로 구분)</label>
          <input id="profile-allergies" value={allergies} placeholder="예: 땅콩, 우유" onChange={(event) => { setAllergies(event.target.value); setMessage('') }} className={inputClass} />
        </div>
        <div>
          <label htmlFor="profile-excluded" className="text-xs font-bold">제외할 재료 (쉼표로 구분)</label>
          <input id="profile-excluded" value={excluded} placeholder="예: 오이, 고수" onChange={(event) => { setExcluded(event.target.value); setMessage('') }} className={inputClass} />
        </div>
        <p className="text-xs text-gray-500">선택 항목을 비우고 저장하면 기존 설정을 해제합니다.</p>
        <button type="submit" className="min-h-11 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
          {save.isPending ? '저장 중...' : '프로필 저장'}
        </button>
      </fieldset>
      {message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    </form>
  )
}

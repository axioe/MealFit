import { useEffect, useId, useRef, useState } from 'react'
import { useWithdraw } from '@/api/withdrawal'
import { validateWithdrawalInput } from '@/api/withdrawalFlow'
import { getErrorMessage } from '@/api/client'

/** 기존 프로필 저장 중에는 탈퇴를 시작하지 않습니다. */
export function WithdrawalSection({ disabled = false }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
      <div>
        <span className="font-bold text-xs text-rose-700 block">회원 탈퇴</span>
        <span className="text-[11px] text-gray-500">비밀번호 확인 후 계정을 비활성화합니다.</span>
      </div>
      <button type="button" onClick={() => setOpen(true)} disabled={disabled}
        className="min-h-11 shrink-0 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
        회원 탈퇴
      </button>
      {open && <WithdrawalDialog onClose={() => setOpen(false)} />}
    </div>
  )
}

/** native dialog가 포커스 이동과 배경 조작 차단을 처리합니다. */
function WithdrawalDialog({ onClose }) {
  const dialogRef = useRef(null)
  const passwordRef = useRef(null)
  const submitLock = useRef(false)
  const id = useId()
  const withdrawal = useWithdraw()
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    passwordRef.current?.focus()
    return () => dialog.close()
  }, [])

  function close() {
    if (submitLock.current || withdrawal.isPending) return
    // 취소하면 컴포넌트가 해제되므로 입력한 비밀번호도 폐기됩니다.
    onClose()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitLock.current || withdrawal.isPending) return
    setError('')
    try {
      validateWithdrawalInput(password, confirmed)
    } catch (failure) {
      setError(failure.message)
      passwordRef.current?.focus()
      return
    }
    submitLock.current = true
    try {
      await withdrawal.mutateAsync({ password, confirmed })
    } catch (failure) {
      // 비밀번호 오류나 통신 실패만으로 현재 로그인 정보를 삭제하지 않습니다.
      setError(getErrorMessage(failure, '탈퇴를 완료하지 못했습니다. 다시 시도해 주세요.'))
      setPassword('')
      passwordRef.current?.focus()
    } finally {
      submitLock.current = false
    }
  }

  return (
    <dialog ref={dialogRef} aria-labelledby={id + '-title'} aria-describedby={id + '-description'}
      onCancel={(event) => { event.preventDefault(); close() }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-xl backdrop:bg-black/40">
      <h2 id={id + '-title'} className="text-lg font-bold">회원 탈퇴</h2>
      <div id={id + '-description'} className="mt-3 space-y-2 text-sm text-gray-600">
        <p>탈퇴하면 모든 기기에서 로그인과 서비스 이용이 차단됩니다.</p>
        <p>계정은 비활성화되며 기존 기록은 보관됩니다. 현재 동일 이메일로 재가입할 수 없습니다.</p>
        <p>저장하지 않은 입력 내용은 사라집니다.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <fieldset disabled={withdrawal.isPending} className="space-y-4">
          <div>
            <label htmlFor={id + '-password'} className="block text-sm font-semibold">현재 비밀번호</label>
            <input ref={passwordRef} id={id + '-password'} type="password" required maxLength={72}
              autoComplete="current-password" value={password}
              aria-invalid={Boolean(error)} aria-describedby={error ? id + '-error' : undefined}
              onChange={(event) => { setPassword(event.target.value); setError('') }}
              className="mt-1 min-h-11 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-rose-500" />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required checked={confirmed}
              onChange={(event) => { setConfirmed(event.target.checked); setError('') }}
              className="mt-1 h-4 w-4 shrink-0 accent-rose-600" />
            <span>탈퇴 안내를 확인했으며 회원 탈퇴에 동의합니다.</span>
          </label>
          {error && <p id={id + '-error'} role="alert" className="text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="min-h-11 rounded-xl border border-gray-300 px-4 py-2 text-sm">취소</button>
            <button type="submit" disabled={!confirmed || !password.trim() || withdrawal.isPending}
              className="min-h-11 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50">
              {withdrawal.isPending ? '탈퇴 처리 중...' : '확인하고 탈퇴'}
            </button>
          </div>
        </fieldset>
      </form>
    </dialog>
  )
}

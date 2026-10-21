import { useEffect, useId, useRef, useState } from 'react'
import { Activity, X, Zap } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { useCheckCondition } from '@/api/dashboard'

const QUESTIONS = [
  {
    name: 'sleepHours',
    label: '어젯밤 수면 시간',
    options: [
      { value: 5, label: '5시간 이하' },
      { value: 6, label: '6시간' },
      { value: 7, label: '7시간' },
      { value: 8, label: '8시간 이상' },
    ],
  },
  {
    name: 'fatigue',
    label: '지금 피로도',
    options: [
      { value: 'LOW', label: '가벼움' },
      { value: 'MEDIUM', label: '보통' },
      { value: 'HIGH', label: '피곤함' },
    ],
  },
  {
    name: 'soreness',
    label: '근육통',
    options: [
      { value: 'NONE', label: '없음' },
      { value: 'MILD', label: '조금 있음' },
      { value: 'SEVERE', label: '심함' },
    ],
  },
  {
    name: 'availableMinutes',
    label: '오늘 운동 가능 시간',
    options: [
      { value: 15, label: '15분' },
      { value: 30, label: '30분' },
      { value: 45, label: '45분' },
      { value: 60, label: '60분' },
    ],
  },
]

const INITIAL = { sleepHours: 7, fatigue: 'MEDIUM', soreness: 'NONE', availableMinutes: 30 }

/** 30초 컨디션 체크. 4가지를 고르면 오늘의 운동·식단 코칭을 만든다 */
export function ConditionCheckDialog({ onClose }) {
  const dialogRef = useRef(null)
  const id = useId()
  const [condition, setCondition] = useState(INITIAL)
  const checkCondition = useCheckCondition()

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      await checkCondition.mutateAsync(condition)
      onClose()
    } catch {
      // 실패하면 선택값을 유지하고 에러를 보여준다
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault()
        if (!checkCondition.isPending) onClose()
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-xl backdrop:bg-black/40 md:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <h3 id={`${id}-title`} className="flex items-center gap-2 text-base font-bold">
          <Activity aria-hidden="true" className="h-5 w-5 text-emerald-600" />
          30초 컨디션 체크
        </h3>
        <button
          type="button"
          aria-label="컨디션 체크 닫기"
          disabled={checkCondition.isPending}
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} aria-busy={checkCondition.isPending}>
        <fieldset disabled={checkCondition.isPending} className="min-w-0 space-y-5 disabled:opacity-70">
          {QUESTIONS.map((question) => (
            <div key={question.name} role="group" aria-labelledby={`${id}-${question.name}`}>
              <p id={`${id}-${question.name}`} className="label">
                {question.label}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {question.options.map((option) => {
                  const selected = condition[question.name] === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setCondition((current) => ({ ...current, [question.name]: option.value }))}
                      className={`min-h-11 cursor-pointer rounded-xl border-2 px-2 py-2.5 text-sm font-semibold transition ${
                        selected ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </fieldset>

        {checkCondition.isError && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {getErrorMessage(checkCondition.error)}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} disabled={checkCondition.isPending} className="btn-secondary min-h-11">
            취소
          </button>
          <button type="submit" disabled={checkCondition.isPending} className="btn-primary min-h-11">
            <Zap aria-hidden="true" className="h-4 w-4" />
            {checkCondition.isPending ? '분석 중...' : '코칭 받기'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

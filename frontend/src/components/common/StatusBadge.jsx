import { EXPIRATION_LABEL, MEAL_PLAN_STATUS_LABEL } from '@/lib/labels'

const base = 'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold'

const EXPIRATION_STYLE = {
  EXPIRED: { badge: 'border-rose-200 bg-rose-100 text-rose-800', dot: 'bg-rose-500 animate-pulse' },
  TODAY: { badge: 'border-amber-300 bg-amber-100 text-amber-900', dot: 'bg-amber-500' },
  IMMINENT: { badge: 'border-orange-200 bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  NORMAL: { badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  UNKNOWN: { badge: 'border-gray-200 bg-gray-100 text-gray-700' },
}

/**
 * 재고 기한 상태 5단계 배지
 * @param {{ status: 'NORMAL'|'IMMINENT'|'TODAY'|'EXPIRED'|'UNKNOWN', date?: string }} props
 */
export function ExpirationBadge({ status, date }) {
  const style = EXPIRATION_STYLE[status] ?? EXPIRATION_STYLE.UNKNOWN
  return (
    <span className={`${base} ${style.badge}`}>
      {style.dot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />}
      {EXPIRATION_LABEL[status]}
      {date && status !== 'TODAY' ? ` (${date})` : ''}
    </span>
  )
}

const MEAL_PLAN_STYLE = {
  DRAFT: 'border-amber-200 bg-amber-50 text-amber-700',
  CONFIRMED: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  CANCELED: 'border-gray-300 bg-gray-100 text-gray-500',
}

/** @param {{ status: 'DRAFT'|'CONFIRMED'|'CANCELED' }} props */
export function MealPlanStatusBadge({ status }) {
  return <span className={`${base} ${MEAL_PLAN_STYLE[status]}`}>{MEAL_PLAN_STATUS_LABEL[status]}</span>
}

const SOURCE_STYLE = {
  AI_GENERATED: { label: 'AI 생성', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  LOCAL_FALLBACK: { label: '검증된 로컬 대체', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  SEED: { label: '기본 레시피', className: 'border-gray-200 bg-gray-50 text-gray-600' },
}

/**
 * 생성 모드 표기: AI 생성 / 검증된 로컬 대체
 * @param {{ source: 'AI_GENERATED'|'LOCAL_FALLBACK'|'SEED' }} props
 */
export function RecipeSourceBadge({ source }) {
  const { label, className } = SOURCE_STYLE[source]
  return <span className={`${base} ${className}`}>{label}</span>
}

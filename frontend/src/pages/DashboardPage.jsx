import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Flame,
  Info,
  Refrigerator,
  RefreshCw,
  ShoppingCart,
  SkipForward,
  Sparkles,
  TriangleAlert,
  UtensilsCrossed,
} from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { USE_MOCK, useDashboard, useRecordIntake } from '@/api/dashboard'
import { Spinner } from '@/components/common/Spinner'
import { ExpirationBadge, MealPlanStatusBadge, RecipeSourceBadge } from '@/components/common/StatusBadge'
import { addDays, formatKoreanDate, today } from '@/lib/date'
import { INTAKE_STATUS, MEAL_PLAN_STATUS, MEAL_TYPE } from '@/lib/enums'
import { formatQuantity } from '@/lib/format'
import { INTAKE_STATUS_LABEL, MEAL_TYPE_LABEL, SHOPPING_ITEM_STATUS_LABEL, STORAGE_LABEL } from '@/lib/labels'

const MEAL_ORDER = [MEAL_TYPE.BREAKFAST, MEAL_TYPE.LUNCH, MEAL_TYPE.DINNER]
const PREVIEW_LIMIT = 5

function DateNavigator({ date, onChange }) {
  const isToday = date === today()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <button type="button" aria-label="이전 날짜" onClick={() => onChange(addDays(date, -1))} className="btn-secondary min-h-11 px-3">
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <p className="min-w-32 text-center text-base font-bold text-gray-900" aria-live="polite">
          {formatKoreanDate(date)}
        </p>
        <button type="button" aria-label="다음 날짜" onClick={() => onChange(addDays(date, 1))} className="btn-secondary min-h-11 px-3">
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {!isToday && (
        <button type="button" onClick={() => onChange(today())} className="btn-secondary min-h-11 text-xs">
          오늘로 돌아가기
        </button>
      )}
    </div>
  )
}

function SummaryTiles({ meals, expiringLots }) {
  const confirmed = meals.filter((meal) => meal.status === MEAL_PLAN_STATUS.CONFIRMED)
  const eaten = confirmed.filter((meal) => meal.intakeStatus === INTAKE_STATUS.EATEN)
  const eatenCalories = eaten.reduce((sum, meal) => sum + Number(meal.recipe.calories ?? 0), 0)
  const caloriesEstimated = eaten.some((meal) => meal.recipe.nutritionEstimated)

  const tiles = [
    { label: '확정 식단', value: confirmed.length, unit: `/ ${MEAL_ORDER.length}끼` },
    { label: '먹은 끼니', value: eaten.length, unit: `/ ${confirmed.length}끼` },
    { label: caloriesEstimated ? '섭취 열량 (추정치)' : '섭취 열량', value: Math.round(eatenCalories), unit: 'kcal' },
    { label: '기한 임박·경과', value: expiringLots.length, unit: '개' },
  ]

  return (
    <section aria-label="오늘 요약" className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
      {tiles.map(({ label, value, unit }) => (
        <div key={label} className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-gray-900">
            {value}
            <span className="ml-1 text-sm font-medium text-gray-500">{unit}</span>
          </p>
        </div>
      ))}
    </section>
  )
}

/** 확정된 식단에만 먹음/건너뜀을 기록한다. 같은 상태를 다시 누르는 것은 막는다 (StatusTransition 규칙) */
function IntakeButtons({ meal, recordIntake }) {
  const isSaving = recordIntake.isPending && recordIntake.variables?.mealPlanId === meal.id
  const hasError = recordIntake.isError && recordIntake.variables?.mealPlanId === meal.id

  const options = [
    { status: INTAKE_STATUS.EATEN, icon: CircleCheck, selected: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
    { status: INTAKE_STATUS.SKIPPED, icon: SkipForward, selected: 'border-gray-400 bg-gray-100 text-gray-700' },
  ]

  return (
    <div className="space-y-2">
      <div role="group" aria-label={`${MEAL_TYPE_LABEL[meal.mealType]} 섭취 기록`} className="grid grid-cols-2 gap-2">
        {options.map(({ status, icon: Icon, selected }) => {
          const isSelected = meal.intakeStatus === status
          return (
            <button
              key={status}
              type="button"
              aria-pressed={isSelected}
              disabled={isSaving || isSelected}
              onClick={() => recordIntake.mutate({ mealPlanId: meal.id, intakeStatus: status })}
              className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition disabled:cursor-default ${
                isSelected ? selected : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {isSaving && recordIntake.variables?.intakeStatus === status ? '저장 중...' : INTAKE_STATUS_LABEL[status]}
            </button>
          )
        })}
      </div>
      {hasError && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {getErrorMessage(recordIntake.error)}
        </p>
      )}
    </div>
  )
}

function MealCard({ mealType, meal, recordIntake }) {
  if (!meal) {
    return (
      <article className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center">
        <p className="text-sm font-bold text-gray-700">{MEAL_TYPE_LABEL[mealType]}</p>
        <p className="mt-1 text-xs text-gray-500">아직 추천받은 식단이 없어요.</p>
        <Link to="/recommend" className="btn-secondary mt-4 min-h-11 text-xs">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          추천받기
        </Link>
      </article>
    )
  }

  const { recipe } = meal
  const isCanceled = meal.status === MEAL_PLAN_STATUS.CANCELED

  return (
    <article className={`flex min-w-0 flex-col gap-4 rounded-2xl border border-gray-200 p-5 ${isCanceled ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-900">{MEAL_TYPE_LABEL[mealType]}</span>
        <MealPlanStatusBadge status={meal.status} />
        <RecipeSourceBadge source={recipe.source} />
      </div>

      <div className="min-w-0">
        <Link
          to={`/recipes/${recipe.id}?servings=${meal.servings}`}
          className={`break-all text-lg font-bold hover:text-emerald-700 hover:underline ${isCanceled ? 'text-gray-500 line-through' : 'text-gray-900'}`}
        >
          {recipe.name}
        </Link>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            {recipe.cookTimeMin}분
          </span>
          {recipe.calories != null && (
            <span className="inline-flex items-center gap-1">
              <Flame aria-hidden="true" className="h-3.5 w-3.5" />
              {Math.round(Number(recipe.calories) * meal.servings)}kcal{recipe.nutritionEstimated && ' (추정치)'}
            </span>
          )}
          <span>{meal.servings}인분</span>
        </p>
        {meal.recommendationReason && <p className="mt-2 text-sm leading-6 text-gray-600">{meal.recommendationReason}</p>}
      </div>

      <div className="mt-auto">
        {meal.status === MEAL_PLAN_STATUS.CONFIRMED && <IntakeButtons meal={meal} recordIntake={recordIntake} />}
        {meal.status === MEAL_PLAN_STATUS.DRAFT && (
          <Link to="/recommend" className="flex min-h-11 items-center justify-between rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100">
            식단을 확정하면 섭취를 기록할 수 있어요
            <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
          </Link>
        )}
        {isCanceled && <p className="text-xs text-gray-500">취소된 식단이에요.</p>}
      </div>
    </article>
  )
}

function SectionHeader({ icon: Icon, title, description, to, linkLabel }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <Link to={to} className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
        {linkLabel}
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

function ExpiringLotsCard({ lots }) {
  return (
    <section className="card space-y-4">
      <SectionHeader icon={Refrigerator} title="기한 임박 재료" description="3일 안에 쓰거나 확인이 필요한 재료예요." to="/fridge" linkLabel="냉장고" />
      {lots.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">기한이 임박한 재료가 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {lots.slice(0, PREVIEW_LIMIT).map((lot) => (
            <li key={lot.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 px-4 py-3">
              <span className="min-w-0">
                <span className="break-all text-sm font-semibold text-gray-900">{lot.ingredientName}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {formatQuantity(lot.quantity, lot.unit)} · {STORAGE_LABEL[lot.storageLocation]}
                </span>
              </span>
              <ExpirationBadge status={lot.expirationStatus} date={lot.expiryDate} />
            </li>
          ))}
        </ul>
      )}
      {lots.length > PREVIEW_LIMIT && <p className="text-xs text-gray-500">외 {lots.length - PREVIEW_LIMIT}개는 냉장고에서 확인해 주세요.</p>}
    </section>
  )
}

function ShortagesCard({ items }) {
  return (
    <section className="card space-y-4">
      <SectionHeader icon={ShoppingCart} title="장보기 부족분" description="확정한 식단에 필요한데 냉장고에 부족한 재료예요." to="/shopping" linkLabel="장보기" />
      {items.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">부족한 재료가 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, PREVIEW_LIMIT).map((item) => {
            const remaining = Math.max(0, Number(item.requiredQty) - Number(item.purchasedQty))
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 px-4 py-3">
                <span className="min-w-0">
                  <span className="break-all text-sm font-semibold text-gray-900">{item.ingredientName}</span>
                  <span className="ml-2 text-xs text-gray-500">{formatQuantity(remaining, item.unit)} 더 필요</span>
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">{SHOPPING_ITEM_STATUS_LABEL[item.status]}</span>
              </li>
            )
          })}
        </ul>
      )}
      {items.length > PREVIEW_LIMIT && <p className="text-xs text-gray-500">외 {items.length - PREVIEW_LIMIT}개는 장보기에서 확인해 주세요.</p>}
    </section>
  )
}

export function DashboardPage() {
  const [date, setDate] = useState(today)
  const { data, isPending, isError, error, isFetching, refetch } = useDashboard(date)
  const recordIntake = useRecordIntake()

  const meals = data?.meals ?? []
  const mealByType = Object.fromEntries(meals.map((meal) => [meal.mealType, meal]))

  return (
    <div className="space-y-6">
      {USE_MOCK && (
        <p className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-800">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          대시보드 API 연결 전이라 예시 데이터를 보여주고 있어요. 섭취 기록은 새로고침하면 초기화돼요.
        </p>
      )}

      <DateNavigator date={date} onChange={setDate} />

      {isPending ? (
        <div className="card flex min-h-60 flex-col items-center justify-center gap-4">
          <Spinner />
          <p className="text-sm text-gray-500">오늘의 식단을 불러오고 있어요.</p>
        </div>
      ) : isError && !data ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="flex items-start gap-2 text-sm text-rose-700">
            <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {getErrorMessage(error)}
          </p>
          <button type="button" onClick={() => refetch()} disabled={isFetching} className="btn-secondary min-h-11 text-xs">
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? '불러오는 중...' : '다시 시도'}
          </button>
        </div>
      ) : (
        <>
          <SummaryTiles meals={meals} expiringLots={data.expiringLots} />

          <section aria-labelledby="today-meals" className="space-y-3">
            <div className="flex items-center gap-2">
              <UtensilsCrossed aria-hidden="true" className="h-5 w-5 text-emerald-600" />
              <h3 id="today-meals" className="text-base font-bold text-gray-900">오늘의 식단</h3>
            </div>
            {meals.length === 0 ? (
              <div className="card flex flex-col items-center px-5 py-10 text-center">
                <Sparkles aria-hidden="true" className="mb-3 h-10 w-10 text-emerald-300" />
                <p className="text-base font-bold text-gray-900">아직 이 날의 식단이 없어요</p>
                <p className="mt-2 text-sm text-gray-500">냉장고 재료로 AI가 3끼를 추천해 드려요.</p>
                <Link
                  to="/recommend"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700"
                >
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  AI 식단 추천받기
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {MEAL_ORDER.map((mealType) => (
                  <MealCard key={mealType} mealType={mealType} meal={mealByType[mealType]} recordIntake={recordIntake} />
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <ExpiringLotsCard lots={data.expiringLots} />
            <ShortagesCard items={data.shortages} />
          </div>
        </>
      )}
    </div>
  )
}

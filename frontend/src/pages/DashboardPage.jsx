import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CircleCheck,
  Clock,
  Dumbbell,
  Flame,
  Info,
  Leaf,
  Refrigerator,
  RefreshCw,
  Scale,
  ShoppingCart,
  SkipForward,
  Sparkles,
  TriangleAlert,
  UtensilsCrossed,
  Zap,
} from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import {
  MOCK_AREAS,
  useCoaching,
  useDashboard,
  useProfileSummary,
  useRecordIntake,
  useSetWorkoutCompleted,
  useTodayWorkout,
  useWeightSummary,
} from '@/api/dashboard'
import { ConditionCheckDialog } from '@/components/dashboard/ConditionCheckDialog'
import { Spinner } from '@/components/common/Spinner'
import { ExpirationBadge, MealPlanStatusBadge, RecipeSourceBadge } from '@/components/common/StatusBadge'
import { addDays, today } from '@/lib/date'
import { INTAKE_STATUS, MEAL_PLAN_STATUS, MEAL_TYPE } from '@/lib/enums'
import { formatQuantity } from '@/lib/format'
import { INTAKE_STATUS_LABEL, MEAL_TYPE_LABEL, STORAGE_LABEL } from '@/lib/labels'

const MEAL_ORDER = [MEAL_TYPE.BREAKFAST, MEAL_TYPE.LUNCH, MEAL_TYPE.DINNER]
const PREVIEW_LIMIT = 5
const GOAL_TEXT = { LOSE: '체중 감량', MAINTAIN: '체중 유지', GAIN: '근육 증량' }
const MOCK_AREA_LABEL = { dashboard: '식단', profile: '프로필', workout: '운동', weight: '체중', coaching: 'AI 코칭' }
const FATIGUE_LABEL = { LOW: '피로도 낮음', MEDIUM: '피로도 보통', HIGH: '피로도 높음' }
const SORENESS_LABEL = { NONE: '근육통 없음', MILD: '근육통 조금', SEVERE: '근육통 심함' }

/* ───────────── 공통 카드 조각 ───────────── */

function CardHeader({ icon: Icon, title, description, to, linkLabel }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      {to && (
        <Link to={to} className="inline-flex min-h-11 shrink-0 items-center gap-0.5 px-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
          {linkLabel}
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}

function CardLoading() {
  return (
    <div className="flex min-h-24 items-center justify-center">
      <Spinner className="h-6 w-6" />
    </div>
  )
}

function CardError({ error, onRetry }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5">
      <p className="flex items-start gap-2 text-sm text-rose-700">
        <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        {getErrorMessage(error)}
      </p>
      <button type="button" onClick={onRetry} className="btn-secondary min-h-11 text-xs">
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        다시 시도
      </button>
    </div>
  )
}

function EmptyText({ children }) {
  return <p className="rounded-xl bg-gray-50 px-4 py-5 text-center text-xs text-gray-500">{children}</p>
}

/* ───────────── 오늘의 AI 코칭 ───────────── */

function AiCoachingCard() {
  const [showCheck, setShowCheck] = useState(false)
  const { data: coaching, isPending } = useCoaching()

  return (
    <section className="rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950 p-5 text-white md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <Zap aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h3 className="flex flex-wrap items-center gap-2 text-base font-bold">
              오늘의 AI 코칭
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">AI Trainer</span>
            </h3>
            <p className="mt-0.5 text-xs text-gray-400">오늘 무엇을 할지 실시간 컨디션과 냉장고 재고로 결정해 드려요.</p>
          </div>
        </div>
        {coaching && (
          <button
            type="button"
            onClick={() => setShowCheck(true)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 px-3 text-xs font-semibold text-gray-200 hover:bg-white/10"
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            컨디션 다시 체크
          </button>
        )}
      </div>

      {isPending ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : coaching ? (
        <div className="mt-6 space-y-4">
          <ul className="flex flex-wrap gap-2 text-xs">
            {[
              `수면 ${coaching.condition.sleepHours}시간${coaching.condition.sleepHours >= 8 ? ' 이상' : ''}`,
              FATIGUE_LABEL[coaching.condition.fatigue],
              SORENESS_LABEL[coaching.condition.soreness],
              `가능 시간 ${coaching.condition.availableMinutes}분`,
            ].map((chip) => (
              <li key={chip} className="rounded-full bg-white/10 px-3 py-1 text-gray-200">
                {chip}
              </li>
            ))}
          </ul>
          <p className="text-base font-bold leading-7">{coaching.summary}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs text-emerald-300">추천 운동</p>
              <p className="mt-1 text-sm font-semibold">{coaching.workout}</p>
              <Link to="/workout" className="mt-3 inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200">
                운동 루틴 보기 <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs text-emerald-300">추천 식단</p>
              <p className="mt-1 text-sm font-semibold">{coaching.meal}</p>
              <Link to="/recommend" className="mt-3 inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200">
                냉장고 맞춤 식단 받기 <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center px-2 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-400">
            <Sparkles aria-hidden="true" className="h-6 w-6" />
          </span>
          <p className="mt-4 text-lg font-bold">오늘의 운동과 식단, AI가 정해드립니다</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-gray-300">
            수면 시간, 피로도, 근육통, 오늘 가용 시간만 30초 체크해 주세요. 오늘 최적의{' '}
            <span className="font-semibold text-emerald-400">추천 운동 루틴</span>과{' '}
            <span className="font-semibold text-emerald-400">냉장고 맞춤 식단</span>을 바로 완성합니다.
          </p>
          <button
            type="button"
            onClick={() => setShowCheck(true)}
            className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-emerald-300"
          >
            <Zap aria-hidden="true" className="h-4 w-4" />
            30초 컨디션 체크 시작하기
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
            {['수면 & 피로도 맞춤', 'WHO 주 150분 기준', '냉장고 파먹기 연동'].map((item) => (
              <li key={item} className="inline-flex items-center gap-1">
                <CircleCheck aria-hidden="true" className="h-3.5 w-3.5 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showCheck && <ConditionCheckDialog onClose={() => setShowCheck(false)} />}
    </section>
  )
}

/* ───────────── 인사 배너 ───────────── */

function GreetingCard() {
  const { data: profile } = useProfileSummary()
  const goal = GOAL_TEXT[profile?.goal]

  return (
    <section className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white md:p-6">
      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold">
        <Leaf aria-hidden="true" className="h-3 w-3" />
        맞춤 헬스 파트너
      </span>
      <p className="mt-3 text-xl font-extrabold md:text-2xl">안녕하세요{profile ? `, ${profile.nickname}님` : ''}!</p>
      <p className="mt-1 text-sm text-emerald-50">
        {goal ? `${goal}과 건강한 식습관을 위해 오늘도 밀핏이 함께합니다.` : '건강한 식습관을 위해 오늘도 밀핏이 함께합니다.'}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to={`/recommend?date=${addDays(today(), 1)}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
        >
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          내일 식단 AI 추천받기
        </Link>
        <Link
          to="/fridge"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/20"
        >
          <Refrigerator aria-hidden="true" className="h-4 w-4" />
          냉장고 재료 등록
        </Link>
      </div>
    </section>
  )
}

/* ───────────── 오늘의 식단 ───────────── */

/** 확정된 식단에만 먹음/건너뜀을 기록한다. 같은 상태를 다시 누르는 것은 막는다 (StatusTransition 규칙) */
function IntakeButtons({ meal, recordIntake }) {
  const isSaving = recordIntake.isPending && recordIntake.variables?.mealPlanId === meal.id
  const options = [
    { status: INTAKE_STATUS.EATEN, icon: CircleCheck, selected: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
    { status: INTAKE_STATUS.SKIPPED, icon: SkipForward, selected: 'border-gray-400 bg-gray-100 text-gray-700' },
  ]

  return (
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
            className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-xl border-2 px-2 text-xs font-semibold transition disabled:cursor-default ${
              isSelected ? selected : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {isSaving && recordIntake.variables?.intakeStatus === status ? '저장 중...' : INTAKE_STATUS_LABEL[status]}
          </button>
        )
      })}
    </div>
  )
}

function MealRow({ mealType, meal, recordIntake }) {
  if (!meal) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-3">
        <span className="text-sm font-semibold text-gray-500">{MEAL_TYPE_LABEL[mealType]} · 식단 없음</span>
        <Link to="/recommend" className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-emerald-700">
          추천받기 <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </li>
    )
  }

  const { recipe } = meal
  const hasError = recordIntake.isError && recordIntake.variables?.mealPlanId === meal.id

  return (
    <li className="space-y-3 rounded-xl border border-gray-100 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">{MEAL_TYPE_LABEL[mealType]}</span>
        <MealPlanStatusBadge status={meal.status} />
        <RecipeSourceBadge source={recipe.source} />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/recipes/${recipe.id}?servings=${meal.servings}`}
            className={`break-all text-base font-bold hover:text-emerald-700 hover:underline ${
              meal.status === MEAL_PLAN_STATUS.CANCELED ? 'text-gray-400 line-through' : 'text-gray-900'
            }`}
          >
            {recipe.name}
          </Link>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
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
        </div>
        <div className="w-full sm:w-56">
          {meal.status === MEAL_PLAN_STATUS.CONFIRMED && <IntakeButtons meal={meal} recordIntake={recordIntake} />}
          {meal.status === MEAL_PLAN_STATUS.DRAFT && (
            <Link
              to="/recommend"
              className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-amber-50 px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              확정하고 기록하기 <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
      {hasError && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {getErrorMessage(recordIntake.error)}
        </p>
      )}
    </li>
  )
}

function TodayMealsCard({ dashboard }) {
  const recordIntake = useRecordIntake()
  const meals = dashboard.data?.meals ?? []
  const mealByType = Object.fromEntries(meals.map((meal) => [meal.mealType, meal]))

  return (
    <section className="card space-y-4">
      <CardHeader icon={UtensilsCrossed} title="오늘의 식단" to="/recommend" linkLabel="주간 식단표" />
      {dashboard.isPending ? (
        <CardLoading />
      ) : dashboard.isError ? (
        <CardError error={dashboard.error} onRetry={() => dashboard.refetch()} />
      ) : meals.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center">
          <UtensilsCrossed aria-hidden="true" className="h-9 w-9 text-gray-300" />
          <p className="mt-3 text-sm font-bold text-gray-700">오늘 등록된 식단이 없습니다.</p>
          <p className="mt-1 text-xs text-gray-500">냉장고 재료를 활용한 최적의 식단을 AI로 추천받아 보세요.</p>
          <Link to="/recommend" className="btn-primary mt-4 min-h-11 text-xs">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            식단 추천받기
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {MEAL_ORDER.map((mealType) => (
            <MealRow key={mealType} mealType={mealType} meal={mealByType[mealType]} recordIntake={recordIntake} />
          ))}
        </ul>
      )}
    </section>
  )
}

/* ───────────── 오늘의 맞춤 운동 ───────────── */

function TodayWorkoutCard({ date }) {
  const { data: workout, isPending, isError, error, refetch } = useTodayWorkout(date)
  const setCompleted = useSetWorkoutCompleted()

  return (
    <section className="card space-y-4">
      <CardHeader icon={Dumbbell} title="오늘의 맞춤 운동" description={workout?.focus} to="/workout" linkLabel="전체 루틴 보기" />
      {isPending ? (
        <CardLoading />
      ) : isError ? (
        <CardError error={error} onRetry={() => refetch()} />
      ) : !workout ? (
        <EmptyText>오늘은 휴식일이에요. 가벼운 스트레칭으로 회복해 주세요.</EmptyText>
      ) : (
        <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">{workout.dayLabel}</span>
              <p className="mt-2 text-sm font-bold text-gray-900">{workout.title}</p>
            </div>
            <button
              type="button"
              aria-pressed={workout.completed}
              disabled={setCompleted.isPending}
              onClick={() => setCompleted.mutate({ date, completed: !workout.completed })}
              className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                workout.completed ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <CircleCheck aria-hidden="true" className="h-4 w-4" />
              {setCompleted.isPending ? '저장 중...' : workout.completed ? '운동 완료' : '운동 완료 체크'}
            </button>
          </div>
          <p className="text-xs font-semibold text-gray-700">주요 동작 (총 {workout.totalMinutes}분)</p>
          <ul className="divide-y divide-gray-100">
            {workout.exercises.map((exercise) => (
              <li key={exercise.name} className="flex items-center justify-between gap-3 py-2 text-xs">
                <span className="text-gray-700">• {exercise.name}</span>
                <span className="shrink-0 text-gray-500">
                  {exercise.sets}세트 × {exercise.reps}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/* ───────────── 오른쪽 열: 기한 임박 · 장바구니 · 체중 ───────────── */

function ExpiringLotsCard({ dashboard }) {
  const lots = dashboard.data?.expiringLots ?? []
  return (
    <section className="card space-y-4">
      <CardHeader icon={TriangleAlert} title="기한 임박 식재료" to="/fridge" linkLabel="냉장고" />
      {dashboard.isPending ? (
        <CardLoading />
      ) : dashboard.isError ? (
        <CardError error={dashboard.error} onRetry={() => dashboard.refetch()} />
      ) : lots.length === 0 ? (
        <EmptyText>기한이 임박한 재료가 없어요.</EmptyText>
      ) : (
        <ul className="space-y-2">
          {lots.slice(0, PREVIEW_LIMIT).map((lot) => (
            <li key={lot.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 px-3.5 py-3">
              <div className="min-w-0">
                <p className="break-all text-sm font-semibold text-gray-900">{lot.ingredientName}</p>
                <p className="text-xs text-gray-500">
                  {formatQuantity(lot.quantity, lot.unit)} ({STORAGE_LABEL[lot.storageLocation]})
                </p>
              </div>
              <ExpirationBadge status={lot.expirationStatus} date={lot.expiryDate} />
            </li>
          ))}
          {lots.length > PREVIEW_LIMIT && <li className="text-xs text-gray-500">외 {lots.length - PREVIEW_LIMIT}개</li>}
        </ul>
      )}
    </section>
  )
}

function ShortagesCard({ dashboard }) {
  const items = dashboard.data?.shortages ?? []
  return (
    <section className="card space-y-4">
      <CardHeader icon={ShoppingCart} title="장바구니 부족분" to="/shopping" linkLabel="목록 보기" />
      {dashboard.isPending ? (
        <CardLoading />
      ) : dashboard.isError ? (
        <CardError error={dashboard.error} onRetry={() => dashboard.refetch()} />
      ) : items.length === 0 ? (
        <EmptyText>필요한 추가 장보기 항목이 없습니다.</EmptyText>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, PREVIEW_LIMIT).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3.5 py-3">
              <span className="min-w-0 break-all text-sm font-semibold text-gray-900">{item.ingredientName}</span>
              <span className="shrink-0 text-xs text-gray-500">
                {formatQuantity(item.remainingQty ?? Math.max(0, Number(item.requiredQty) - Number(item.purchasedQty)), item.unit)} 필요
              </span>
            </li>
          ))}
          {items.length > PREVIEW_LIMIT && <li className="text-xs text-gray-500">외 {items.length - PREVIEW_LIMIT}개</li>}
        </ul>
      )}
    </section>
  )
}

function WeightCard() {
  const { data: weight, isPending } = useWeightSummary()
  return (
    <section className="card space-y-3">
      <CardHeader icon={Scale} title="체중 추이" to="/mypage" linkLabel="기록하기" />
      {isPending ? (
        <CardLoading />
      ) : !weight ? (
        <EmptyText>아직 체중 기록이 없어요.</EmptyText>
      ) : (
        <>
          <div className="flex items-end justify-between gap-2">
            <p className="text-2xl font-extrabold text-gray-900">
              {weight.currentKg}
              <span className="ml-1 text-sm font-medium text-gray-500">kg</span>
            </p>
            {weight.targetKg != null && (
              <p className="text-xs text-gray-500">
                목표 <span className="font-bold text-gray-800">{weight.targetKg}kg</span>
              </p>
            )}
          </div>
          <p className="text-xs leading-5 text-gray-500">
            체중은 수분과 근육량에 따라 하루 1~2kg 달라질 수 있어요. 단기 숫자보다 꾸준한 흐름을 봐 주세요.
          </p>
        </>
      )}
    </section>
  )
}

/* ───────────── 페이지 ───────────── */

export function DashboardPage() {
  const date = today()
  const dashboard = useDashboard(date)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {MOCK_AREAS.length > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {MOCK_AREAS.map((area) => MOCK_AREA_LABEL[area]).join(' · ')}은(는) API 연결 전이라 예시 데이터예요. 기한 임박 식재료와 장바구니는 실제 데이터예요.
        </p>
      )}

      <AiCoachingCard />
      <GreetingCard />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <TodayMealsCard dashboard={dashboard} />
          <TodayWorkoutCard date={date} />
        </div>
        <div className="min-w-0 space-y-6">
          <ExpiringLotsCard dashboard={dashboard} />
          <ShortagesCard dashboard={dashboard} />
          <WeightCard />
        </div>
      </div>
    </div>
  )
}

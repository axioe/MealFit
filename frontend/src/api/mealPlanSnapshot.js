export function mergeMealResponse(previous, result, action, date) {
  if (action === 'recommend') return result
  const plan = action === 'confirm' ? result.mealPlan : result
  const others = (previous?.mealPlans ?? []).filter((row) => row.mealType !== plan.mealType)
  return { planDate: date, mealPlans: [...others, plan] }
}

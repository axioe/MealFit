/** 서버의 공유 값을 각 탭의 입력값으로 변환합니다. */
export function createProfileForm({ body, trainer, diet, fitness, tests }) {
  return {
    trainerAge: trainer.age ?? "",
    trainerHeight: trainer.height ?? "",
    trainerWeight: trainer.currentWeight ?? "",
    trainerGoal: trainer.workoutGoal ?? "",
    trainerLevel: trainer.workoutLevel ?? "",
    trainerEnvironment: trainer.environment ?? "",
    trainerEquipment: trainer.equipment,
    trainerAvailableTime: trainer.workoutMinutes ?? "",
    trainerInjuries: trainer.injuries,
    trainerAllergiesText: trainer.allergies.join(", "),
    trainerDislikedFoodsText: trainer.excludedIngredients.join(", "),
    trainerDietType: trainer.dietType ?? "",
    trainerBudget: trainer.mealBudget ?? "",
    nickname: body.nickname,
    age: body.age ?? "",
    height: body.height ?? "",
    currentWeight: body.currentWeight ?? "",
    targetWeight: body.targetWeight ?? "",
    gender: body.gender ?? "",
    activityLevel: body.activityLevel ?? "",
    dietGoal: ({ LOSE: "loss", MAINTAIN: "maintain", GAIN: "gain" })[diet.goal] ?? "",
    allergiesText: diet.allergies.join(", "),
    dislikedFoodsText: diet.excludedIngredients.join(", "),
    preferredFoodsText: diet.preferredFoods.join(", "),
    cookTime: diet.cookTimeMin ?? "",
    defaultServings: diet.defaultServings ?? "",
    budgetPerMeal: diet.mealBudget ?? "",
    prioritizeFridge: diet.prioritizeFridge ?? false,
    fitnessGoal: fitness.workoutGoal ?? "",
    experience: fitness.workoutLevel ?? "",
    equipment: fitness.equipment,
    daysPerWeek: fitness.daysPerWeek ?? "",
    durationMinutes: fitness.workoutMinutes ?? "",
    uncomfortableAreasText: fitness.injuries.join(", "),
    restingHeartRate: tests.restingHeartRate ?? "",
    pushups: tests.pushups ?? "",
    squat30s: tests.squat30s ?? "",
    plankSeconds: tests.plankSeconds ?? "",
  }
}

/** 빈칸은 미설정(null), 0은 실제 측정값으로 유지합니다. */
function numberOrNull(value) { return value === '' ? null : Number(value) }
function optional(value) { return value || null }
export function parseProfileItems(text) {
  return [...new Set(text.split(',').map((item) => item.trim()).filter(Boolean))]
}

/** 선택한 탭의 값만 전송해 다른 탭의 설정을 지우지 않습니다. */
export function buildProfileSectionBody(section, form) {
  const n = numberOrNull
  const items = parseProfileItems
  if (section === 'common') return {
    nickname: form.nickname.trim(), age: n(form.age), height: n(form.height),
    currentWeight: n(form.currentWeight), targetWeight: n(form.targetWeight),
    gender: optional(form.gender), activityLevel: optional(form.activityLevel),
  }
  if (section === 'trainer') {
    if (!form.trainerGoal || !form.trainerLevel) throw new Error('운동 목적과 운동 수준을 선택해 주세요.')
    return {
      age: n(form.trainerAge), height: n(form.trainerHeight), currentWeight: n(form.trainerWeight),
      workoutGoal: form.trainerGoal, workoutLevel: form.trainerLevel,
      environment: optional(form.trainerEnvironment), equipment: form.trainerEquipment,
      workoutMinutes: n(form.trainerAvailableTime), injuries: form.trainerInjuries,
      dietType: optional(form.trainerDietType), mealBudget: n(form.trainerBudget),
      allergies: items(form.trainerAllergiesText), excludedIngredients: items(form.trainerDislikedFoodsText),
    }
  }
  if (section === 'diet') return {
    goal: ({ loss: 'LOSE', maintain: 'MAINTAIN', gain: 'GAIN' })[form.dietGoal] ?? null,
    cookTimeMin: n(form.cookTime), mealBudget: n(form.budgetPerMeal),
    allergies: items(form.allergiesText), excludedIngredients: items(form.dislikedFoodsText),
    preferredFoods: items(form.preferredFoodsText), defaultServings: n(form.defaultServings),
    prioritizeFridge: form.prioritizeFridge,
  }
  if (section === 'fitness') return {
    workoutGoal: optional(form.fitnessGoal), workoutLevel: optional(form.experience),
    equipment: form.equipment, daysPerWeek: n(form.daysPerWeek),
    workoutMinutes: n(form.durationMinutes), injuries: items(form.uncomfortableAreasText),
  }
  if (section === 'tests') return {
    restingHeartRate: n(form.restingHeartRate), pushups: n(form.pushups),
    squat30s: n(form.squat30s), plankSeconds: n(form.plankSeconds),
  }
  throw new Error('저장할 탭을 확인해 주세요.')
}

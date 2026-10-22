import { quickCookingExamples } from './quickCooking.js'
import { prepareQuickCookingInput, adaptMockQuickRecipes } from './quickCookingView.js'
import { prepareActualUsageDraft, usageBaseline } from './actualUsage.js'

// 서버 계약이 아닌 프론트엔드 추천 입력 모델이다.
export function prepareQuickRecommendationInput(groups, preferences) {
  const input = prepareQuickCookingInput(groups, preferences)
  if (!input.ingredients.length) throw new Error('사용할 냉장고 재료를 선택해 주세요.')
  return { ...input, ingredients: input.ingredients.map((item, index) => ({ ...item,
    inventoryReferences: groups[index].lots.map((lot) => ({ lotId: lot.id, quantity: lot.quantity,
      unit: lot.unit, expiryDate: lot.expiryDate ?? null, storageLocation: lot.storageLocation })),
  })) }
}

export function normalizeQuickRecipes(recipes, source) {
  if (!['mock', 'server'].includes(source)) throw new Error('추천 데이터의 출처를 확인할 수 없어요.')
  if (!Array.isArray(recipes)) throw new Error('추천 결과 형식을 확인할 수 없어요.')
  return recipes.map((recipe, index) => {
    if (!recipe || typeof recipe.name !== 'string' || !recipe.name.trim()) throw new Error('요리 이름을 확인할 수 없어요.')
    return { key: `${source}:${index}`, id: recipe.id ?? null, source, recipeId: null, mealPlanId: null,
      name: recipe.name, description: typeof recipe.description === 'string' ? recipe.description : null,
      servings: Number.isInteger(recipe.servings) && recipe.servings > 0 ? recipe.servings : null,
      cookTimeMin: Number.isFinite(recipe.cookTimeMin) && recipe.cookTimeMin > 0 ? recipe.cookTimeMin : null,
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.map((item) => ({
        ingredientName: typeof item.ingredientName === 'string' ? item.ingredientName : '',
        quantity: item.quantity ?? null, unit: typeof item.unit === 'string' ? item.unit : '',
      })) : [],
      steps: Array.isArray(recipe.steps) ? recipe.steps.filter((step) => typeof step === 'string' && step.trim()) : [],
    }
  })
}

// 실제 API가 확정되면 이 서비스의 호출부와 응답 어댑터를 교체한다.
export function loadQuickRecommendations(groups, preferences, source = 'mock') {
  if (source !== 'mock') throw new Error('실제 15분 요리 추천 API는 아직 연결되지 않았어요.')
  const input = prepareQuickRecommendationInput(groups, preferences)
  const recipes = normalizeQuickRecipes(quickCookingExamples(), 'mock')
  return { source: 'mock', input, recipes: adaptMockQuickRecipes(recipes, groups) }
}

export function quickUsageBaseline(recipe) {
  return usageBaseline({ ingredients: recipe.ingredients.map((item) => ({ ...item, requiredQty: item.quantity })) })
}

export function quickCookingAvailability() {
  return { canComplete: false, message: '요리 준비는 할 수 있지만, 이 추천 요리의 냉장고 재고 자동 반영 기능은 준비 중이에요.' }
}

export function prepareQuickUsageDraft(recipe, rows, analysis) {
  return prepareActualUsageDraft({ source: recipe.source, recommendationKey: recipe.key,
    recipeId: null, mealPlanId: null, servings: recipe.servings }, rows, analysis)
}

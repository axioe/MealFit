import { compareRecipeIngredient, RECIPE_STOCK_STATUS } from './recipeInventory.js'

export function prepareQuickCookingInput(groups, { servings, maxCookTimeMin }) {
  if (!Number.isInteger(Number(servings)) || Number(servings) < 1 || Number(servings) > 10
    || !Number.isInteger(Number(maxCookTimeMin)) || Number(maxCookTimeMin) < 1 || Number(maxCookTimeMin) > 15) {
    throw new Error('인분은 1~10, 조리 시간은 1~15분으로 입력해 주세요.')
  }
  return { servings: Number(servings), maxCookTimeMin: Number(maxCookTimeMin),
    ingredients: groups.map((group) => ({ ingredientName: group.ingredientName, quantity: group.quantity, unit: group.unit, lotIds: group.lots.map((lot) => lot.id) })),
  }
}

// 화면 모델이며 서버 응답 계약은 백엔드 협의 후 연결한다.
export function adaptMockQuickRecipes(recipes, groups) {
  return recipes.map((recipe, index) => ({
    ...recipe, rank: index + 1, source: 'mock', recipeId: null,
    comparisons: recipe.ingredients.map((ingredient) => ({ ...ingredient, ...compareRecipeIngredient(ingredient, groups) })),
  }))
}

export function splitQuickIngredients(comparisons) {
  return {
    available: comparisons.filter((item) => [RECIPE_STOCK_STATUS.SUFFICIENT, RECIPE_STOCK_STATUS.SHORTAGE].includes(item.status)),
    missing: comparisons.filter((item) => [RECIPE_STOCK_STATUS.SHORTAGE, RECIPE_STOCK_STATUS.NONE].includes(item.status)),
    incomparable: comparisons.filter((item) => [RECIPE_STOCK_STATUS.DIFFERENT_UNIT, RECIPE_STOCK_STATUS.UNKNOWN].includes(item.status)),
  }
}

export function quickRecipeGrid(count) {
  return count === 1 ? 'grid gap-4' : count === 2 ? 'grid gap-4 md:grid-cols-2' : 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
}

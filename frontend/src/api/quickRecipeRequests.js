import { normalizeQuickRecipes } from './quickCookingService.js'

export function prepareServerQuickInput(groups, maxCookingMinutes) {
  const selectedLotIds = [...new Set(groups.flatMap((group) => group.lots.map((lot) => lot.id)))]
  if (!selectedLotIds.length || selectedLotIds.length > 100 || selectedLotIds.some((id) => !/^[1-9]\d*$/.test(String(id)))) throw new Error('현재 냉장고 재료를 다시 선택해 주세요.')
  const minutes = Number(maxCookingMinutes)
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 15) throw new Error('최대 조리 시간은 1~15분으로 입력해 주세요.')
  return { selectedLotIds, maxCookingMinutes: minutes, recommendationCount: 3 }
}

export function adaptAiQuickResponse(response) {
  const invalid = () => { throw new Error('AI 추천 결과 형식을 확인하지 못했습니다. 다시 시도해 주세요.') }
  if (response?.source !== 'AI_GENERATED' || !Array.isArray(response.recipes) || !response.recipes.length) invalid()
  const statuses = { SUFFICIENT: 'sufficient', SHORTAGE: 'shortage', NONE: 'none', UNIT_MISMATCH: 'differentUnit' }
  const quantity = (value) => /^\d+(?:\.\d{1,3})?$/.test(String(value))
  const recipes = response.recipes.map((recipe) => {
    if (!recipe?.title?.trim() || !Number.isInteger(recipe.cookingMinutes) || recipe.cookingMinutes < 1 || recipe.cookingMinutes > 15
      || !Number.isInteger(recipe.servings) || recipe.servings < 1 || recipe.servings > 10 || !Array.isArray(recipe.ingredients) || !recipe.ingredients.length
      || !Array.isArray(recipe.steps) || !recipe.steps.length || recipe.steps.some((step) => typeof step !== 'string' || !step.trim())) invalid()
    const ingredients = recipe.ingredients.map((item) => {
      const stock = item.inventory
      if (!item.name?.trim() || !item.unit?.trim() || !quantity(item.quantity) || Number(item.quantity) <= 0 || !stock
        || !statuses[stock.status] || !quantity(stock.quantity) || !stock.unit?.trim() || typeof stock.hasIncompatibleUnits !== 'boolean'
        || (stock.status !== 'UNIT_MISMATCH' && !quantity(stock.shortageQuantity))) invalid()
      return { ingredientName: item.name, quantity: item.quantity, unit: item.unit, status: statuses[stock.status],
        stockText: `${stock.quantity}${stock.unit}`, availableText: `${stock.quantity}${stock.unit}`,
        shortageText: stock.shortageQuantity == null ? '' : `${stock.shortageQuantity}${stock.unit}`, hasIncompatibleUnits: stock.hasIncompatibleUnits }
    })
    return { name: recipe.title, cookTimeMin: recipe.cookingMinutes, servings: recipe.servings, description: recipe.description,
      reason: recipe.reason, ingredients, comparisons: ingredients, steps: recipe.steps }
  })
  return { source: 'AI_GENERATED', recipes: normalizeQuickRecipes(recipes, 'server').map((recipe, index) => ({ ...recipe,
    source: 'AI_GENERATED', rank: index + 1, reason: recipes[index].reason, comparisons: recipes[index].comparisons })) }
}

export function createQuickRecipesApi(client) {
  return { recommend: (body) => client.post('/quick-recipes/recommend', body).then((response) => adaptAiQuickResponse(response.data)) }
}

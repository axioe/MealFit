import test from 'node:test'
import assert from 'node:assert/strict'
import { selectableIngredients } from '../src/api/quickCooking.js'
import { prepareServerQuickInput, adaptAiQuickResponse } from '../src/api/quickRecipeRequests.js'
import { usageBaseline } from '../src/api/actualUsage.js'
import { cookingBody, createCookingIntent, validateCookingEvent, savePendingCooking, loadPendingCooking } from '../src/api/cookingUsage.js'
import { compareRecipeIngredient } from '../src/api/recipeInventory.js'
import { buildPurchase, buildStockIn } from '../src/api/shoppingValidation.js'

const lot = (id, quantity, extra = {}) => ({ id, ingredientName: '두부', quantity, unit: 'g', status: 'ACTIVE', expirationStatus: 'NORMAL', ...extra })
const inventory = { asOfDate: '2026-10-22', groups: [{ ingredientName: '두부', unit: 'g', lots: [lot(1, '100'), lot(2, '200'), lot(3, '999', { status: 'DEPLETED' }), lot(4, '500', { expirationStatus: 'EXPIRED' })] }] }

test('여러 로트 선택부터 AI 응답·수정 사용량 요청까지 수량과 단위를 유지한다', () => {
  const groups = selectableIngredients(inventory)
  assert.equal(groups[0].quantity, '300')
  assert.deepEqual(prepareServerQuickInput(groups, 15).selectedLotIds, [1, 2])
  const result = adaptAiQuickResponse({ source: 'AI_GENERATED', recipes: [{ title: '두부 구이', cookingMinutes: 10, servings: 2,
    ingredients: [{ name: '두부', quantity: '250', unit: 'g', inventory: { quantity: '300', unit: 'g', shortageQuantity: '0', status: 'SUFFICIENT', hasIncompatibleUnits: false } }], steps: ['익힌다.'] }] })
  const recipe = result.recipes[0]
  const rows = usageBaseline({ ingredients: recipe.ingredients.map(item => ({ ...item, requiredQty: item.quantity })) })
  rows[0].quantity = '120'
  assert.deepEqual(cookingBody('ingredients', { recipeName: recipe.name, servings: recipe.servings }, rows), {
    recipeName: '두부 구이', servings: 2, ingredients: [{ ingredientName: '두부', quantity: '120', unit: 'g' }],
  })
  assert.equal(recipe.ingredients[0].quantity, '250')
})

test('구매·부분 입고 응답으로 재고를 갱신하면 레시피 부족량도 같은 단위로 줄어든다', () => {
  const item = { id: 8, unit: 'g', purchasedQty: '20' }
  assert.equal(buildPurchase(item, '30').items[0].purchasedQty, 50)
  assert.equal(buildStockIn({ ...item, purchasedQty: 50 }, { quantity: '20', storageLocation: 'FRIDGE', expiryDate: '', minStockQty: '0' }).items[0].quantity, 20)
  const needed = { ingredientName: '두부', quantity: '350', unit: 'g' }
  assert.equal(compareRecipeIngredient(needed, inventory.groups).shortageText, '50g')
  const updated = structuredClone(inventory)
  updated.groups[0].lots.push(lot(5, '20'))
  assert.equal(compareRecipeIngredient(needed, updated.groups).shortageText, '30g')
})

test('네트워크 재시도는 사용자별 원래 payload·UUID를 유지하고 복원 응답을 신규 차감으로 바꾸지 않는다', () => {
  const entries = new Map()
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) }
  const intent = createCookingIntent(() => '00000000-0000-4000-8000-000000000021')
  const body = intent.prepare({ recipeName: '두부 구이', ingredients: [{ ingredientName: '두부', quantity: '120', unit: 'g' }] })
  savePendingCooking(storage, 1, body)
  assert.equal(loadPendingCooking(storage, 2), null)
  assert.deepEqual(loadPendingCooking(storage, 1), intent.prepare({ recipeName: '두부 구이', ingredients: body.ingredients }))
  const restored = { id: 7, mealPlanId: null, recipeName: '두부 구이', status: 'RESTORED', changes: [] }
  assert.equal(validateCookingEvent(restored, body, 'ingredients', 'complete').status, 'RESTORED')
})

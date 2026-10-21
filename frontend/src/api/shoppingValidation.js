export function quantityInMillis(value) {
  const text = String(value).trim()
  if (!/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(text)) return null
  const amount = Number(text)
  return Number.isFinite(amount) && amount >= 0 && amount <= 999999999.999
    ? Math.round(amount * 1000) : null
}

export function buildPurchase(item, value) {
  const added = quantityInMillis(value)
  const previous = quantityInMillis(item.purchasedQty)
  if (added == null || added <= 0 || previous == null || previous + added > 999999999999) {
    throw new Error('구매 수량은 0보다 커야 하며 합계는 정수 9자리, 소수 3자리 이내여야 합니다.')
  }
  return { items: [{ id: item.id, purchasedQty: (previous + added) / 1000 }] }
}

export function buildStockIn(item, form) {
  const quantity = quantityInMillis(form.quantity)
  const min = quantityInMillis(form.minStockQty.trim() === '' ? '0' : form.minStockQty)
  if (quantity == null || quantity <= 0 || quantity > quantityInMillis(item.purchasedQty)) {
    throw new Error('입고 수량은 0보다 크고 입고 대기 수량 이하여야 합니다. 소수는 3자리까지 입력해 주세요.')
  }
  if (min == null) throw new Error('최소 유지량은 0 이상, 정수 9자리와 소수 3자리 이내로 입력해 주세요.')
  if (!Object.values(STORAGE_LOCATION).includes(form.storageLocation)) throw new Error('보관 위치를 선택해 주세요.')
  if (form.expiryDate) {
    const date = new Date(form.expiryDate + 'T00:00:00Z')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.expiryDate) || Number.isNaN(date.getTime())
      || date.toISOString().slice(0, 10) !== form.expiryDate) throw new Error('올바른 소비기한을 입력해 주세요.')
  }
  return { items: [{ id: item.id, quantity: quantity / 1000, storageLocation: form.storageLocation,
    minStockQty: min / 1000, ...(form.expiryDate && { expiryDate: form.expiryDate }) }] }
}
import { STORAGE_LOCATION } from '../lib/enums.js'


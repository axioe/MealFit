import { EXPIRATION_STATUS, LOT_STATUS } from '../lib/enums.js'

export const RECIPE_STOCK_STATUS = Object.freeze({
  SUFFICIENT: 'sufficient', SHORTAGE: 'shortage', NONE: 'none', DIFFERENT_UNIT: 'differentUnit', UNKNOWN: 'unknown',
})
export const RECIPE_STOCK_LABEL = {
  sufficient: '충분함', shortage: '부족함', none: '재고 없음', differentUnit: '단위가 달라 비교할 수 없음', unknown: '재고 비교 불가',
}
const conversions = new Map([
  ['g', { unit: 'g', factor: 1n }], ['kg', { unit: 'g', factor: 1000n }],
  ['ml', { unit: 'ml', factor: 1n }], ['l', { unit: 'ml', factor: 1000n }],
])

function amount(value) {
  const text = String(value ?? '').trim()
  if (!/^\d+(?:\.\d{1,3})?$/.test(text)) return null
  const [whole, fraction = ''] = text.split('.')
  return BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'))
}

function normalized(quantity, unit) {
  const value = amount(quantity)
  if (value == null || typeof unit !== 'string' || !unit.trim()) return null
  const trimmed = unit.trim()
  const conversion = conversions.get(trimmed.toLowerCase())
  return { amount: value * (conversion?.factor ?? 1n), unit: conversion?.unit ?? trimmed }
}

function display(value, unit) {
  const integer = (value / 1000n).toLocaleString('ko-KR')
  const fraction = String(value % 1000n).padStart(3, '0').replace(/0+$/, '')
  return `${integer}${fraction ? '.' + fraction : ''}${unit}`
}

export function compareRecipeIngredient(ingredient, groups) {
  const needed = normalized(ingredient.quantity, ingredient.unit)
  if (!needed) return { status: RECIPE_STOCK_STATUS.UNKNOWN, stockText: '', hasIncompatibleUnits: false }
  const rawTotals = new Map()
  let available = 0n
  let hasIncompatibleUnits = false
  let expiredCount = 0
  let invalid = false
  // 장보기와 같은 이름·단위 정책으로 활성 재고만 비교한다.
  for (const group of groups ?? []) {
    for (const lot of group.lots ?? []) {
      if (String(lot.ingredientName ?? group.ingredientName).trim() !== ingredient.ingredientName.trim()
          || lot.status !== LOT_STATUS.ACTIVE) continue
      if (lot.expirationStatus === EXPIRATION_STATUS.EXPIRED) { expiredCount++; continue }
      const raw = amount(lot.quantity)
      const stock = normalized(lot.quantity, lot.unit)
      if (raw == null || !stock) { invalid = true; continue }
      if (raw === 0n) continue
      const unit = lot.unit.trim()
      rawTotals.set(unit, (rawTotals.get(unit) ?? 0n) + raw)
      if (stock.unit === needed.unit) available += stock.amount
      else hasIncompatibleUnits = true
    }
  }
  const status = invalid ? RECIPE_STOCK_STATUS.UNKNOWN
    : available >= needed.amount ? RECIPE_STOCK_STATUS.SUFFICIENT
    : available > 0n ? RECIPE_STOCK_STATUS.SHORTAGE
    : hasIncompatibleUnits ? RECIPE_STOCK_STATUS.DIFFERENT_UNIT : RECIPE_STOCK_STATUS.NONE
  return {
    status, stockText: [...rawTotals].map(([unit, quantity]) => display(quantity, unit)).join(' · '),
    availableText: display(available, needed.unit),
    shortageText: display(needed.amount > available ? needed.amount - available : 0n, needed.unit),
    hasIncompatibleUnits, expiredCount,
  }
}

export function validRecipeId(id) {
  return /^[1-9]\d*$/.test(String(id)) && BigInt(id) <= 9223372036854775807n
}

export function validRecipeServings(value) {
  return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value))
    && Number(value) >= 1 && Number(value) <= 2147483647
}

export function validRecipeDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false
  const date = new Date(value + 'T00:00:00Z')
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

import { EXPIRATION_STATUS, LOT_STATUS } from '../lib/enums.js'

export function selectableIngredients(data) {
  const grouped = new Map()
  for (const group of data?.groups ?? []) {
    for (const lot of group.lots ?? []) {
      if (lot.status !== LOT_STATUS.ACTIVE || lot.expirationStatus === EXPIRATION_STATUS.EXPIRED
        || (lot.expiryDate && data.asOfDate && lot.expiryDate < data.asOfDate)
        || !/^\d+(?:\.\d{1,3})?$/.test(String(lot.quantity)) || Number(lot.quantity) <= 0) continue
      const ingredientName = lot.ingredientName ?? group.ingredientName
      const unit = lot.unit ?? group.unit
      const key = JSON.stringify([ingredientName, unit])
      const item = grouped.get(key) ?? { key, ingredientName, unit, lots: [], amount: 0n }
      const [whole, fraction = ''] = String(lot.quantity).split('.')
      item.amount += BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'))
      item.lots.push(lot)
      grouped.set(key, item)
    }
  }
  return [...grouped.values()].map(({ amount, ...item }) => ({ ...item,
    quantity: `${amount / 1000n}${amount % 1000n ? '.' + String(amount % 1000n).padStart(3, '0').replace(/0+$/, '') : ''}`,
  }))
}

export function searchIngredients(items, search) {
  return items.filter((item) => item.ingredientName.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
}

// 개발용 예시는 실제 추천·저장 API를 호출하지 않는다.
export function quickCookingExamples() {
  return [
    { id: 'mock-egg', name: '달걀 양파 볶음', cookTimeMin: 10,
      ingredients: [{ ingredientName: '달걀', quantity: 2, unit: '개' }, { ingredientName: '양파', quantity: 50, unit: 'g' }],
      steps: ['양파를 얇게 썰고 달걀을 풀어 주세요.', '팬에 양파를 볶은 뒤 달걀을 넣어 익혀 주세요.'] },
    { id: 'mock-tofu', name: '두부 채소 구이', cookTimeMin: 15,
      ingredients: [{ ingredientName: '두부', quantity: 200, unit: 'g' }, { ingredientName: '애호박', quantity: 100, unit: 'g' }],
      steps: ['두부와 애호박을 먹기 좋은 크기로 썰어 주세요.', '팬에서 앞뒤로 충분히 익혀 주세요.'] },
  ]
}

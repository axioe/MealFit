const quantityFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 3 })

/** 숫자와 단위를 붙여 쓴다. (200, 'g') → '200g', ('1.500', 'L') → '1.5L' */
export function formatQuantity(quantity, unit) {
  return `${quantityFormatter.format(Number(quantity))}${unit}`
}

export const favoriteSupport = Object.freeze({ canPersist: false })

// 기본값은 등록 폼 입력에만 사용한다.
export const defaultFavorites = Object.freeze([
  ['egg', '달걀', '1', '개', '🥚'], ['tofu', '두부', '100', 'g', '🧊'],
  ['onion', '양파', '1', '개', '🧅'], ['potato', '감자', '1', '개', '🥔'],
  ['carrot', '당근', '1', '개', '🥕'], ['zucchini', '애호박', '1', '개', '🥒'],
  ['chicken', '닭가슴살', '100', 'g', '🍗'], ['milk', '우유', '200', 'mL', '🥛'],
].map(([id, ingredientName, quantity, unit, icon]) => Object.freeze({ id, ingredientName, quantity, unit, icon })))

// 날짜는 API와 'YYYY-MM-DD' 문자열로 주고받는다.
// new Date().toISOString()은 UTC 기준이라 한국 시간 오전 9시 전에는 어제 날짜가 나오므로 쓰지 않는다.

/** 로컬(한국) 기준 'YYYY-MM-DD' */
export function toLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function today() {
  return toLocalDateString()
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** addDays('2026-10-21', -1) → '2026-10-20' */
export function addDays(dateString, days) {
  const date = parseLocalDate(dateString)
  date.setDate(date.getDate() + days)
  return toLocalDateString(date)
}

const koreanDateFormatter = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

/** '2026-10-21' → '10월 21일 (수)' */
export function formatKoreanDate(dateString) {
  return koreanDateFormatter.format(parseLocalDate(dateString))
}

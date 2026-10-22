/** 비밀번호는 확인만 하고 원래 값의 공백을 제거하지 않습니다. */
export function validateWithdrawalInput(password, confirmed) {
  if (!password.trim()) throw new Error('현재 비밀번호를 입력해 주세요.')
  if (new TextEncoder().encode(password).length > 72) {
    throw new Error('비밀번호는 UTF-8 기준 72바이트 이하로 입력해 주세요.')
  }
  if (!confirmed) throw new Error('탈퇴 안내를 확인하고 체크해 주세요.')
}

/** DELETE 요청의 본문은 Axios의 data 옵션으로 전달합니다. */
export async function requestWithdrawal(client, password, confirmed) {
  validateWithdrawalInput(password, confirmed)
  await client.delete('/me', { data: { password } })
}

/** 서버 성공 후에만 호출합니다. 다른 계정으로 바뀌었다면 그 로그인 정보는 유지합니다. */
export async function clearWithdrawalSession({ isCurrentSession, navigate, cancelQueries, clearSession, clearCache }) {
  if (!isCurrentSession()) return
  try {
    // 먼저 공개 화면으로 이동해 보호 경로가 탈퇴 후 복귀 경로로 저장되지 않게 합니다.
    await navigate('/login', { replace: true, state: { withdrawn: true } })
  } finally {
    if (isCurrentSession()) {
      try {
        await cancelQueries()
      } finally {
        // 취소를 기다리던 사이에 새로 로그인한 회원의 정보는 삭제하지 않습니다.
        if (isCurrentSession()) {
          clearSession()
          clearCache()
        }
      }
    }
  }
}

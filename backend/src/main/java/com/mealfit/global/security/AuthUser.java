package com.mealfit.global.security;

/**
 * 인증된 사용자 정보. 컨트롤러에서 {@code @AuthenticationPrincipal AuthUser authUser}로 받는다.
 * 모든 조회/수정은 authUser.id()로 본인 데이터만 다루도록 한다.
 */
public record AuthUser(Long id, String email) {
}

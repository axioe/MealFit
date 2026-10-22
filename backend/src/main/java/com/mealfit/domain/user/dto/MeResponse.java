package com.mealfit.domain.user.dto;

/**
 * 로그인한 회원의 기본 정보입니다.
 * 비밀번호 해시와 토큰은 포함하지 않습니다.
 */
public record MeResponse(
    Long id,
    String email,
    String nickname
) {
}

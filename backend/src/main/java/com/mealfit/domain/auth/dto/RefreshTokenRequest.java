package com.mealfit.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 토큰 재발급과 로그아웃 요청에 사용합니다.
 * 클라이언트는 로그인 때 받은 Refresh Token 원문을 전달합니다.
 */
public record RefreshTokenRequest(

    @NotBlank(message = "Refresh Token을 전달해 주세요.")
    String refreshToken

) {
}

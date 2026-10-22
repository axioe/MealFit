package com.mealfit.domain.auth.dto;

public record TokenResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long expiresIn,
    UserInfo user
) {

    public record UserInfo(
        Long id,
        String email,
        String nickname
    ) {
    }
}

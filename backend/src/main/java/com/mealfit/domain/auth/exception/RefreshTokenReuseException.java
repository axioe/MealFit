package com.mealfit.domain.auth.exception;

import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;

/**
 * 폐기된 Refresh Token 재사용을 나타냅니다.
 * 전체 토큰 폐기가 롤백되지 않도록 다른 인증 실패와 구분합니다.
 */
public class RefreshTokenReuseException extends BusinessException {

    public RefreshTokenReuseException() {
        super(ErrorCode.AUTH_INVALID_REFRESH_TOKEN);
    }
}


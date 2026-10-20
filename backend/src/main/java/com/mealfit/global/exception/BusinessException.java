package com.mealfit.global.exception;

import lombok.Getter;

/** 도메인 규칙 위반은 모두 이 예외로 던진다. GlobalExceptionHandler가 ErrorResponse로 변환한다. */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String detailMessage) {
        super(detailMessage);
        this.errorCode = errorCode;
    }
}

package com.mealfit.global.exception;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponse(
        int status,
        String code,
        String message,
        List<FieldError> errors,
        LocalDateTime timestamp
) {

    public record FieldError(String field, String message) {
    }

    public static ErrorResponse of(ErrorCode errorCode) {
        return of(errorCode, errorCode.getMessage(), List.of());
    }

    public static ErrorResponse of(ErrorCode errorCode, String message) {
        return of(errorCode, message, List.of());
    }

    public static ErrorResponse of(ErrorCode errorCode, String message, List<FieldError> errors) {
        return new ErrorResponse(errorCode.getStatus().value(), errorCode.getCode(), message, errors,
                LocalDateTime.now());
    }
}

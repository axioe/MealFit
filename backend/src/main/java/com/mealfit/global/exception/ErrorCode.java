package com.mealfit.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 에러 코드는 도메인별 접두어로 묶어서 추가한다 (예: INVENTORY_001). 프론트는 code 값으로 분기한다.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "COMMON_400", "입력값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "COMMON_401", "로그인이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "COMMON_403", "접근 권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "COMMON_404", "요청한 데이터를 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "COMMON_405", "지원하지 않는 요청 방식입니다."),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "COMMON_415", "지원하지 않는 요청 형식입니다."),
    INVALID_STATUS_TRANSITION(HttpStatus.CONFLICT, "COMMON_409", "허용되지 않은 상태 변경입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_500", "서버 오류가 발생했습니다."),

    // 인증·사용자(AUTH_*, USER_*)는 로그인 담당자가 추가한다

    // AI 서비스
    AI_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "AI_001", "AI 서비스에 연결할 수 없습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}

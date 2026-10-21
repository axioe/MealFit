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

    // 냉장고
    INVENTORY_NOT_FOUND(HttpStatus.NOT_FOUND, "INVENTORY_001", "재고를 찾을 수 없습니다."),
    INVENTORY_INVALID_QUANTITY(HttpStatus.BAD_REQUEST, "INVENTORY_002", "수량이 올바르지 않습니다."),
    INVENTORY_INACTIVE_LOT(HttpStatus.CONFLICT, "INVENTORY_003", "소진되거나 폐기된 재고는 수정할 수 없습니다."),
    INVENTORY_INVALID_REQUEST(HttpStatus.BAD_REQUEST, "INVENTORY_004", "재고 변경 요청이 올바르지 않습니다."),

    // 레시피
    RECIPE_NOT_FOUND(HttpStatus.NOT_FOUND, "RECIPE_001", "레시피를 찾을 수 없습니다."),

    // 식단
    MEAL_PLAN_NOT_FOUND(HttpStatus.NOT_FOUND, "MEAL_PLAN_001", "식단을 찾을 수 없습니다."),
    MEAL_PLAN_NOT_DRAFT(HttpStatus.CONFLICT, "MEAL_PLAN_002", "초안 상태의 식단만 다시 추천할 수 있습니다."),
    MEAL_PLAN_ALL_CONFIRMED(HttpStatus.CONFLICT, "MEAL_PLAN_003", "이 날짜의 세 끼가 모두 확정되어 다시 추천할 수 없습니다."),
    MEAL_PLAN_NO_CANDIDATE(HttpStatus.UNPROCESSABLE_ENTITY, "MEAL_PLAN_004",
            "조건에 맞는 추천 식단이 없습니다. 제외 재료나 조리 시간을 확인해 주세요."),
    MEAL_PLAN_RESTRICTED_INGREDIENT(HttpStatus.UNPROCESSABLE_ENTITY, "MEAL_PLAN_005",
            "알레르기·제외 재료가 포함되어 확정할 수 없습니다."),
    MEAL_PLAN_INVALID_DATA(HttpStatus.UNPROCESSABLE_ENTITY, "MEAL_PLAN_006",
            "식단 데이터가 올바르지 않아 확정할 수 없습니다."),
    MEAL_PLAN_ALREADY_COOKED(HttpStatus.CONFLICT, "MEAL_PLAN_007", "조리한 식단은 조리를 먼저 취소한 뒤 취소할 수 있습니다."),

    // AI 서비스
    AI_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "AI_001", "AI 서비스에 연결할 수 없습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}

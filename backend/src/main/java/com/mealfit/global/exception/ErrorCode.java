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
    // 인증 오류
    AUTH_EMAIL_DUPLICATED(
        HttpStatus.CONFLICT, "AUTH_001",
        "이미 가입된 이메일입니다."
    ),
    AUTH_LOGIN_FAILED(
        HttpStatus.UNAUTHORIZED, "AUTH_002",
        "이메일 또는 비밀번호가 올바르지 않습니다."
    ),
    AUTH_INVALID_TOKEN(
        HttpStatus.UNAUTHORIZED, "AUTH_003",
        "유효하지 않은 인증 토큰입니다."
    ),
    AUTH_ACCESS_TOKEN_EXPIRED(
        HttpStatus.UNAUTHORIZED, "AUTH_004",
        "인증 토큰이 만료되었습니다."
    ),
    AUTH_INVALID_REFRESH_TOKEN(
        HttpStatus.UNAUTHORIZED, "AUTH_005",
        "로그인 정보가 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요."
    ),

    // 회원 탈퇴 본인 확인 오류는 400으로 응답해 토큰 만료와 구분합니다.
    USER_PASSWORD_MISMATCH(
        HttpStatus.BAD_REQUEST, "USER_001", "현재 비밀번호가 올바르지 않습니다."
    ),

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

    // 장보기
    SHOPPING_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "SHOPPING_001", "장보기 항목을 찾을 수 없습니다."),
    SHOPPING_INVALID_QUANTITY(HttpStatus.BAD_REQUEST, "SHOPPING_002", "수량이 올바르지 않습니다."),
    SHOPPING_STOCK_IN_EXCEEDED(HttpStatus.CONFLICT, "SHOPPING_003", "구매한 수량보다 많이 입고할 수 없습니다."),
    SHOPPING_DUPLICATE_ITEM(HttpStatus.BAD_REQUEST, "SHOPPING_004", "같은 장보기 항목을 한 번에 여러 번 보낼 수 없습니다."),

    // 조리
    COOKING_EVENT_NOT_FOUND(HttpStatus.NOT_FOUND, "COOKING_001", "조리 기록을 찾을 수 없습니다."),
    COOKING_NOT_CONFIRMED(HttpStatus.CONFLICT, "COOKING_002", "확정된 식단만 조리할 수 있습니다."),
    COOKING_ALREADY_COOKED(HttpStatus.CONFLICT, "COOKING_003", "이미 조리 완료한 식단입니다."),
    COOKING_INSUFFICIENT_STOCK(HttpStatus.CONFLICT, "COOKING_004", "재고가 부족해 조리할 수 없습니다."),
    COOKING_ALREADY_RESTORED(HttpStatus.CONFLICT, "COOKING_005", "이미 취소한 조리입니다."),
    COOKING_INVALID_INGREDIENT(HttpStatus.BAD_REQUEST, "COOKING_006", "레시피 재료의 수량만 바꾸거나 뺄 수 있습니다."),
    COOKING_DUPLICATE_INGREDIENT(HttpStatus.BAD_REQUEST, "COOKING_007", "같은 재료를 한 번에 여러 번 보낼 수 없습니다."),
    COOKING_RESTRICTED_INGREDIENT(HttpStatus.UNPROCESSABLE_ENTITY, "COOKING_008",
            "알레르기·제외 재료가 포함되어 조리할 수 없습니다."),
    COOKING_DUPLICATE_REQUEST(HttpStatus.CONFLICT, "COOKING_009",
            "같은 조리 요청을 이미 처리하고 있습니다. 조리 기록을 확인해 주세요."),

    // AI 서비스
    AI_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "AI_001", "AI 서비스에 연결할 수 없습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}

package com.mealfit.domain.user.dto;

import jakarta.validation.constraints.*;
import java.util.Set;

/**
 * 내 프로필 전체 수정 요청입니다.
 * 목표·조리 시간·예산은 미설정 시 null을 허용합니다.
 * 목록은 항목이 없으면 빈 배열([])로 전달합니다.
 */
public record ProfileUpdateRequest(

    @NotBlank(message = "닉네임을 입력해 주세요.")
    @Size(max = 50, message = "닉네임은 50자 이하로 입력해 주세요.")
    String nickname,

    /** 기존 대시보드와 동일한 목표 값을 사용합니다. */
    @Pattern(
        regexp = "LOSE|MAINTAIN|GAIN",
        message = "목표는 LOSE, MAINTAIN, GAIN 중 하나여야 합니다."
    )
    String goal,

    /** 10·20·30분 중 하나인지 Service에서 추가 검사합니다. */
    @Positive(message = "조리 시간은 0보다 커야 합니다.")
    Integer cookTimeMin,

    /** 한 끼 예산이며 단위는 원입니다. */
    @Positive(message = "예산은 0보다 커야 합니다.")
    Integer mealBudget,

    @NotNull(message = "알레르기 목록을 전달해 주세요.")
    @Size(max = 50, message = "알레르기는 최대 50개까지 입력해 주세요.")
    Set<
        @NotBlank(message = "알레르기 재료명은 비어 있을 수 없습니다.")
        @Size(max = 100, message = "재료명은 100자 이하로 입력해 주세요.")
            String
        > allergies,

    @NotNull(message = "제외 재료 목록을 전달해 주세요.")
    @Size(max = 50, message = "제외 재료는 최대 50개까지 입력해 주세요.")
    Set<
        @NotBlank(message = "제외 재료명은 비어 있을 수 없습니다.")
        @Size(max = 100, message = "재료명은 100자 이하로 입력해 주세요.")
            String
        > excludedIngredients

) {
}

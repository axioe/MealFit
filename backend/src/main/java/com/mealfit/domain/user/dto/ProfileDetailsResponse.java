package com.mealfit.domain.user.dto;

/** 전체 설정을 조회하되 수정은 탭별 API로 처리합니다. */
public record ProfileDetailsResponse(
    BodyProfileRequest body,
    TrainerProfileRequest trainer,
    DietProfileRequest diet,
    FitnessProfileRequest fitness,
    TestsProfileRequest tests
) {
}

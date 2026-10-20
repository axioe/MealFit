package com.mealfit.domain.recipe;

/** 생성 모드 표기용: 화면에서 AI 생성 / 검증된 로컬 대체 / 시드 데이터를 구분해 보여준다. */
public enum RecipeSource {
    AI_GENERATED,
    LOCAL_FALLBACK,
    SEED
}

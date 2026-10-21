package com.mealfit.domain.mealplan;

import com.mealfit.domain.mealplan.dto.MealPlanRecommendRequest;
import com.mealfit.domain.mealplan.dto.MealPlanRecommendResponse;
import com.mealfit.domain.mealplan.dto.MealPlanResponse;
import com.mealfit.global.web.CurrentUserId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "MealPlan", description = "식단 추천")
@RestController
@RequestMapping("/api/v1/meal-plans")
@RequiredArgsConstructor
public class MealPlanController {

    private final MealPlanService mealPlanService;

    @Operation(summary = "하루 세 끼 추천 (초안 생성, 같은 날짜로 다시 요청하면 전체 재추천)")
    @PostMapping("/recommend")
    @ResponseStatus(HttpStatus.CREATED)
    public MealPlanRecommendResponse recommend(@CurrentUserId Long userId,
                                               @Valid @RequestBody MealPlanRecommendRequest request) {
        return mealPlanService.recommend(userId, request);
    }

    @Operation(summary = "한 끼 재추천 (초안만 가능, 다른 끼니는 유지)")
    @PostMapping("/{id}/regenerate")
    @ResponseStatus(HttpStatus.CREATED)
    public MealPlanResponse regenerate(@CurrentUserId Long userId, @PathVariable Long id) {
        return mealPlanService.regenerate(userId, id);
    }
}

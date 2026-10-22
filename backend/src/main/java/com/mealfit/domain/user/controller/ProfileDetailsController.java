package com.mealfit.domain.user.controller;

import com.mealfit.domain.user.dto.*;
import com.mealfit.domain.user.service.ProfileDetailsService;
import com.mealfit.global.web.CurrentUserId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/** URL이나 요청의 회원 ID를 신뢰하지 않고 JWT 회원만 조회·수정합니다. */
@RestController
@RequestMapping("/api/v1/me/profile/details")
@Tag(name = "Profile", description = "마이페이지 상세 설정")
@RequiredArgsConstructor
public class ProfileDetailsController {
    private final ProfileDetailsService service;

    @GetMapping
    @Operation(summary = "마이페이지 전체 설정 조회")
    public ProfileDetailsResponse get(@CurrentUserId Long userId) { return service.get(userId); }

    @PutMapping("/common")
    @Operation(summary = "Body 탭 저장")
    public ProfileDetailsResponse updateBody(@CurrentUserId Long userId,
            @Valid @RequestBody BodyProfileRequest request) {
        return service.updateBody(userId, request);
    }

    @PutMapping("/trainer")
    @Operation(summary = "Trainer 탭 저장")
    public ProfileDetailsResponse updateTrainer(@CurrentUserId Long userId,
            @Valid @RequestBody TrainerProfileRequest request) {
        return service.updateTrainer(userId, request);
    }

    @PutMapping("/diet")
    @Operation(summary = "Diet 탭 저장")
    public ProfileDetailsResponse updateDiet(@CurrentUserId Long userId,
            @Valid @RequestBody DietProfileRequest request) {
        return service.updateDiet(userId, request);
    }

    @PutMapping("/fitness")
    @Operation(summary = "Fitness 탭 저장")
    public ProfileDetailsResponse updateFitness(@CurrentUserId Long userId,
            @Valid @RequestBody FitnessProfileRequest request) {
        return service.updateFitness(userId, request);
    }

    @PutMapping("/tests")
    @Operation(summary = "Tests 탭 저장")
    public ProfileDetailsResponse updateTests(@CurrentUserId Long userId,
            @Valid @RequestBody TestsProfileRequest request) {
        return service.updateTests(userId, request);
    }

}

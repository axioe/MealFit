package com.mealfit.domain.user.controller;

import com.mealfit.domain.user.dto.ProfileResponse;
import com.mealfit.domain.user.dto.WithdrawRequest;
import com.mealfit.domain.user.service.WithdrawalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import com.mealfit.domain.user.dto.ProfileUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.mealfit.domain.user.service.UserService;

import com.mealfit.domain.user.dto.MeResponse;
import com.mealfit.global.web.CurrentUserId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 인증된 회원 자신의 계정 정보를 제공합니다. */
@Tag(name = "User", description = "내 계정 정보")
@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final WithdrawalService withdrawalService;

    /** 비밀번호를 확인한 뒤 본인 계정만 탈퇴하고 모든 세션을 폐기합니다. */
    @Operation(summary = "회원 탈퇴", description = "비밀번호 확인 후 소프트 삭제 및 모든 Refresh Token 폐기")
    @DeleteMapping
    public ResponseEntity<Void> withdraw(
        @CurrentUserId Long userId,
        @Valid @RequestBody WithdrawRequest request
    ) {
        withdrawalService.withdraw(userId, request);
        return ResponseEntity.noContent().build();
    }


    @Operation(summary = "내 계정 정보 조회")
    @GetMapping
    public MeResponse getMe(@CurrentUserId Long userId) {
        // 요청 본문이나 URL이 아닌 JWT의 회원 ID를 사용합니다.
        return userService.getMe(userId);
    }

    /** 로그인한 회원 본인의 프로필을 조회합니다. */
    @Operation(summary = "내 프로필 조회")
    @GetMapping("/profile")
    public ProfileResponse getProfile(@CurrentUserId Long userId) {
        return userService.getProfile(userId);
    }

    /**
     * 내 프로필 전체를 수정합니다.
     * 요청 DTO를 검증하고, 수정 대상은 JWT의 회원 ID로 결정합니다.
     */
    @Operation(summary = "내 프로필 수정")
    @PutMapping("/profile")
    public ProfileResponse updateProfile(
        @CurrentUserId Long userId,
        @Valid @RequestBody ProfileUpdateRequest request
    ) {
        return userService.updateProfile(userId, request);
    }
}

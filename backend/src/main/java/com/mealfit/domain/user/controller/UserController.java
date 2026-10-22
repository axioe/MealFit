package com.mealfit.domain.user.controller;

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

    @Operation(summary = "내 계정 정보 조회")
    @GetMapping
    public MeResponse getMe(@CurrentUserId Long userId) {
        // 요청 본문이나 URL이 아닌 JWT의 회원 ID를 사용합니다.
        return userService.getMe(userId);
    }
}

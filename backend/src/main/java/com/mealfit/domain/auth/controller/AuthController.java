package com.mealfit.domain.auth.controller;

import com.mealfit.domain.auth.service.AuthService;

import com.mealfit.domain.auth.dto.LoginRequest;
import com.mealfit.domain.auth.dto.RefreshTokenRequest;
import com.mealfit.domain.auth.dto.SignupRequest;
import com.mealfit.domain.auth.dto.TokenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/** 인증 요청을 검증한 뒤 AuthService에 전달합니다. */
@Tag(name = "Auth", description = "회원가입·로그인·토큰 관리")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "회원가입 및 자동 로그인")
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public TokenResponse signup(
        @Valid @RequestBody SignupRequest request
    ) {
        return authService.signup(request);
    }

    @Operation(summary = "이메일 로그인")
    @PostMapping("/login")
    public TokenResponse login(
        @Valid @RequestBody LoginRequest request
    ) {
        return authService.login(request);
    }

    @Operation(summary = "토큰 재발급")
    @PostMapping("/refresh")
    public TokenResponse refresh(
        @Valid @RequestBody RefreshTokenRequest request
    ) {
        return authService.refresh(request.refreshToken());
    }

    /** 로그아웃 성공 시 본문 없이 204를 반환합니다. */
    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(
        @Valid @RequestBody RefreshTokenRequest request
    ) {
        authService.logout(request.refreshToken());
    }
}

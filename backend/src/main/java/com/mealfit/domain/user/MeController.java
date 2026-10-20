package com.mealfit.domain.user;

import com.mealfit.domain.user.dto.MeResponse;
import com.mealfit.domain.user.dto.ProfileResponse;
import com.mealfit.domain.user.dto.ProfileUpdateRequest;
import com.mealfit.global.security.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Me", description = "내 정보·프로필")
@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class MeController {

    private final ProfileService profileService;

    @Operation(summary = "내 계정 정보")
    @GetMapping
    public MeResponse me(@AuthenticationPrincipal AuthUser authUser) {
        return profileService.getMe(authUser.id());
    }

    @Operation(summary = "프로필 조회")
    @GetMapping("/profile")
    public ProfileResponse getProfile(@AuthenticationPrincipal AuthUser authUser) {
        return profileService.getProfile(authUser.id());
    }

    @Operation(summary = "프로필 수정", description = "목표·알레르기·조리 시간·예산·제외 재료")
    @PutMapping("/profile")
    public ProfileResponse updateProfile(@AuthenticationPrincipal AuthUser authUser,
                                         @Valid @RequestBody ProfileUpdateRequest request) {
        return profileService.updateProfile(authUser.id(), request);
    }
}

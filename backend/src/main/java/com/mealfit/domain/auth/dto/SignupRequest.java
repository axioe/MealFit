package com.mealfit.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 64, message = "비밀번호는 8~64자여야 합니다.") String password,
        @NotBlank @Size(max = 20) String nickname
) {
}

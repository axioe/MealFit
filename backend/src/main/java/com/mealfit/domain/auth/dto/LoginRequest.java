package com.mealfit.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(

    @NotBlank(message = "이메일을 입력해 주세요.")
    @Email(message = "올바른 이메일 형식을 입력해 주세요.")
    @Size(max = 254, message = "이메일은 254자 이하로 입력해 주세요.")
    String email,

    @NotBlank(message = "비밀번호를 입력해 주세요.")
    String password

) {
}

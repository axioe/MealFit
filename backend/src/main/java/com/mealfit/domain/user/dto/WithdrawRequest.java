package com.mealfit.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 탈퇴할 회원 ID는 JWT에서 읽고, 본인 확인용 비밀번호만 전달받습니다. */
public record WithdrawRequest(
    @NotBlank(message = "비밀번호를 입력해 주세요.")
    @Size(max = 72, message = "비밀번호는 72자 이하로 입력해 주세요.")
    String password
) {
}

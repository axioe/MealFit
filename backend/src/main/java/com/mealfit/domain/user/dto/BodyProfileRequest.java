package com.mealfit.domain.user.dto;

import jakarta.validation.constraints.*;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.mealfit.domain.user.dto.validation.WholeNumberDeserializer;
import java.math.BigDecimal;
import java.util.Set;

/** 신체 기본 정보 탭의 저장 요청입니다. 이 탭에 속한 값만 변경합니다. */
public record BodyProfileRequest(
    @NotBlank @Size(max = 50) String nickname,
    @Min(18) @Max(80) @JsonDeserialize(using = WholeNumberDeserializer.class) Integer age,
    @DecimalMin("100") @DecimalMax("240") @Digits(integer = 3, fraction = 1) BigDecimal height,
    @DecimalMin("30") @DecimalMax("250") @Digits(integer = 3, fraction = 1) BigDecimal currentWeight,
    @DecimalMin("30") @DecimalMax("250") @Digits(integer = 3, fraction = 1) BigDecimal targetWeight,
    @Pattern(regexp = "male|female|unspecified") String gender,
    @Pattern(regexp = "sedentary|light|moderate|active|very_active") String activityLevel
) {
}

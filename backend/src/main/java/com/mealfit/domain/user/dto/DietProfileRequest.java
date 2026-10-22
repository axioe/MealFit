package com.mealfit.domain.user.dto;

import jakarta.validation.constraints.*;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.mealfit.domain.user.dto.validation.WholeNumberDeserializer;
import java.math.BigDecimal;
import java.util.Set;

/** 식단 기호 탭의 저장 요청입니다. 이 탭에 속한 값만 변경합니다. */
public record DietProfileRequest(
    @Pattern(regexp = "LOSE|MAINTAIN|GAIN") String goal,
    @Positive @JsonDeserialize(using = WholeNumberDeserializer.class) Integer cookTimeMin,
    @Positive @JsonDeserialize(using = WholeNumberDeserializer.class) Integer mealBudget,
     @NotNull @Size(max = 50) Set<@NotBlank @Size(max = 100) String> allergies,
     @NotNull @Size(max = 50) Set<@NotBlank @Size(max = 100) String> excludedIngredients,
    @Min(1) @Max(6) @JsonDeserialize(using = WholeNumberDeserializer.class) Integer defaultServings,
    @NotNull Boolean prioritizeFridge,
     @NotNull @Size(max = 50) Set<@NotBlank @Size(max = 100) String> preferredFoods
) {
}

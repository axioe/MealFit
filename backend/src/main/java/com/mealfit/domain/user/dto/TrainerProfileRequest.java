package com.mealfit.domain.user.dto;

import jakarta.validation.constraints.*;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.mealfit.domain.user.dto.validation.WholeNumberDeserializer;
import java.math.BigDecimal;
import java.util.Set;

/** AI 트레이너 프로필 탭의 저장 요청입니다. 이 탭에 속한 값만 변경합니다. */
public record TrainerProfileRequest(
    @NotNull @Min(18) @Max(80) @JsonDeserialize(using = WholeNumberDeserializer.class) Integer age,
    @NotNull @DecimalMin("100") @DecimalMax("240") @Digits(integer = 3, fraction = 1) BigDecimal height,
    @NotNull @DecimalMin("30") @DecimalMax("250") @Digits(integer = 3, fraction = 1) BigDecimal currentWeight,
    @NotNull @Pattern(regexp = "loss|hypertrophy|stamina|health") String workoutGoal,
    @NotNull @Pattern(regexp = "starter|beginner|intermediate|advanced") String workoutLevel,
    @Pattern(regexp = "home|gym|outdoor") String environment,
    @Min(10) @Max(90) @JsonDeserialize(using = WholeNumberDeserializer.class) Integer workoutMinutes,
    @Pattern(regexp = "regular|high_protein|low_carb|keto|vegan|balanced") String dietType,
     @NotNull @Size(max = 50) Set<@NotBlank @Size(max = 100) @Pattern(regexp = "dumbbell|band|mat|pullup_bar|foam_roller|kettlebell|none|barbell|gym") String> equipment,
     @NotNull @Size(max = 50) Set<@NotBlank @Size(max = 100) String> injuries,
     @NotNull @Size(max = 50) Set<@NotBlank @Size(max = 100) String> allergies,
     @NotNull @Size(max = 50) Set<@NotBlank @Size(max = 100) String> excludedIngredients,
    @Positive @JsonDeserialize(using = WholeNumberDeserializer.class) Integer mealBudget
) {
}

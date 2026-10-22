package com.mealfit.domain.user.dto;

import jakarta.validation.constraints.*;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.mealfit.domain.user.dto.validation.WholeNumberDeserializer;
import java.math.BigDecimal;
import java.util.Set;

/** 운동 목표·장비 탭의 저장 요청입니다. 이 탭에 속한 값만 변경합니다. */
public record FitnessProfileRequest(
    @Pattern(regexp = "loss|hypertrophy|stamina|health") String workoutGoal,
    @Pattern(regexp = "starter|beginner|intermediate|advanced") String workoutLevel,
    @Min(10) @Max(90) @JsonDeserialize(using = WholeNumberDeserializer.class) Integer workoutMinutes,
    @Min(2) @Max(6) @JsonDeserialize(using = WholeNumberDeserializer.class) Integer daysPerWeek,
     @NotNull @Size(max = 50) Set<@NotBlank @Size(max = 100) @Pattern(regexp = "dumbbell|band|mat|pullup_bar|foam_roller|kettlebell|none|barbell|gym") String> equipment,
     @NotNull @Size(max = 50) Set<@NotBlank @Size(max = 100) String> injuries
) {
}

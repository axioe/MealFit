package com.mealfit.domain.user.dto;

import jakarta.validation.constraints.*;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.mealfit.domain.user.dto.validation.WholeNumberDeserializer;
import java.math.BigDecimal;
import java.util.Set;

/** 체력 측정 탭의 저장 요청입니다. 이 탭에 속한 값만 변경합니다. */
public record TestsProfileRequest(
    @Min(20) @Max(250) @JsonDeserialize(using = WholeNumberDeserializer.class) Integer restingHeartRate,
    @Min(0) @Max(1000) @JsonDeserialize(using = WholeNumberDeserializer.class) Integer pushups,
    @Min(0) @Max(200) @JsonDeserialize(using = WholeNumberDeserializer.class) Integer squat30s,
    @Min(0) @Max(7200) @JsonDeserialize(using = WholeNumberDeserializer.class) Integer plankSeconds
) {
}

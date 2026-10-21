package com.mealfit.domain.inventory.dto;

import com.mealfit.domain.inventory.StorageLocation;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record StockInRequest(
        @NotBlank(message = "식재료명을 입력해 주세요.")
        @Size(max = 100, message = "식재료명은 100자 이내로 입력해 주세요.") String ingredientName,
        @NotNull(message = "수량을 입력해 주세요.")
        @DecimalMin(value = "0", inclusive = false, message = "입고 수량은 0보다 커야 합니다.")
        @Digits(integer = 9, fraction = 3, message = "수량은 정수 9자리, 소수 3자리까지 입력해 주세요.") BigDecimal quantity,
        @NotBlank(message = "단위를 입력해 주세요.")
        @Size(max = 20, message = "단위는 20자 이내로 입력해 주세요.") String unit,
        LocalDate expiryDate,
        @NotNull(message = "보관 위치를 선택해 주세요.") StorageLocation storageLocation,
        @DecimalMin(value = "0", message = "최소 유지량은 음수일 수 없습니다.")
        @Digits(integer = 9, fraction = 3, message = "최소 유지량은 정수 9자리, 소수 3자리까지 입력해 주세요.") BigDecimal minStockQty,
        @Size(max = 255, message = "메모는 255자 이내로 입력해 주세요.") String memo
) {
}

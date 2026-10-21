package com.mealfit.domain.shopping.dto;

import com.mealfit.domain.inventory.StorageLocation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** 산 재료를 냉장고에 넣는다. 항목마다 재고 묶음 하나가 생긴다. */
public record ShoppingStockInRequest(
        @NotEmpty(message = "입고할 항목을 하나 이상 보내 주세요.") List<@Valid Item> items
) {

    /**
     * @param quantity    입고 수량. 없으면 산 수량 전부
     * @param expiryDate  소비기한. 없으면 기한 미등록
     * @param minStockQty 최소 유지량. 없으면 0
     */
    public record Item(
            @NotNull(message = "장보기 항목을 선택해 주세요.") Long id,
            @DecimalMin(value = "0", inclusive = false, message = "입고 수량은 0보다 커야 합니다.")
            @Digits(integer = 9, fraction = 3, message = "수량은 정수 9자리, 소수 3자리까지 입력해 주세요.")
            BigDecimal quantity,
            LocalDate expiryDate,
            @NotNull(message = "보관 위치를 선택해 주세요.") StorageLocation storageLocation,
            @DecimalMin(value = "0", message = "최소 유지량은 음수일 수 없습니다.")
            @Digits(integer = 9, fraction = 3, message = "최소 유지량은 정수 9자리, 소수 3자리까지 입력해 주세요.")
            BigDecimal minStockQty
    ) {
    }
}

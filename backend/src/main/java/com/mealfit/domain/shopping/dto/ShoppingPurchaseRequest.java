package com.mealfit.domain.shopping.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

/** 부분 구매 반영. purchasedQty는 누적이 아니라 "지금까지 산 수량"으로 덮어쓴다. */
public record ShoppingPurchaseRequest(
        @NotEmpty(message = "구매한 항목을 하나 이상 보내 주세요.") List<@Valid Item> items
) {

    public record Item(
            @NotNull(message = "장보기 항목을 선택해 주세요.") Long id,
            @NotNull(message = "구매 수량을 입력해 주세요.")
            @DecimalMin(value = "0", message = "구매 수량은 음수일 수 없습니다.")
            @Digits(integer = 9, fraction = 3, message = "수량은 정수 9자리, 소수 3자리까지 입력해 주세요.")
            BigDecimal purchasedQty
    ) {
    }
}

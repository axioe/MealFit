package com.mealfit.domain.inventory.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record InventoryResponse(LocalDate asOfDate, List<IngredientGroup> groups) {
    public record IngredientGroup(
            String ingredientName, String unit,
            @Schema(description = "활성 로트의 전체 수량입니다. 기한 경과 수량을 포함합니다.") BigDecimal totalQuantity,
            @Schema(description = "기한 경과를 제외한 활성 로트 수량입니다. 기한 미등록은 포함합니다.") BigDecimal availableQuantity,
            BigDecimal expiredQuantity,
            @Schema(description = "소진·폐기 로트를 포함한 묶음 목록입니다.") List<LotResponse> lots
    ) {
    }
}

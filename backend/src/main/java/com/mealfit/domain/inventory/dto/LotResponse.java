package com.mealfit.domain.inventory.dto;

import com.mealfit.domain.inventory.ExpirationStatus;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.inventory.LotStatus;
import com.mealfit.domain.inventory.StorageLocation;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record LotResponse(
        Long id, String ingredientName, BigDecimal quantity, String unit, LocalDate expiryDate,
        StorageLocation storageLocation, BigDecimal minStockQty, LotStatus status,
        ExpirationStatus expirationStatus, String memo, LocalDateTime createdAt, LocalDateTime updatedAt
) {
    public static LotResponse from(InventoryLot lot, LocalDate today) {
        return new LotResponse(lot.getId(), lot.getIngredientName(), lot.getQuantity(), lot.getUnit(),
                lot.getExpiryDate(), lot.getStorageLocation(), lot.getMinStockQty(), lot.getStatus(),
                lot.expirationStatus(today), lot.getMemo(), lot.getCreatedAt(), lot.getUpdatedAt());
    }
}

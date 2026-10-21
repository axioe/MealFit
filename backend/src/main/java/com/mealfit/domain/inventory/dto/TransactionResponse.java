package com.mealfit.domain.inventory.dto;

import com.mealfit.domain.inventory.InventoryTransaction;
import com.mealfit.domain.inventory.InventoryTransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionResponse(
        Long id, Long lotId, InventoryTransactionType type, BigDecimal qtyChange,
        String memo, LocalDateTime createdAt
) {
    public static TransactionResponse from(InventoryTransaction transaction) {
        return new TransactionResponse(transaction.getId(), transaction.getLot().getId(), transaction.getType(),
                transaction.getQtyChange(), transaction.getMemo(), transaction.getCreatedAt());
    }
}

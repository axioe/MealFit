package com.mealfit.domain.inventory;

import com.mealfit.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 재고 묶음(같은 재료라도 기한·보관 위치가 다르면 별도 묶음).
 * 수량 변경은 반드시 InventoryTransaction 이력과 같은 트랜잭션에서 한다.
 */
@Getter
@Entity
@Table(name = "inventory_lots")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InventoryLot extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "ingredient_name", nullable = false, length = 100)
    private String ingredientName;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "storage_location", nullable = false, length = 20)
    private StorageLocation storageLocation;

    @Column(name = "min_stock_qty", nullable = false, precision = 12, scale = 3)
    private BigDecimal minStockQty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LotStatus status;

    @Column(length = 255)
    private String memo;

    @Builder
    private InventoryLot(Long userId, String ingredientName, BigDecimal quantity, String unit,
                         LocalDate expiryDate, StorageLocation storageLocation, BigDecimal minStockQty, String memo) {
        this.userId = userId;
        this.ingredientName = ingredientName;
        this.quantity = quantity;
        this.unit = unit;
        this.expiryDate = expiryDate;
        this.storageLocation = storageLocation;
        this.minStockQty = minStockQty != null ? minStockQty : BigDecimal.ZERO;
        this.memo = memo;
        this.status = LotStatus.ACTIVE;
    }

    public ExpirationStatus expirationStatus(LocalDate today) {
        return ExpirationStatus.of(expiryDate, today);
    }
}

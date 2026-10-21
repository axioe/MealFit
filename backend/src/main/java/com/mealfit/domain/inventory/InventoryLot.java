package com.mealfit.domain.inventory;

import com.mealfit.global.common.BaseTimeEntity;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
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

    public void adjust(BigDecimal quantity, StorageLocation storageLocation, LocalDate expiryDate,
                       boolean clearExpiryDate, BigDecimal minStockQty, String memo) {
        validateActive();
        if (quantity != null) {
            validateQuantity(quantity, false);
            this.quantity = quantity;
            if (quantity.signum() == 0) {
                this.status = LotStatus.DEPLETED;
            }
        }
        if (storageLocation != null) {
            this.storageLocation = storageLocation;
        }
        if (clearExpiryDate || expiryDate != null) {
            this.expiryDate = clearExpiryDate ? null : expiryDate;
        }
        if (minStockQty != null) {
            validateQuantity(minStockQty, false);
            this.minStockQty = minStockQty;
        }
        if (memo != null) {
            this.memo = memo;
        }
    }

    public void dispose(BigDecimal quantity) {
        validateActive();
        validateQuantity(quantity, true);
        if (quantity.compareTo(this.quantity) > 0) {
            throw new BusinessException(ErrorCode.INVENTORY_INVALID_QUANTITY,
                    "현재 재고보다 많은 수량을 폐기할 수 없습니다.");
        }
        this.quantity = this.quantity.subtract(quantity);
        if (this.quantity.signum() == 0) {
            this.status = LotStatus.DISPOSED;
        }
    }

    /** 조리 차감. 0이 되면 소진(DEPLETED). COOK_DEDUCT 이력은 조리 서비스가 같은 트랜잭션에서 남긴다. */
    public void deduct(BigDecimal quantity) {
        validateActive();
        validateQuantity(quantity, true);
        if (quantity.compareTo(this.quantity) > 0) {
            throw new BusinessException(ErrorCode.INVENTORY_INVALID_QUANTITY,
                    "현재 재고보다 많이 차감할 수 없습니다.");
        }
        this.quantity = this.quantity.subtract(quantity);
        if (this.quantity.signum() == 0) {
            this.status = LotStatus.DEPLETED;
        }
    }

    /** 조리 취소 복원. 차감했던 수량을 되돌리고, 소진된 묶음은 다시 사용 가능(ACTIVE) 상태로 바꾼다. */
    public void restore(BigDecimal quantity) {
        validateQuantity(quantity, true);
        this.quantity = this.quantity.add(quantity);
        this.status = LotStatus.ACTIVE;
    }

    private void validateActive() {
        if (status != LotStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.INVENTORY_INACTIVE_LOT);
        }
    }

    private static void validateQuantity(BigDecimal quantity, boolean positive) {
        if (quantity == null || quantity.signum() < 0 || (positive && quantity.signum() == 0)
                || quantity.stripTrailingZeros().scale() > 3
                || quantity.compareTo(new BigDecimal("999999999.999")) > 0) {
            throw new BusinessException(ErrorCode.INVENTORY_INVALID_QUANTITY);
        }
    }

    public ExpirationStatus expirationStatus(LocalDate today) {
        return ExpirationStatus.of(expiryDate, today);
    }
}

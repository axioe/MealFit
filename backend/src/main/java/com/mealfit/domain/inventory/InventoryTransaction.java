package com.mealfit.domain.inventory;

import com.mealfit.domain.cooking.CookingEvent;
import com.mealfit.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 재고 변경 이력. 조리 취소 시 cookingEvent로 묶인 이력을 역으로 적용해 원본을 복원한다. */
@Getter
@Entity
@Table(name = "inventory_transactions")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InventoryTransaction extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lot_id")
    private InventoryLot lot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cooking_event_id")
    private CookingEvent cookingEvent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InventoryTransactionType type;

    /** 증가는 +, 감소는 - */
    @Column(name = "qty_change", nullable = false, precision = 12, scale = 3)
    private BigDecimal qtyChange;

    @Column(length = 255)
    private String memo;

    @Builder
    private InventoryTransaction(Long userId, InventoryLot lot, CookingEvent cookingEvent,
                                 InventoryTransactionType type, BigDecimal qtyChange, String memo) {
        this.userId = userId;
        this.lot = lot;
        this.cookingEvent = cookingEvent;
        this.type = type;
        this.qtyChange = qtyChange;
        this.memo = memo;
    }
}

package com.mealfit.domain.shopping;

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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 식단 확정 시 계산된 부족분. 부족분 = 필요량 + 최소 유지량 - 현재고 (0 미만이면 0) */
@Getter
@Entity
@Table(name = "shopping_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ShoppingItem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "ingredient_name", nullable = false, length = 100)
    private String ingredientName;

    @Column(name = "required_qty", nullable = false, precision = 12, scale = 3)
    private BigDecimal requiredQty;

    @Column(name = "purchased_qty", nullable = false, precision = 12, scale = 3)
    private BigDecimal purchasedQty;

    @Column(nullable = false, length = 20)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShoppingItemStatus status;

    public static ShoppingItem create(Long userId, String ingredientName, BigDecimal requiredQty, String unit) {
        ShoppingItem item = new ShoppingItem();
        item.userId = userId;
        item.ingredientName = ingredientName;
        item.requiredQty = requiredQty;
        item.purchasedQty = BigDecimal.ZERO;
        item.unit = unit;
        item.status = ShoppingItemStatus.NEEDED;
        return item;
    }
}

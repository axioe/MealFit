package com.mealfit.domain.shopping;

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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 장보기 항목. 재료·단위 계열(g, ml, 개 등)마다 한 줄이며, 식단 확정·취소 때 필요량을 다시 계산한다.
 * 부족분 = 필요량 + 최소 유지량 - 현재고 (0 미만이면 0). purchasedQty는 사서 아직 냉장고에 넣지 않은 수량이며,
 * 입고하면 그만큼 줄고 재고가 늘어 다음 재계산에서 필요량도 줄어든다.
 */
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
        item.purchasedQty = BigDecimal.ZERO.setScale(3);
        item.unit = unit;
        item.status = ShoppingItemStatus.NEEDED;
        return item;
    }

    /** 다시 계산한 부족분으로 필요량을 바꾼다. 이미 산 수량은 그대로 두고 상태를 맞춘다. */
    public void updateRequiredQty(BigDecimal requiredQty) {
        this.requiredQty = requiredQty;
        refreshStatus();
    }

    /** 산 수량을 기록한다(누적이 아니라 현재 값으로 바꾼다). 필요량보다 많이 사도 된다. */
    public void recordPurchase(BigDecimal purchasedQty) {
        if (purchasedQty == null || purchasedQty.signum() < 0) {
            throw new BusinessException(ErrorCode.SHOPPING_INVALID_QUANTITY);
        }
        this.purchasedQty = purchasedQty;
        refreshStatus();
    }

    /** 산 수량 중 quantity만큼 냉장고에 넣었다. 넣은 만큼 구매량에서 뺀다. */
    public void stockIn(BigDecimal quantity) {
        if (purchasedQty.signum() == 0) {
            throw new BusinessException(ErrorCode.SHOPPING_STOCK_IN_EXCEEDED,
                    "%s은(는) 아직 구매한 수량이 없습니다. 구매 수량을 먼저 입력해 주세요.".formatted(ingredientName));
        }
        if (quantity == null || quantity.signum() <= 0) {
            throw new BusinessException(ErrorCode.SHOPPING_INVALID_QUANTITY);
        }
        if (quantity.compareTo(purchasedQty) > 0) {
            throw new BusinessException(ErrorCode.SHOPPING_STOCK_IN_EXCEEDED,
                    "%s은(는) 구매한 수량(%s%s)보다 많이 입고할 수 없습니다."
                            .formatted(ingredientName, purchasedQty.stripTrailingZeros().toPlainString(), unit));
        }
        this.purchasedQty = purchasedQty.subtract(quantity);
        refreshStatus();
    }

    /** 더 살 수량 = max(0, 필요량 - 구매량) */
    public BigDecimal remainingQty() {
        return requiredQty.subtract(purchasedQty).max(BigDecimal.ZERO);
    }

    /** 필요량도 구매량도 없으면 목록에서 지워도 된다. */
    public boolean isEmpty() {
        return requiredQty.signum() == 0 && purchasedQty.signum() == 0;
    }

    private void refreshStatus() {
        if (purchasedQty.signum() == 0) {
            status = ShoppingItemStatus.NEEDED;
        } else if (purchasedQty.compareTo(requiredQty) >= 0) {
            status = ShoppingItemStatus.PURCHASED;
        } else {
            status = ShoppingItemStatus.PARTIAL;
        }
    }
}

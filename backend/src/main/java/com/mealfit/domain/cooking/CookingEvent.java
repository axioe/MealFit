package com.mealfit.domain.cooking;

import com.mealfit.domain.mealplan.MealPlan;
import com.mealfit.domain.recipe.Recipe;
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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "cooking_events")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CookingEvent extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meal_plan_id")
    private MealPlan mealPlan;

    @Column(nullable = false)
    private int servings;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CookingStatus status;

    @Column(name = "cooked_at", nullable = false)
    private LocalDateTime cookedAt;

    @Column(name = "restored_at")
    private LocalDateTime restoredAt;

    public static CookingEvent cooked(Long userId, MealPlan mealPlan, int servings) {
        CookingEvent event = new CookingEvent();
        event.userId = userId;
        event.mealPlan = mealPlan;
        event.recipe = mealPlan.getRecipe();
        event.servings = servings;
        event.status = CookingStatus.COOKED;
        event.cookedAt = LocalDateTime.now();
        return event;
    }

    /** 재고 복원(InventoryTransaction 역적용)은 같은 트랜잭션의 서비스 계층에서 처리한다. */
    public void restore() {
        status.validateTransition(CookingStatus.RESTORED);
        this.status = CookingStatus.RESTORED;
        this.restoredAt = LocalDateTime.now();
    }
}

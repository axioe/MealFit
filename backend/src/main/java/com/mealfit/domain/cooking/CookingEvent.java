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

    /** 식단 기반 조리만 채운다. 식단 없는 조리(15분 요리 등)는 null */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    /** 식단 기반 조리만 채운다. 식단 없는 조리(15분 요리 등)는 null */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_plan_id")
    private MealPlan mealPlan;

    /** 조리 당시 메뉴 이름. 레시피가 없는 조리도 기록과 이력 메모에 쓴다. */
    @Column(name = "recipe_name", nullable = false, length = 100)
    private String recipeName;

    /** 식단 없는 조리의 중복 요청 방지 키 (사용자별 유일) */
    @Column(name = "client_request_id", length = 36)
    private String clientRequestId;

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
        event.recipeName = mealPlan.getRecipe().getName();
        event.servings = servings;
        event.status = CookingStatus.COOKED;
        event.cookedAt = LocalDateTime.now();
        return event;
    }

    /** 식단 없이 재료 목록만으로 조리한 기록 */
    public static CookingEvent cookedWithoutPlan(Long userId, String recipeName, int servings, String clientRequestId) {
        CookingEvent event = new CookingEvent();
        event.userId = userId;
        event.recipeName = recipeName;
        event.clientRequestId = clientRequestId;
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

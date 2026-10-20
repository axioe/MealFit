package com.mealfit.domain.mealplan;

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
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "meal_plans")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MealPlan extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false, length = 20)
    private MealType mealType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @Column(nullable = false)
    private int servings;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MealPlanStatus status;

    @Column(name = "recommendation_reason", length = 500)
    private String recommendationReason;

    @Builder
    private MealPlan(Long userId, LocalDate planDate, MealType mealType, Recipe recipe, int servings,
                     String recommendationReason) {
        this.userId = userId;
        this.planDate = planDate;
        this.mealType = mealType;
        this.recipe = recipe;
        this.servings = servings;
        this.recommendationReason = recommendationReason;
        this.status = MealPlanStatus.DRAFT;
    }

    /** 확정 전 서버 검증(알레르기·제외 재료·수량)은 서비스 계층에서 먼저 수행한다. */
    public void confirm() {
        status.validateTransition(MealPlanStatus.CONFIRMED);
        this.status = MealPlanStatus.CONFIRMED;
    }

    public void cancel() {
        status.validateTransition(MealPlanStatus.CANCELED);
        this.status = MealPlanStatus.CANCELED;
    }
}

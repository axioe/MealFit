package com.mealfit.global.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealfit.domain.cooking.CookingStatus;
import com.mealfit.domain.intake.IntakeStatus;
import com.mealfit.domain.inventory.ExpirationStatus;
import com.mealfit.domain.mealplan.MealPlanStatus;
import com.mealfit.global.exception.BusinessException;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class StatusTransitionTest {

    @Test
    void 식단_상태_전이() {
        assertThat(MealPlanStatus.DRAFT.canTransitionTo(MealPlanStatus.CONFIRMED)).isTrue();
        assertThat(MealPlanStatus.CONFIRMED.canTransitionTo(MealPlanStatus.CANCELED)).isTrue();
        assertThat(MealPlanStatus.CONFIRMED.canTransitionTo(MealPlanStatus.DRAFT)).isFalse();
        assertThatThrownBy(() -> MealPlanStatus.CANCELED.validateTransition(MealPlanStatus.CONFIRMED))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void 조리_섭취_상태_전이() {
        assertThat(CookingStatus.COOKED.canTransitionTo(CookingStatus.RESTORED)).isTrue();
        assertThat(CookingStatus.RESTORED.canTransitionTo(CookingStatus.COOKED)).isFalse();
        assertThat(IntakeStatus.PLANNED.canTransitionTo(IntakeStatus.EATEN)).isTrue();
        assertThat(IntakeStatus.EATEN.canTransitionTo(IntakeStatus.SKIPPED)).isTrue();
        assertThat(IntakeStatus.EATEN.canTransitionTo(IntakeStatus.PLANNED)).isFalse();
    }

    @Test
    void 기한_상태_5단계() {
        LocalDate today = LocalDate.of(2026, 10, 20);
        assertThat(ExpirationStatus.of(null, today)).isEqualTo(ExpirationStatus.UNKNOWN);
        assertThat(ExpirationStatus.of(today.minusDays(1), today)).isEqualTo(ExpirationStatus.EXPIRED);
        assertThat(ExpirationStatus.of(today, today)).isEqualTo(ExpirationStatus.TODAY);
        assertThat(ExpirationStatus.of(today.plusDays(3), today)).isEqualTo(ExpirationStatus.IMMINENT);
        assertThat(ExpirationStatus.of(today.plusDays(4), today)).isEqualTo(ExpirationStatus.NORMAL);
    }
}

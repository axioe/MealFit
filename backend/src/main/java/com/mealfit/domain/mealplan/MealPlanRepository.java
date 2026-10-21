package com.mealfit.domain.mealplan;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {

    List<MealPlan> findByUserIdAndPlanDateBetweenOrderByPlanDateAscMealTypeAsc(
            Long userId, LocalDate from, LocalDate to);

    Optional<MealPlan> findByIdAndUserId(Long id, Long userId);

    /** 해당 날짜의 살아 있는 식단(보통 status = CANCELED를 제외할 때 사용) */
    List<MealPlan> findByUserIdAndPlanDateAndStatusNot(Long userId, LocalDate planDate, MealPlanStatus status);
}

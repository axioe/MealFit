package com.mealfit.domain.mealplan;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {

    List<MealPlan> findByUserIdAndPlanDateBetweenOrderByPlanDateAscMealTypeAsc(
            Long userId, LocalDate from, LocalDate to);

    Optional<MealPlan> findByIdAndUserId(Long id, Long userId);
}

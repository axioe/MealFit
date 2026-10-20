package com.mealfit.domain.cooking;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CookingEventRepository extends JpaRepository<CookingEvent, Long> {

    Optional<CookingEvent> findByIdAndUserId(Long id, Long userId);

    Optional<CookingEvent> findFirstByMealPlanIdAndStatus(Long mealPlanId, CookingStatus status);
}

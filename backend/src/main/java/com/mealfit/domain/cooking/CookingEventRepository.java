package com.mealfit.domain.cooking;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CookingEventRepository extends JpaRepository<CookingEvent, Long> {

    Optional<CookingEvent> findByIdAndUserId(Long id, Long userId);

    Optional<CookingEvent> findFirstByMealPlanIdAndStatus(Long mealPlanId, CookingStatus status);

    boolean existsByMealPlanIdAndStatus(Long mealPlanId, CookingStatus status);

    /** 같은 조리 취소가 동시에 들어와도 복원은 한 번만 되게 잠근다 (BR-10, BR-13). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select event from CookingEvent event where event.id = :id and event.userId = :userId")
    Optional<CookingEvent> findForUpdate(@Param("id") Long id, @Param("userId") Long userId);
}

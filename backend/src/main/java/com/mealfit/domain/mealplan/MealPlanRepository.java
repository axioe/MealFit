package com.mealfit.domain.mealplan;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {

    List<MealPlan> findByUserIdAndPlanDateBetweenOrderByPlanDateAscMealTypeAsc(
            Long userId, LocalDate from, LocalDate to);

    Optional<MealPlan> findByIdAndUserId(Long id, Long userId);

    /** 같은 식단의 조리 요청이 동시에 들어와도 한 번만 처리되게 잠근다 (BR-13). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select plan from MealPlan plan where plan.id = :id and plan.userId = :userId")
    Optional<MealPlan> findForUpdate(@Param("id") Long id, @Param("userId") Long userId);

    /** 해당 날짜의 살아 있는 식단(보통 status = CANCELED를 제외할 때 사용) */
    List<MealPlan> findByUserIdAndPlanDateAndStatusNot(Long userId, LocalDate planDate, MealPlanStatus status);

    /** 장보기 계산 대상: from 날짜 이후의 특정 상태 식단 */
    List<MealPlan> findByUserIdAndStatusAndPlanDateGreaterThanEqual(Long userId, MealPlanStatus status,
                                                                     LocalDate from);
}

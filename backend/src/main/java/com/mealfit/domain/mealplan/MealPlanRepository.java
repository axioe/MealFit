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

    /** 같은 식단의 확정·취소·재추천·조리 요청이 동시에 들어와도 한 번에 하나씩 처리되게 잠근다 (BR-13). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select plan from MealPlan plan where plan.id = :id and plan.userId = :userId")
    Optional<MealPlan> findForUpdate(@Param("id") Long id, @Param("userId") Long userId);

    /** 해당 날짜의 살아 있는 식단(보통 status = CANCELED를 제외할 때 사용) */
    List<MealPlan> findByUserIdAndPlanDateAndStatusNot(Long userId, LocalDate planDate, MealPlanStatus status);

    /**
     * 위와 같은 조회를 잠근 채로 한다. 같은 날짜의 전체 재추천이 동시에 들어와도 하나씩 처리되게 한다 (D06).
     * 잠글 식단이 하나도 없는 날짜의 첫 추천은 막지 못하므로 화면의 중복 클릭 방지와 함께 쓴다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select plan from MealPlan plan where plan.userId = :userId and plan.planDate = :planDate "
            + "and plan.status <> :status order by plan.id")
    List<MealPlan> findForUpdateByDate(@Param("userId") Long userId, @Param("planDate") LocalDate planDate,
                                       @Param("status") MealPlanStatus status);

    /** 장보기 계산 대상: from 날짜 이후의 특정 상태 식단 */
    List<MealPlan> findByUserIdAndStatusAndPlanDateGreaterThanEqual(Long userId, MealPlanStatus status,
                                                                     LocalDate from);
}

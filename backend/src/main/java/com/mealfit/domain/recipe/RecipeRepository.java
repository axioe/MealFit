package com.mealfit.domain.recipe;

import com.mealfit.domain.mealplan.MealType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    /** 공용 레시피(userId null)이거나 본인 레시피일 때만 조회된다. */
    @Query("select r from Recipe r where r.id = :id and (r.userId is null or r.userId = :userId)")
    Optional<Recipe> findAccessibleById(@Param("id") Long id, @Param("userId") Long userId);

    /** 로컬 대체 후보: 공용 LOCAL_FALLBACK 레시피 중 해당 끼니용이거나 끼니 지정이 없는 것 */
    @Query("""
            select r from Recipe r
            where r.userId is null
              and r.source = com.mealfit.domain.recipe.RecipeSource.LOCAL_FALLBACK
              and (r.mealType is null or r.mealType = :mealType)
            order by r.id
            """)
    List<Recipe> findFallbackCandidates(@Param("mealType") MealType mealType);
}

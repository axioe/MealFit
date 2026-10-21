package com.mealfit.domain.recipe;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    /** 공용 레시피(userId null)이거나 본인 레시피일 때만 조회된다. */
    @Query("select r from Recipe r where r.id = :id and (r.userId is null or r.userId = :userId)")
    Optional<Recipe> findAccessibleById(@Param("id") Long id, @Param("userId") Long userId);
}

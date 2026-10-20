package com.mealfit.domain.recipe;

import com.mealfit.global.common.BaseTimeEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "recipes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Recipe extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** null이면 공용(시드/로컬 대체) 레시피 */
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    /** 기준 인분. 실제 필요량 = 재료량 × 실제 인분 / servingSize */
    @Column(name = "serving_size", nullable = false)
    private int servingSize;

    @Column(name = "cook_time_min", nullable = false)
    private int cookTimeMin;

    @Column(precision = 8, scale = 1)
    private BigDecimal calories;

    @Column(name = "protein_g", precision = 8, scale = 1)
    private BigDecimal proteinG;

    @Column(name = "carbs_g", precision = 8, scale = 1)
    private BigDecimal carbsG;

    @Column(name = "fat_g", precision = 8, scale = 1)
    private BigDecimal fatG;

    /** 근거 없는 영양 수치는 true → 화면에 "추정치" 표시 */
    @Column(name = "nutrition_estimated", nullable = false)
    private boolean nutritionEstimated;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecipeSource source;

    @ElementCollection
    @CollectionTable(name = "recipe_steps", joinColumns = @JoinColumn(name = "recipe_id"))
    @OrderColumn(name = "step_order")
    @Column(name = "description", nullable = false, length = 500)
    private List<String> steps = new ArrayList<>();

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecipeIngredient> ingredients = new ArrayList<>();

    @Builder
    private Recipe(Long userId, String name, String description, int servingSize, int cookTimeMin,
                   BigDecimal calories, BigDecimal proteinG, BigDecimal carbsG, BigDecimal fatG,
                   boolean nutritionEstimated, RecipeSource source, List<String> steps) {
        this.userId = userId;
        this.name = name;
        this.description = description;
        this.servingSize = servingSize;
        this.cookTimeMin = cookTimeMin;
        this.calories = calories;
        this.proteinG = proteinG;
        this.carbsG = carbsG;
        this.fatG = fatG;
        this.nutritionEstimated = nutritionEstimated;
        this.source = source;
        if (steps != null) {
            this.steps.addAll(steps);
        }
    }

    public void addIngredient(String ingredientName, BigDecimal requiredQty, String unit) {
        ingredients.add(new RecipeIngredient(this, ingredientName, requiredQty, unit));
    }
}

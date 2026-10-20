package com.mealfit.domain.recipe;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "recipe_ingredients")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @Column(name = "ingredient_name", nullable = false, length = 100)
    private String ingredientName;

    @Column(name = "required_qty", nullable = false, precision = 12, scale = 3)
    private BigDecimal requiredQty;

    @Column(nullable = false, length = 20)
    private String unit;

    RecipeIngredient(Recipe recipe, String ingredientName, BigDecimal requiredQty, String unit) {
        this.recipe = recipe;
        this.ingredientName = ingredientName;
        this.requiredQty = requiredQty;
        this.unit = unit;
    }
}

package com.mealfit.domain.mealplan;

import static org.assertj.core.api.Assertions.assertThat;

import com.mealfit.domain.mealplan.dto.AiMealSuggestion;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class AiSuggestionValidatorTest {

    private static AiMealSuggestion suggestion(String name, Integer servingSize, List<AiMealSuggestion.Ingredient> ingredients,
                                               List<String> steps) {
        return new AiMealSuggestion(MealType.LUNCH, name, null, servingSize, 15,
                new BigDecimal("500"), null, null, null, ingredients, steps, "이유");
    }

    private static AiMealSuggestion.Ingredient ingredient(String name, String qty, String unit) {
        return new AiMealSuggestion.Ingredient(name, qty == null ? null : new BigDecimal(qty), unit);
    }

    private static final List<String> STEPS = List.of("볶는다.");

    @Test
    void 정상_제안은_통과() {
        assertThat(AiSuggestionValidator.validate(
                suggestion("닭볶음", 1, List.of(ingredient("닭고기", "200", "g")), STEPS), Set.of())).isEmpty();
    }

    @Test
    void 형식_오류는_거부() {
        assertThat(AiSuggestionValidator.validate(
                suggestion(" ", 1, List.of(ingredient("닭고기", "200", "g")), STEPS), Set.of())).isPresent();
        assertThat(AiSuggestionValidator.validate(
                suggestion("닭볶음", 0, List.of(ingredient("닭고기", "200", "g")), STEPS), Set.of())).isPresent();
        assertThat(AiSuggestionValidator.validate(
                suggestion("닭볶음", 1, List.of(), STEPS), Set.of())).isPresent();
        assertThat(AiSuggestionValidator.validate(
                suggestion("닭볶음", 1, List.of(ingredient("닭고기", null, "g")), STEPS), Set.of())).isPresent();
        assertThat(AiSuggestionValidator.validate(
                suggestion("닭볶음", 1, List.of(ingredient("닭고기", "-1", "g")), STEPS), Set.of())).isPresent();
        assertThat(AiSuggestionValidator.validate(
                suggestion("닭볶음", 1, List.of(ingredient("닭고기", "200", "")), STEPS), Set.of())).isPresent();
        assertThat(AiSuggestionValidator.validate(
                suggestion("닭볶음", 1, List.of(ingredient("닭고기", "200", "g")), List.of()), Set.of())).isPresent();
    }

    @Test
    void 제한_재료가_포함되면_거부() {
        assertThat(AiSuggestionValidator.validate(
                suggestion("땅콩 국수", 1, List.of(ingredient("땅콩 버터", "20", "g")), STEPS), Set.of("땅콩")))
                .hasValueSatisfying(reason -> assertThat(reason).contains("땅콩 버터"));
    }

    @Test
    void 제한_재료는_공백과_대소문자를_무시하고_포함_여부로_본다() {
        assertThat(IngredientRestriction.violations(List.of("땅콩버터", "우유", "Peanut Oil"), Set.of("땅콩", "peanut")))
                .containsExactly("땅콩버터", "Peanut Oil");
        assertThat(IngredientRestriction.violations(List.of("두유"), Set.of("우유"))).isEmpty();
        assertThat(IngredientRestriction.violations(List.of("달걀"), Set.of())).isEmpty();
    }
}

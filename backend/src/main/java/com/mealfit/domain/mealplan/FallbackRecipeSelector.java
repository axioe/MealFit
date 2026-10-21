package com.mealfit.domain.mealplan;

import com.mealfit.domain.inventory.ExpirationStatus;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeIngredient;
import com.mealfit.domain.recipe.RecipeRepository;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 검증된 로컬 대체 레시피 고르기.
 * 제한 재료가 든 레시피는 항상 제외하고, 나머지는 빼지 않고 다음 순서로 우선순위를 매긴다:
 * 같은 날 다른 끼니와 겹치지 않는 것 → 직전 초안과 다른 것 → 최근에 안 먹은 것
 * → 기한 임박 재료를 많이 쓰는 것 → 보유 재료를 많이 쓰는 것 → 등록 순.
 * 선호 조리 시간을 넘는 레시피는 맞는 후보가 하나도 없을 때만 쓴다.
 */
@Component
@RequiredArgsConstructor
public class FallbackRecipeSelector {

    private final RecipeRepository recipeRepository;

    public record Selection(Recipe recipe, String reason) {
    }

    /**
     * @param availableLots 사용 가능한 재고(기한 경과 제외)
     * @param sameDayNames  같은 날 다른 끼니 메뉴명
     * @param previousNames 직전 초안 메뉴명 (재추천 전 메뉴)
     * @param recentNames   최근 식단 메뉴명
     */
    public Optional<Selection> select(MealType mealType, UserDietProfile profile, List<InventoryLot> availableLots,
                                      Set<String> sameDayNames, Set<String> previousNames,
                                      Collection<String> recentNames, LocalDate today) {
        Set<String> restricted = profile.restrictedIngredients();
        List<Recipe> safe = recipeRepository.findFallbackCandidates(mealType).stream()
                .filter(recipe -> IngredientRestriction.violations(ingredientNames(recipe), restricted).isEmpty())
                .toList();
        if (safe.isEmpty()) {
            return Optional.empty();
        }
        List<Recipe> withinTime = profile.cookTimeMin() == null ? safe : safe.stream()
                .filter(recipe -> recipe.getCookTimeMin() <= profile.cookTimeMin())
                .toList();
        List<Recipe> pool = withinTime.isEmpty() ? safe : withinTime;

        Set<String> stocked = availableLots.stream()
                .map(lot -> lot.getIngredientName().strip())
                .collect(Collectors.toSet());
        Set<String> imminent = availableLots.stream()
                .filter(lot -> isImminent(lot.expirationStatus(today)))
                .map(lot -> lot.getIngredientName().strip())
                .collect(Collectors.toSet());

        Comparator<Recipe> order = Comparator
                .comparing((Recipe recipe) -> sameDayNames.contains(recipe.getName()))
                .thenComparing(recipe -> previousNames.contains(recipe.getName()))
                .thenComparing(recipe -> recentNames.contains(recipe.getName()))
                .thenComparing(recipe -> -matches(recipe, imminent).size())
                .thenComparing(recipe -> -matches(recipe, stocked).size())
                .thenComparing(Recipe::getId);
        Recipe chosen = pool.stream().min(order).orElseThrow();
        return Optional.of(new Selection(chosen, reason(chosen, imminent, stocked)));
    }

    private static boolean isImminent(ExpirationStatus status) {
        return status == ExpirationStatus.TODAY || status == ExpirationStatus.IMMINENT;
    }

    private static List<String> ingredientNames(Recipe recipe) {
        return recipe.getIngredients().stream().map(RecipeIngredient::getIngredientName).toList();
    }

    private static List<String> matches(Recipe recipe, Set<String> names) {
        return ingredientNames(recipe).stream().map(String::strip).filter(names::contains).distinct().toList();
    }

    private static String reason(Recipe recipe, Set<String> imminent, Set<String> stocked) {
        List<String> imminentUsed = matches(recipe, imminent);
        if (!imminentUsed.isEmpty()) {
            return "기한이 임박한 " + String.join(", ", imminentUsed) + "을(를) 먼저 쓰는 식단이에요.";
        }
        List<String> stockedUsed = matches(recipe, stocked);
        if (!stockedUsed.isEmpty()) {
            return "냉장고에 있는 " + String.join(", ", stockedUsed) + "을(를) 활용하는 식단이에요.";
        }
        return "조리 시간과 재료 제약을 확인한 기본 식단이에요.";
    }
}

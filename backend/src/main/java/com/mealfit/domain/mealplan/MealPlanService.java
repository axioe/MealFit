package com.mealfit.domain.mealplan;

import com.mealfit.domain.cooking.CookingEventRepository;
import com.mealfit.domain.cooking.CookingStatus;
import com.mealfit.domain.inventory.ExpirationStatus;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.inventory.InventoryLotRepository;
import com.mealfit.domain.inventory.LotStatus;
import com.mealfit.domain.mealplan.dto.AiMealPlanRequest;
import com.mealfit.domain.mealplan.dto.AiMealSuggestion;
import com.mealfit.domain.mealplan.dto.MealPlanConfirmResponse;
import com.mealfit.domain.mealplan.dto.MealPlanRecommendRequest;
import com.mealfit.domain.mealplan.dto.MealPlanRecommendResponse;
import com.mealfit.domain.mealplan.dto.MealPlanResponse;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeRepository;
import com.mealfit.domain.recipe.RecipeSource;
import com.mealfit.domain.shopping.ShoppingListService;
import com.mealfit.domain.shopping.dto.ShoppingItemResponse;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 식단 추천. AI 제안을 먼저 쓰고, AI가 없거나 실패하거나 서버 검증을 통과하지 못한 끼니는 검증된 로컬 대체로 채운다.
 * 추천 결과는 항상 DRAFT이며 재고를 바꾸지 않는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MealPlanService {

    /** 반복 최소화에 쓰는 최근 식단 기간 (D10 확정 전 임시값) */
    private static final int RECENT_DAYS = 7;
    private static final int MAX_TEXT_LENGTH = 500;

    private final MealPlanRepository mealPlanRepository;
    private final RecipeRepository recipeRepository;
    private final InventoryLotRepository inventoryLotRepository;
    private final FallbackRecipeSelector fallbackRecipeSelector;
    private final ObjectProvider<MealPlanAiClient> aiClientProvider;
    private final ObjectProvider<UserDietProfileProvider> profileProvider;
    private final ShoppingListService shoppingListService;
    private final CookingEventRepository cookingEventRepository;

    /**
     * 하루 세 끼 추천. 같은 날짜로 다시 부르면 전체 재추천이다:
     * 기존 초안은 취소하고, 이미 확정된 끼니는 그대로 두고 나머지 끼니만 새로 만든다.
     */
    @Transactional
    public MealPlanRecommendResponse recommend(Long userId, MealPlanRecommendRequest request) {
        LocalDate planDate = request.planDate();
        List<MealPlan> existing = mealPlanRepository.findByUserIdAndPlanDateAndStatusNot(
                userId, planDate, MealPlanStatus.CANCELED);
        List<MealPlan> confirmed = existing.stream()
                .filter(plan -> plan.getStatus() == MealPlanStatus.CONFIRMED)
                .toList();
        Set<MealType> confirmedTypes = confirmed.stream().map(MealPlan::getMealType).collect(Collectors.toSet());
        List<MealType> targets = Arrays.stream(MealType.values())
                .filter(type -> !confirmedTypes.contains(type))
                .toList();
        if (targets.isEmpty()) {
            throw new BusinessException(ErrorCode.MEAL_PLAN_ALL_CONFIRMED);
        }
        List<MealPlan> drafts = existing.stream()
                .filter(plan -> plan.getStatus() == MealPlanStatus.DRAFT)
                .toList();
        Set<String> previousNames = drafts.stream()
                .map(plan -> plan.getRecipe().getName())
                .collect(Collectors.toSet());
        drafts.forEach(MealPlan::cancel);

        List<MealPlan> created = generate(userId, planDate, targets, request.servingsOrDefault(), confirmed,
                previousNames);
        List<MealPlanResponse> mealPlans = new ArrayList<>();
        confirmed.forEach(plan -> mealPlans.add(MealPlanResponse.from(plan)));
        created.forEach(plan -> mealPlans.add(MealPlanResponse.from(plan)));
        mealPlans.sort(Comparator.comparing(MealPlanResponse::mealType));
        return new MealPlanRecommendResponse(planDate, mealPlans);
    }

    /** 한 끼 재추천. 초안만 가능하며, 같은 날 다른 끼니는 바꾸지 않는다. */
    @Transactional
    public MealPlanResponse regenerate(Long userId, Long mealPlanId) {
        MealPlan plan = findPlan(userId, mealPlanId);
        if (plan.getStatus() != MealPlanStatus.DRAFT) {
            throw new BusinessException(ErrorCode.MEAL_PLAN_NOT_DRAFT);
        }
        List<MealPlan> others = mealPlanRepository.findByUserIdAndPlanDateAndStatusNot(
                        userId, plan.getPlanDate(), MealPlanStatus.CANCELED).stream()
                .filter(other -> !other.getId().equals(plan.getId()))
                .toList();
        plan.cancel();

        List<MealPlan> created = generate(userId, plan.getPlanDate(), List.of(plan.getMealType()),
                plan.getServings(), others, Set.of(plan.getRecipe().getName()));
        return MealPlanResponse.from(created.get(0));
    }

    /**
     * 서버 검증 후 확정 (FR-MEAL-05, BR-12). 레시피 데이터와 알레르기·제외 재료를 다시 검사하고,
     * 통과하면 CONFIRMED로 바꾼 뒤 장보기 부족분을 다시 계산한다.
     */
    @Transactional
    public MealPlanConfirmResponse confirm(Long userId, Long mealPlanId) {
        MealPlan plan = findPlan(userId, mealPlanId);
        plan.getStatus().validateTransition(MealPlanStatus.CONFIRMED);
        Recipe recipe = plan.getRecipe();

        List<String> problems = dataProblems(recipe, plan);
        if (!problems.isEmpty()) {
            throw new BusinessException(ErrorCode.MEAL_PLAN_INVALID_DATA,
                    ErrorCode.MEAL_PLAN_INVALID_DATA.getMessage() + " (" + String.join(", ", problems) + ")");
        }
        List<String> ingredientNames = recipe.getIngredients().stream()
                .map(ingredient -> ingredient.getIngredientName().strip())
                .toList();
        List<String> violations = IngredientRestriction.violations(
                ingredientNames, profileOf(userId).restrictedIngredients());
        if (!violations.isEmpty()) {
            throw new BusinessException(ErrorCode.MEAL_PLAN_RESTRICTED_INGREDIENT,
                    ErrorCode.MEAL_PLAN_RESTRICTED_INGREDIENT.getMessage()
                            + " (" + String.join(", ", violations) + ")");
        }

        plan.confirm();
        List<ShoppingItemResponse> shortages = shoppingListService.recalculate(userId, LocalDate.now()).stream()
                .filter(item -> ingredientNames.contains(item.getIngredientName()))
                .filter(item -> item.remainingQty().signum() > 0)
                .map(ShoppingItemResponse::from)
                .toList();
        return new MealPlanConfirmResponse(MealPlanResponse.from(plan), shortages);
    }

    /**
     * 식단 취소 (FR-MEAL-06). 초안·확정 식단을 취소하고, 확정 식단이었다면 장보기 부족분을 다시 계산한다.
     * 이미 조리한 식단은 조리를 먼저 취소해야 한다(재고 복원이 먼저).
     */
    @Transactional
    public MealPlanResponse cancel(Long userId, Long mealPlanId) {
        MealPlan plan = findPlan(userId, mealPlanId);
        if (cookingEventRepository.existsByMealPlanIdAndStatus(plan.getId(), CookingStatus.COOKED)) {
            throw new BusinessException(ErrorCode.MEAL_PLAN_ALREADY_COOKED);
        }
        boolean wasConfirmed = plan.getStatus() == MealPlanStatus.CONFIRMED;
        plan.cancel();
        if (wasConfirmed) {
            shoppingListService.recalculate(userId, LocalDate.now());
        }
        return MealPlanResponse.from(plan);
    }

    private MealPlan findPlan(Long userId, Long mealPlanId) {
        return mealPlanRepository.findByIdAndUserId(mealPlanId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEAL_PLAN_NOT_FOUND));
    }

    /** 확정 전 데이터 무결성 검사: 재료·수량·단위 누락, 비정상 인분 */
    private static List<String> dataProblems(Recipe recipe, MealPlan plan) {
        List<String> problems = new ArrayList<>();
        if (recipe.getServingSize() < 1 || plan.getServings() < 1) {
            problems.add("인분 비정상");
        }
        if (recipe.getIngredients().isEmpty()) {
            problems.add("재료 누락");
        }
        recipe.getIngredients().forEach(ingredient -> {
            String name = ingredient.getIngredientName();
            if (name == null || name.isBlank()) {
                problems.add("재료명 누락");
            } else if (ingredient.getRequiredQty() == null || ingredient.getRequiredQty().signum() <= 0) {
                problems.add("수량 비정상: " + name.strip());
            } else if (ingredient.getUnit() == null || ingredient.getUnit().isBlank()) {
                problems.add("단위 누락: " + name.strip());
            }
        });
        return problems;
    }

    private UserDietProfile profileOf(Long userId) {
        return Optional.ofNullable(profileProvider.getIfAvailable())
                .map(provider -> provider.getProfile(userId))
                .orElseGet(UserDietProfile::empty);
    }

    /**
     * @param keptPlans     같은 날 그대로 두는 끼니 (메뉴가 겹치지 않게 한다)
     * @param previousNames 직전 초안 메뉴명 (가능하면 다른 메뉴를 고른다)
     */
    private List<MealPlan> generate(Long userId, LocalDate planDate, List<MealType> targets, int servings,
                                    List<MealPlan> keptPlans, Set<String> previousNames) {
        LocalDate today = LocalDate.now();
        UserDietProfile profile = profileOf(userId);
        List<InventoryLot> availableLots = inventoryLotRepository
                .findByUserIdAndStatusOrderByExpiryDateAsc(userId, LotStatus.ACTIVE).stream()
                .filter(lot -> lot.expirationStatus(today) != ExpirationStatus.EXPIRED)
                .toList();
        List<String> keptNames = keptPlans.stream().map(plan -> plan.getRecipe().getName()).toList();
        List<String> recentNames = recentRecipeNames(userId, planDate);

        AiMealPlanRequest aiRequest = new AiMealPlanRequest(planDate, targets, servings,
                profile.goal(), profile.cookTimeMin(), profile.mealBudget(),
                profile.allergies(), profile.excludedIngredients(),
                availableLots.stream()
                        .map(lot -> new AiMealPlanRequest.InventoryItem(lot.getIngredientName(), lot.getQuantity(),
                                lot.getUnit(), lot.getExpiryDate(), lot.expirationStatus(today)))
                        .toList(),
                keptNames, recentNames);
        Map<MealType, AiMealSuggestion> aiSuggestions = requestAi(aiRequest, profile.restrictedIngredients());

        Set<String> usedNames = new HashSet<>(keptNames);
        List<MealPlan> created = new ArrayList<>();
        for (MealType mealType : targets) {
            AiMealSuggestion suggestion = aiSuggestions.get(mealType);
            Recipe recipe;
            String reason;
            if (suggestion != null && !usedNames.contains(suggestion.recipeName().strip())
                    && !previousNames.contains(suggestion.recipeName().strip())) {
                recipe = recipeRepository.save(toRecipe(userId, suggestion));
                reason = suggestion.reason();
            } else {
                FallbackRecipeSelector.Selection selection = fallbackRecipeSelector
                        .select(mealType, profile, availableLots, usedNames, previousNames, recentNames, today)
                        .orElseThrow(() -> new BusinessException(ErrorCode.MEAL_PLAN_NO_CANDIDATE));
                recipe = selection.recipe();
                reason = selection.reason();
            }
            usedNames.add(recipe.getName());
            created.add(mealPlanRepository.save(MealPlan.builder()
                    .userId(userId)
                    .planDate(planDate)
                    .mealType(mealType)
                    .recipe(recipe)
                    .servings(servings)
                    .recommendationReason(truncate(reason))
                    .build()));
        }
        return created;
    }

    /** AI 제안 중 요청한 끼니이고 서버 검증을 통과한 것만 남긴다. 실패하면 빈 결과(전부 로컬 대체). */
    private Map<MealType, AiMealSuggestion> requestAi(AiMealPlanRequest request, Set<String> restricted) {
        MealPlanAiClient aiClient = aiClientProvider.getIfAvailable();
        if (aiClient == null) {
            return Map.of();
        }
        List<AiMealSuggestion> suggestions;
        try {
            suggestions = aiClient.recommend(request);
        } catch (RuntimeException e) {
            log.warn("AI 식단 추천 실패, 로컬 대체로 전환합니다: {}", e.getMessage());
            return Map.of();
        }
        Map<MealType, AiMealSuggestion> valid = new EnumMap<>(MealType.class);
        for (AiMealSuggestion suggestion : suggestions == null ? List.<AiMealSuggestion>of() : suggestions) {
            if (suggestion == null || !request.mealTypes().contains(suggestion.mealType())
                    || valid.containsKey(suggestion.mealType())) {
                continue;
            }
            Optional<String> problem = AiSuggestionValidator.validate(suggestion, restricted);
            if (problem.isPresent()) {
                log.warn("AI 제안을 버리고 로컬 대체로 전환합니다 ({}): {}", suggestion.mealType(), problem.get());
                continue;
            }
            valid.put(suggestion.mealType(), suggestion);
        }
        return valid;
    }

    private Recipe toRecipe(Long userId, AiMealSuggestion suggestion) {
        Recipe recipe = Recipe.builder()
                .userId(userId)
                .name(suggestion.recipeName().strip())
                .description(truncate(suggestion.description()))
                .servingSize(suggestion.servingSize())
                .cookTimeMin(suggestion.cookTimeMin())
                .calories(suggestion.calories())
                .proteinG(suggestion.proteinG())
                .carbsG(suggestion.carbsG())
                .fatG(suggestion.fatG())
                .nutritionEstimated(true)
                .source(RecipeSource.AI_GENERATED)
                .mealType(suggestion.mealType())
                .steps(suggestion.steps().stream().map(String::strip).toList())
                .build();
        suggestion.ingredients().forEach(ingredient ->
                recipe.addIngredient(ingredient.name().strip(), ingredient.quantity(), ingredient.unit().strip()));
        return recipe;
    }

    private List<String> recentRecipeNames(Long userId, LocalDate planDate) {
        return mealPlanRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAscMealTypeAsc(
                        userId, planDate.minusDays(RECENT_DAYS), planDate.minusDays(1)).stream()
                .filter(plan -> plan.getStatus() != MealPlanStatus.CANCELED)
                .map(plan -> plan.getRecipe().getName())
                .distinct()
                .toList();
    }

    private static String truncate(String text) {
        if (text == null) {
            return null;
        }
        String stripped = text.strip();
        return stripped.length() <= MAX_TEXT_LENGTH ? stripped : stripped.substring(0, MAX_TEXT_LENGTH);
    }
}

package com.mealfit.domain.ai;

import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.inventory.InventoryLotRepository;
import com.mealfit.domain.inventory.LotStatus;
import com.mealfit.domain.mealplan.IngredientRestriction;
import com.mealfit.domain.mealplan.UserDietProfile;
import com.mealfit.domain.mealplan.UserDietProfileProvider;
import jakarta.validation.Validator;
import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Service
public class QuickRecipeService {
    private final RestClient ai;
    private final InventoryLotRepository inventory;
    private final ObjectProvider<UserDietProfileProvider> profiles;
    private final Validator validator;

    public QuickRecipeService(@Qualifier("aiRestClient") RestClient ai, InventoryLotRepository inventory,
                              ObjectProvider<UserDietProfileProvider> profiles, Validator validator) {
        this.ai = ai; this.inventory = inventory; this.profiles = profiles; this.validator = validator;
    }

    public QuickRecipeModels.Response recommend(Long userId, QuickRecipeModels.Request request) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        // 요청 수량을 신뢰하지 않고 본인의 사용 가능한 재고를 읽는다.
        List<InventoryLot> lots = inventory.findByUserIdAndStatusOrderByExpiryDateAsc(userId, LotStatus.ACTIVE).stream()
                .filter(lot -> lot.getQuantity().signum() > 0 && (lot.getExpiryDate() == null || !lot.getExpiryDate().isBefore(today)))
                .toList();
        Set<Long> selected = new HashSet<>(request.selectedLotIds());
        Set<Long> available = lots.stream().map(InventoryLot::getId).collect(java.util.stream.Collectors.toSet());
        if (selected.isEmpty() || !available.containsAll(selected))
            throw new QuickRecipeException(400, "QUICK_AI_001", "선택한 재료를 현재 냉장고에서 확인할 수 없습니다. 다시 선택해 주세요.");
        if (lots.size() > 100)
            throw new QuickRecipeException(400, "QUICK_AI_001", "추천 서비스는 사용 가능한 재고 묶음 100개까지 지원합니다.");
        UserDietProfileProvider provider = profiles.getIfAvailable();
        UserDietProfile profile = provider == null ? UserDietProfile.empty() : provider.getProfile(userId);
        if (profile == null) profile = UserDietProfile.empty();
        List<String> names = lots.stream().filter(lot -> selected.contains(lot.getId())).map(lot -> lot.getIngredientName().strip()).distinct().toList();
        if (!IngredientRestriction.violations(names, profile.restrictedIngredients()).isEmpty())
            throw new QuickRecipeException(400, "QUICK_AI_001", "알레르기·제외 조건에 해당하는 재료는 선택할 수 없습니다.");
        var body = new QuickRecipeModels.AiRequest(lots.stream().map(lot -> new QuickRecipeModels.Stock(
                lot.getIngredientName().strip(), lot.getQuantity(), lot.getUnit(), lot.getExpiryDate())).toList(), names,
                request.maxCookingMinutes(), request.recommendationCount(), profile.goal(), profile.allergies(), profile.excludedIngredients());
        QuickRecipeModels.Response result;
        try {
            result = ai.post().uri("/ai/quick-recipes").body(body).retrieve().body(QuickRecipeModels.Response.class);
        } catch (RestClientResponseException failure) {
            if (failure.getStatusCode().value() == 504) throw timeout();
            if (failure.getStatusCode().value() == 503)
                throw new QuickRecipeException(503, "QUICK_AI_002", "AI 추천 서비스 설정을 확인해 주세요.");
            throw new QuickRecipeException(502, "QUICK_AI_003", "AI 추천 서비스가 정상 응답하지 않았습니다. 다시 시도해 주세요.");
        } catch (ResourceAccessException failure) {
            for (Throwable cause = failure; cause != null; cause = cause.getCause())
                if (cause instanceof SocketTimeoutException || cause instanceof HttpTimeoutException) throw timeout();
            throw new QuickRecipeException(503, "QUICK_AI_002", "AI 추천 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
        } catch (RestClientException failure) {
            throw invalidResponse();
        }
        if (result == null || !validator.validate(result).isEmpty() || result.recipes().size() != request.recommendationCount()) throw invalidResponse();
        for (var recipe : result.recipes()) {
            List<String> ingredientNames = recipe.ingredients().stream().map(ingredient -> ingredient.name().strip()).toList();
            if (recipe.cookingMinutes() > request.maxCookingMinutes() || !IngredientRestriction.violations(ingredientNames, profile.restrictedIngredients()).isEmpty()
                    || ingredientNames.stream().noneMatch(names::contains)) throw invalidResponse();
        }
        return result;
    }

    private static QuickRecipeException timeout() {
        return new QuickRecipeException(504, "QUICK_AI_004", "AI 추천 응답 시간이 초과되었습니다. 다시 시도해 주세요.");
    }
    private static QuickRecipeException invalidResponse() {
        return new QuickRecipeException(502, "QUICK_AI_005", "AI 추천 결과를 확인하지 못했습니다. 다시 시도해 주세요.");
    }
}

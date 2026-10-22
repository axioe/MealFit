package com.mealfit.domain.ai;

import com.mealfit.domain.mealplan.MealPlanAiClient;
import com.mealfit.domain.mealplan.dto.AiMealPlanRequest;
import com.mealfit.domain.mealplan.dto.AiMealSuggestion;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Profile;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@Profile("!test")
public class FlaskMealPlanAiClient implements MealPlanAiClient {
    private final RestClient ai;

    public FlaskMealPlanAiClient(@Qualifier("aiRestClient") RestClient ai) {
        this.ai = ai;
    }

    @Override
    public List<AiMealSuggestion> recommend(AiMealPlanRequest request) {
        try {
            List<AiMealSuggestion> result = ai.post().uri("/ai/meal-plans").body(request).retrieve()
                    .body(new ParameterizedTypeReference<List<AiMealSuggestion>>() {});
            if (result == null || result.stream().anyMatch(java.util.Objects::isNull)) {
                throw new IllegalStateException("AI 식단 응답이 비어 있습니다.");
            }
            return result;
        } catch (RestClientException failure) {
            // 외부 응답 원문이 기존 서비스 로그에 노출되지 않도록 한다.
            throw new IllegalStateException("AI 식단 서비스에 연결하지 못했습니다.");
        }
    }
}

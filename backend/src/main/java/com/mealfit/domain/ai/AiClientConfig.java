package com.mealfit.domain.ai;

import org.springframework.boot.http.client.ClientHttpRequestFactoryBuilder;
import org.springframework.boot.http.client.ClientHttpRequestFactorySettings;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Python AI 서비스(/ai/*) 호출용 RestClient.
 * 사용 예: aiRestClient.post().uri("/ai/meal-plans").body(req).retrieve().body(AiMealPlanResponse.class)
 * 호출 실패/타임아웃 시 로컬 대체 식단으로 폴백하고 RecipeSource.LOCAL_FALLBACK으로 표기한다.
 */
@Configuration
public class AiClientConfig {

    @Bean
    public RestClient aiRestClient(RestClient.Builder builder, AiServiceProperties properties) {
        ClientHttpRequestFactorySettings settings = ClientHttpRequestFactorySettings.defaults()
                .withConnectTimeout(properties.connectTimeout())
                .withReadTimeout(properties.readTimeout());
        return builder
                .baseUrl(properties.baseUrl())
                .requestFactory(ClientHttpRequestFactoryBuilder.detect().build(settings))
                .build();
    }
}

package com.mealfit.global.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Swagger UI: http://localhost:8080/swagger-ui.html */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI mealFitOpenApi() {
        return new OpenAPI()
                .info(new Info().title("MealFit API").version("v1")
                        .description("냉장고 재고 기반 AI 식단 추천 서비스 API"));
    }
}

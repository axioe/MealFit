package com.mealfit.domain.ai;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mealfit.ai")
public record AiServiceProperties(
        String baseUrl,
        Duration connectTimeout,
        Duration readTimeout
) {
}

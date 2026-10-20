package com.mealfit.global.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mealfit.cors")
public record CorsProperties(List<String> allowedOrigins) {
}

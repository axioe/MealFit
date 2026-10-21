package com.mealfit.domain.mealplan;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * 알레르기·제외 재료 검사.
 * 임시 규칙(D09 확정 전): 공백을 지우고 소문자로 맞춘 뒤, 재료명에 제한 재료명이 포함되면 위반으로 본다.
 * 예) 제한 "땅콩" → "땅콩버터"도 차단
 */
public final class IngredientRestriction {

    private IngredientRestriction() {
    }

    /** 위반한 재료명 목록. 비어 있으면 통과 */
    public static List<String> violations(Collection<String> ingredientNames, Set<String> restricted) {
        if (restricted.isEmpty()) {
            return List.of();
        }
        List<String> normalizedRestricted = restricted.stream()
                .map(IngredientRestriction::normalize)
                .filter(term -> !term.isEmpty())
                .toList();
        return ingredientNames.stream()
                .filter(name -> {
                    String normalized = normalize(name);
                    return normalizedRestricted.stream().anyMatch(normalized::contains);
                })
                .toList();
    }

    private static String normalize(String value) {
        return value == null ? "" : value.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }
}

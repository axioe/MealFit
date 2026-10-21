package com.mealfit.domain.recipe;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 수량 + 단위. 인분 환산과 단위 환산(kg↔g, L↔ml)을 한곳에서 처리한다.
 * 개·팩·마리처럼 환산 규칙이 없는 단위는 단위 문자열이 같을 때만 더할 수 있다.
 * 개수로 세는 단위는 인분 환산 결과를 정수로 올림한다 (1.5개 → 2개).
 */
public record Quantity(BigDecimal amount, String unit) {

    /** DB 컬럼 DECIMAL(12,3)과 같은 소수 자릿수 */
    public static final int SCALE = 3;

    /** 기본 단위로 바꿀 때 곱하는 값. key는 소문자 단위 */
    private static final Map<String, Conversion> CONVERSIONS = Map.of(
            "kg", new Conversion("g", new BigDecimal("1000")),
            "g", new Conversion("g", BigDecimal.ONE),
            "l", new Conversion("ml", new BigDecimal("1000")),
            "ml", new Conversion("ml", BigDecimal.ONE));

    /** 나눠 쓸 수 없어 정수로 올림하는 단위. 큰술·컵·g·ml 등은 소수 그대로 둔다. */
    private static final Set<String> COUNT_UNITS = Set.of(
            "개", "팩", "마리", "봉", "봉지", "캔", "병", "알", "쪽", "장", "모", "송이", "단");

    private record Conversion(String baseUnit, BigDecimal factor) {
    }

    public Quantity {
        if (amount == null || unit == null || unit.isBlank()) {
            throw new IllegalArgumentException("수량과 단위는 필수입니다.");
        }
        amount = amount.setScale(SCALE, RoundingMode.HALF_UP);
        unit = unit.trim();
    }

    public static Quantity of(BigDecimal amount, String unit) {
        return new Quantity(amount, unit);
    }

    /** 실제 필요량 = 재료량 × 실제 인분 ÷ 기준 인분. 개수 단위는 정수로 올림한다. */
    public Quantity scaleServings(int baseServings, int servings) {
        if (baseServings <= 0 || servings <= 0) {
            throw new IllegalArgumentException("인분은 1 이상이어야 합니다.");
        }
        BigDecimal multiplied = amount.multiply(BigDecimal.valueOf(servings));
        BigDecimal baseDivisor = BigDecimal.valueOf(baseServings);
        BigDecimal scaled = isCountUnit()
                ? multiplied.divide(baseDivisor, 0, RoundingMode.CEILING)
                : multiplied.divide(baseDivisor, SCALE, RoundingMode.HALF_UP);
        return new Quantity(scaled, unit);
    }

    /** 개·팩·마리처럼 개수로 세는 단위인지 */
    public boolean isCountUnit() {
        return COUNT_UNITS.contains(unit);
    }

    /** kg → g, L → ml. 환산 규칙이 없는 단위는 그대로 돌려준다. */
    public Quantity toBaseUnit() {
        Conversion conversion = CONVERSIONS.get(unit.toLowerCase(Locale.ROOT));
        if (conversion == null) {
            return this;
        }
        return new Quantity(amount.multiply(conversion.factor()), conversion.baseUnit());
    }

    /** 기본 단위로 바꿨을 때 단위가 같으면 더할 수 있다 (예: 1kg + 200g, 2개 + 1개). */
    public boolean isSummableWith(Quantity other) {
        return toBaseUnit().unit().equals(other.toBaseUnit().unit());
    }

    /** 두 수량을 기본 단위로 더한다. 단위가 다르면(예: 개 + 팩) 더하지 않고 예외를 던진다. */
    public Quantity plus(Quantity other) {
        if (!isSummableWith(other)) {
            throw new IllegalArgumentException("단위가 달라 더할 수 없습니다: " + unit + ", " + other.unit());
        }
        Quantity base = toBaseUnit();
        return new Quantity(base.amount().add(other.toBaseUnit().amount()), base.unit());
    }
}

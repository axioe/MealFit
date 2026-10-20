package com.mealfit.domain.inventory;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/** 기한 상태 5단계: 정상 / 임박(3일 이내) / 오늘 만료 / 기간 경과 / 미등록 */
public enum ExpirationStatus {
    NORMAL,
    IMMINENT,
    TODAY,
    EXPIRED,
    UNKNOWN;

    public static final int IMMINENT_DAYS = 3;

    public static ExpirationStatus of(LocalDate expiryDate, LocalDate today) {
        if (expiryDate == null) {
            return UNKNOWN;
        }
        long days = ChronoUnit.DAYS.between(today, expiryDate);
        if (days < 0) {
            return EXPIRED;
        }
        if (days == 0) {
            return TODAY;
        }
        return days <= IMMINENT_DAYS ? IMMINENT : NORMAL;
    }
}

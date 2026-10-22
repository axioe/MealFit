package com.mealfit.domain.ai;

import lombok.Getter;

@Getter
public class QuickRecipeException extends RuntimeException {
    private final int status;
    private final String code;
    public QuickRecipeException(int status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

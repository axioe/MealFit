package com.mealfit.domain.user.dto;

import com.mealfit.domain.user.Goal;
import com.mealfit.domain.user.Profile;
import java.util.List;

public record ProfileResponse(
        String nickname,
        Goal goal,
        int cookingTimePref,
        Integer budgetPerMeal,
        List<String> allergies,
        List<String> excludedIngredients
) {

    public static ProfileResponse from(Profile profile) {
        return new ProfileResponse(
                profile.getNickname(),
                profile.getGoal(),
                profile.getCookingTimePref(),
                profile.getBudgetPerMeal(),
                List.copyOf(profile.getAllergies()),
                List.copyOf(profile.getExcludedIngredients()));
    }
}

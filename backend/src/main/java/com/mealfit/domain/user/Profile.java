package com.mealfit.domain.user;

import com.mealfit.global.common.BaseTimeEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자 식단 설정. 알레르기·제외 재료는 AI 추천 입력이자 서버 검증(확정 차단) 기준이다.
 */
@Getter
@Entity
@Table(name = "profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Profile extends BaseTimeEntity {

    public static final int DEFAULT_COOKING_TIME = 20;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Goal goal;

    /** 선호 조리 시간(분): 10 / 20 / 30 */
    @Column(name = "cooking_time_pref", nullable = false)
    private int cookingTimePref;

    /** 한 끼 예산(원). 미입력 시 null */
    @Column(name = "budget_per_meal")
    private Integer budgetPerMeal;

    @ElementCollection
    @CollectionTable(name = "profile_allergies", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "allergy", length = 100)
    private Set<String> allergies = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "profile_excluded_ingredients", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "ingredient_name", length = 100)
    private Set<String> excludedIngredients = new LinkedHashSet<>();

    public static Profile createDefault(Long userId, String nickname) {
        Profile profile = new Profile();
        profile.userId = userId;
        profile.nickname = nickname;
        profile.goal = Goal.MAINTAIN;
        profile.cookingTimePref = DEFAULT_COOKING_TIME;
        return profile;
    }

    public void update(String nickname, Goal goal, int cookingTimePref, Integer budgetPerMeal,
                       Collection<String> allergies, Collection<String> excludedIngredients) {
        this.nickname = nickname;
        this.goal = goal;
        this.cookingTimePref = cookingTimePref;
        this.budgetPerMeal = budgetPerMeal;
        replace(this.allergies, allergies);
        replace(this.excludedIngredients, excludedIngredients);
    }

    private static void replace(Set<String> target, Collection<String> values) {
        target.clear();
        if (values == null) {
            return;
        }
        values.stream()
                .map(String::trim)
                .filter(v -> !v.isEmpty())
                .forEach(target::add);
    }
}

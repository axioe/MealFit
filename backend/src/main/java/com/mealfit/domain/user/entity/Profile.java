package com.mealfit.domain.user.entity;

import com.mealfit.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Profile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(length = 20)
    private String goal;

    @Column(name = "cook_time_min")
    private Integer cookTimeMin;

    @Column(name = "meal_budget")
    private Integer mealBudget;

    @Getter(AccessLevel.NONE)
    @ElementCollection
    @CollectionTable(
        name = "profile_allergies",
        joinColumns = @JoinColumn(name = "profile_id")
    )
    @Column(name = "ingredient_name", nullable = false, length = 100)
    private Set<String> allergies = new HashSet<>();

    @Getter(AccessLevel.NONE)
    @ElementCollection
    @CollectionTable(
        name = "profile_excluded_ingredients",
        joinColumns = @JoinColumn(name = "profile_id")
    )
    @Column(name = "ingredient_name", nullable = false, length = 100)
    private Set<String> excludedIngredients = new HashSet<>();

    public static Profile create(Long userId, String nickname) {
        Profile profile = new Profile();
        profile.userId = userId;
        profile.nickname = nickname;
        return profile;
    }

    public Set<String> getAllergies() {
        return Set.copyOf(allergies);
    }

    public Set<String> getExcludedIngredients() {
        return Set.copyOf(excludedIngredients);
    }
}

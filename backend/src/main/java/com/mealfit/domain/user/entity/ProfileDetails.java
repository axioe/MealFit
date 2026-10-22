package com.mealfit.domain.user.entity;

import com.mealfit.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 프로필의 신체·운동·체력 설정입니다. 기존 식단 프로필과 회원별로 연결됩니다. */
@Getter
@Entity
@Table(name = "profile_details")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProfileDetails extends BaseTimeEntity {
    @Id
    @Column(name = "profile_id")
    private Long profileId;

    @Column(name = "age")
    private Integer age;

    @Column(name = "height", precision = 4, scale = 1)
    private BigDecimal height;

    @Column(name = "current_weight", precision = 4, scale = 1)
    private BigDecimal currentWeight;

    @Column(name = "target_weight", precision = 4, scale = 1)
    private BigDecimal targetWeight;

    @Column(name = "gender", length = 30)
    private String gender;

    @Column(name = "activity_level", length = 30)
    private String activityLevel;

    @Column(name = "workout_goal", length = 30)
    private String workoutGoal;

    @Column(name = "workout_level", length = 30)
    private String workoutLevel;

    @Column(name = "environment", length = 30)
    private String environment;

    @Column(name = "workout_minutes")
    private Integer workoutMinutes;

    @Column(name = "days_per_week")
    private Integer daysPerWeek;

    @Column(name = "diet_type", length = 30)
    private String dietType;

    @Column(name = "default_servings")
    private Integer defaultServings;

    @Column(name = "prioritize_fridge")
    private Boolean prioritizeFridge = false;

    @Column(name = "resting_heart_rate")
    private Integer restingHeartRate;

    @Column(name = "pushups")
    private Integer pushups;

    @Column(name = "squat30s")
    private Integer squat30s;

    @Column(name = "plank_seconds")
    private Integer plankSeconds;

    @Getter(AccessLevel.NONE)
    @ElementCollection
    @CollectionTable(name = "profile_detail_equipment", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "item_name", nullable = false, length = 100)
    private Set<String> equipment = new HashSet<>();

    public Set<String> getEquipment() { return Set.copyOf(equipment); }

    @Getter(AccessLevel.NONE)
    @ElementCollection
    @CollectionTable(name = "profile_detail_injuries", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "item_name", nullable = false, length = 100)
    private Set<String> injuries = new HashSet<>();

    public Set<String> getInjuries() { return Set.copyOf(injuries); }

    @Getter(AccessLevel.NONE)
    @ElementCollection
    @CollectionTable(name = "profile_detail_preferred_foods", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "item_name", nullable = false, length = 100)
    private Set<String> preferredFoods = new HashSet<>();

    public Set<String> getPreferredFoods() { return Set.copyOf(preferredFoods); }

    public static ProfileDetails create(Long profileId) {
        ProfileDetails details = new ProfileDetails();
        details.profileId = profileId;
        return details;
    }

    /** Body 탭의 값만 수정하며 다른 탭 설정은 보존합니다. */
    public void updateBody(Integer age, BigDecimal height, BigDecimal currentWeight, BigDecimal targetWeight, String gender, String activityLevel) {
        this.age = age;
        this.height = height;
        this.currentWeight = currentWeight;
        this.targetWeight = targetWeight;
        this.gender = gender;
        this.activityLevel = activityLevel;
    }

    /** Trainer 탭의 값만 수정하며 다른 탭 설정은 보존합니다. */
    public void updateTrainer(Integer age, BigDecimal height, BigDecimal currentWeight, String workoutGoal, String workoutLevel, String environment, Integer workoutMinutes, String dietType, Set<String> equipment, Set<String> injuries) {
        this.age = age;
        this.height = height;
        this.currentWeight = currentWeight;
        this.workoutGoal = workoutGoal;
        this.workoutLevel = workoutLevel;
        this.environment = environment;
        this.workoutMinutes = workoutMinutes;
        this.dietType = dietType;
        this.equipment.clear();
        this.equipment.addAll(equipment);
        this.injuries.clear();
        this.injuries.addAll(injuries);
    }

    /** Diet 탭의 값만 수정하며 다른 탭 설정은 보존합니다. */
    public void updateDiet(Integer defaultServings, Boolean prioritizeFridge, Set<String> preferredFoods) {
        this.defaultServings = defaultServings;
        this.prioritizeFridge = prioritizeFridge;
        this.preferredFoods.clear();
        this.preferredFoods.addAll(preferredFoods);
    }

    /** Fitness 탭의 값만 수정하며 다른 탭 설정은 보존합니다. */
    public void updateFitness(String workoutGoal, String workoutLevel, Integer workoutMinutes, Integer daysPerWeek, Set<String> equipment, Set<String> injuries) {
        this.workoutGoal = workoutGoal;
        this.workoutLevel = workoutLevel;
        this.workoutMinutes = workoutMinutes;
        this.daysPerWeek = daysPerWeek;
        this.equipment.clear();
        this.equipment.addAll(equipment);
        this.injuries.clear();
        this.injuries.addAll(injuries);
    }

    /** Tests 탭의 값만 수정하며 다른 탭 설정은 보존합니다. */
    public void updateTests(Integer restingHeartRate, Integer pushups, Integer squat30s, Integer plankSeconds) {
        this.restingHeartRate = restingHeartRate;
        this.pushups = pushups;
        this.squat30s = squat30s;
        this.plankSeconds = plankSeconds;
    }

}

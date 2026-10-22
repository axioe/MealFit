package com.mealfit.domain.user.service;

import com.mealfit.domain.user.dto.*;
import com.mealfit.domain.user.entity.Profile;
import com.mealfit.domain.user.entity.ProfileDetails;
import com.mealfit.domain.user.repository.*;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 여러 탭에 표시되는 나이·운동 조건·알레르기는 동일한 저장 값을 공유합니다. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileDetailsService {
    private final ProfileRepository profiles;
    private final ProfileDetailsRepository detailsRepository;
    private final UserRepository users;

    public ProfileDetailsResponse get(Long userId) {
        Profile profile = findProfile(userId, false);
        ProfileDetails details = detailsRepository.findById(profile.getId())
            .orElseGet(() -> ProfileDetails.create(profile.getId()));
        return response(profile, details);
    }

    /** 부모 프로필 행을 잠가 추가 설정의 최초 생성과 탭별 저장을 직렬화합니다. */
    private Profile findProfile(Long userId, boolean lock) {
        if (!users.existsById(userId)) throw new BusinessException(ErrorCode.UNAUTHORIZED);
        return (lock ? profiles.findByUserIdForUpdate(userId) : profiles.findByUserId(userId))
            .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR));
    }

    private ProfileDetails details(Profile profile) {
        return detailsRepository.findById(profile.getId())
            .orElseGet(() -> detailsRepository.save(ProfileDetails.create(profile.getId())));
    }

    private Set<String> normalize(Set<String> values) {
        return values.stream().map(String::trim).collect(Collectors.toSet());
    }

    private void validateWorkout(Integer minutes, Set<String> equipment) {
        if (minutes != null && minutes % 5 != 0)
            throw new BusinessException(ErrorCode.INVALID_INPUT, "운동 시간은 5분 단위로 입력해 주세요.");
        if (equipment.contains("none") && equipment.size() > 1)
            throw new BusinessException(ErrorCode.INVALID_INPUT, "장비 없음은 다른 장비와 함께 선택할 수 없습니다.");
    }

    @Transactional
    public ProfileDetailsResponse updateBody(Long userId, BodyProfileRequest request) {
        Profile profile = findProfile(userId, true);
        ProfileDetails details = details(profile);
        profile.updateDietProfile(request.nickname().trim(), profile.getGoal(), profile.getCookTimeMin(),
            profile.getMealBudget(), profile.getAllergies(), profile.getExcludedIngredients());
        details.updateBody(request.age(), request.height(), request.currentWeight(), request.targetWeight(), request.gender(), request.activityLevel());
        return response(profile, details);
    }

    @Transactional
    public ProfileDetailsResponse updateTrainer(Long userId, TrainerProfileRequest request) {
        Profile profile = findProfile(userId, true);
        validateWorkout(request.workoutMinutes(), request.equipment());
        ProfileDetails details = details(profile);
        profile.updateDietProfile(profile.getNickname(), profile.getGoal(), profile.getCookTimeMin(),
            request.mealBudget(), normalize(request.allergies()), normalize(request.excludedIngredients()));
        details.updateTrainer(request.age(), request.height(), request.currentWeight(), request.workoutGoal(), request.workoutLevel(), request.environment(), request.workoutMinutes(), request.dietType(), normalize(request.equipment()), normalize(request.injuries()));
        return response(profile, details);
    }

    @Transactional
    public ProfileDetailsResponse updateDiet(Long userId, DietProfileRequest request) {
        Profile profile = findProfile(userId, true);
        Integer time = request.cookTimeMin();
        if (time != null && time != 10 && time != 20 && time != 30)
            throw new BusinessException(ErrorCode.INVALID_INPUT, "조리 시간은 10분, 20분, 30분 중 선택해 주세요.");
        ProfileDetails details = details(profile);
        profile.updateDietProfile(profile.getNickname(), request.goal(), request.cookTimeMin(),
            request.mealBudget(), normalize(request.allergies()), normalize(request.excludedIngredients()));
        details.updateDiet(request.defaultServings(), request.prioritizeFridge(), normalize(request.preferredFoods()));
        return response(profile, details);
    }

    @Transactional
    public ProfileDetailsResponse updateFitness(Long userId, FitnessProfileRequest request) {
        Profile profile = findProfile(userId, true);
        validateWorkout(request.workoutMinutes(), request.equipment());
        ProfileDetails details = details(profile);
        details.updateFitness(request.workoutGoal(), request.workoutLevel(), request.workoutMinutes(), request.daysPerWeek(), normalize(request.equipment()), normalize(request.injuries()));
        return response(profile, details);
    }

    @Transactional
    public ProfileDetailsResponse updateTests(Long userId, TestsProfileRequest request) {
        Profile profile = findProfile(userId, true);
        ProfileDetails details = details(profile);
        details.updateTests(request.restingHeartRate(), request.pushups(), request.squat30s(), request.plankSeconds());
        return response(profile, details);
    }

    private ProfileDetailsResponse response(Profile profile, ProfileDetails details) {
        return new ProfileDetailsResponse(
            new BodyProfileRequest(profile.getNickname(), details.getAge(), details.getHeight(), details.getCurrentWeight(), details.getTargetWeight(), details.getGender(), details.getActivityLevel()),
            new TrainerProfileRequest(details.getAge(), details.getHeight(), details.getCurrentWeight(), details.getWorkoutGoal(), details.getWorkoutLevel(), details.getEnvironment(), details.getWorkoutMinutes(), details.getDietType(), details.getEquipment(), details.getInjuries(), profile.getAllergies(), profile.getExcludedIngredients(), profile.getMealBudget()),
            new DietProfileRequest(profile.getGoal(), profile.getCookTimeMin(), profile.getMealBudget(), profile.getAllergies(), profile.getExcludedIngredients(), details.getDefaultServings(), details.getPrioritizeFridge(), details.getPreferredFoods()),
            new FitnessProfileRequest(details.getWorkoutGoal(), details.getWorkoutLevel(), details.getWorkoutMinutes(), details.getDaysPerWeek(), details.getEquipment(), details.getInjuries()),
            new TestsProfileRequest(details.getRestingHeartRate(), details.getPushups(), details.getSquat30s(), details.getPlankSeconds())
        );
    }
}

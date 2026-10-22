package com.mealfit.domain.user.repository;

import com.mealfit.domain.user.entity.ProfileDetails;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileDetailsRepository extends JpaRepository<ProfileDetails, Long> {
}

package com.mealfit.domain.user.repository;

import com.mealfit.domain.user.entity.Profile;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

    Optional<Profile> findByUserId(Long userId);

    /** 같은 회원의 프로필 변경을 순서대로 처리합니다. */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Profile p where p.userId = :userId")
    Optional<Profile> findByUserIdForUpdate(@org.springframework.data.repository.query.Param("userId") Long userId);

    boolean existsByUserId(Long userId);
}

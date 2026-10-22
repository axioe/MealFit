package com.mealfit.domain.user.repository;

import com.mealfit.domain.user.entity.User;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** 회원 저장과 이메일·ID 조회를 담당합니다. */
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    /** JWT가 유효하더라도 탈퇴했거나 존재하지 않는 회원의 접근은 차단합니다. */
    boolean existsByIdAndDeletedAtIsNull(Long userId);

    /** 비밀번호 확인부터 토큰 발급까지 회원 상태가 바뀌지 않게 잠급니다. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select user from User user where user.email = :email")
    Optional<User> findByEmailForUpdate(@Param("email") String email);

    /**
     * 같은 회원의 토큰 발급·폐기를 순서대로 처리하기 위한 잠금입니다.
     * 반드시 쓰기 트랜잭션 안에서 호출합니다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select user
        from User user
        where user.id = :userId
        """)
    Optional<User> findByIdForUpdate(
        @Param("userId") Long userId
    );
}

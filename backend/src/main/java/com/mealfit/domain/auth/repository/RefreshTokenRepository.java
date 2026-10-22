package com.mealfit.domain.auth.repository;

import com.mealfit.domain.auth.entity.RefreshToken;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Refresh Token 조회와 폐기를 담당합니다.
 * 토큰 원문이 아닌 SHA-256 해시로 조회합니다.
 */
public interface RefreshTokenRepository
    extends JpaRepository<RefreshToken, Long> {



    /**
     * 토큰을 조회하면서 해당 행에 쓰기 잠금을 겁니다.
     * 같은 토큰의 동시 재발급을 막기 위해 사용합니다.
     * 반드시 Service의 트랜잭션 안에서 호출해야 합니다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select token
        from RefreshToken token
        where token.tokenHash = :tokenHash
        """)
    Optional<RefreshToken> findByTokenHashForUpdate(
        @Param("tokenHash") String tokenHash
    );

    /**
     * 해당 회원의 사용 가능한 토큰을 모두 폐기합니다.
     * 폐기된 토큰의 재사용이 감지됐을 때 사용합니다.
     * 반환값은 변경된 행의 수입니다.
     */
    @Modifying(flushAutomatically = true)
    @Query("""
        update RefreshToken token
        set token.revoked = true
        where token.userId = :userId
          and token.revoked = false
        """)
    int revokeAllByUserId(@Param("userId") Long userId);

    /**
     * 토큰 소유자를 먼저 확인할 때 사용합니다.
     * 실제 사용 여부는 회원 잠금을 얻은 뒤 다시 조회·검증합니다.
     */
    /**
     * 토큰 소유자의 ID만 조회합니다.
     * 토큰 상태는 회원 잠금을 얻은 뒤 다시 조회해 검증합니다.
     */
    @Query("""
        select token.userId
        from RefreshToken token
        where token.tokenHash = :tokenHash
        """)
    Optional<Long> findUserIdByTokenHash(
        @Param("tokenHash") String tokenHash
    );

    Optional<RefreshToken> findByTokenHash(String tokenHash);
}

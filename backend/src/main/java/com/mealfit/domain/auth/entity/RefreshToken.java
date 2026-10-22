package com.mealfit.domain.auth.entity;

import com.mealfit.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 로그인 유지와 토큰 재발급에 사용하는 Refresh Token을 관리합니다.
 * 토큰 원문은 저장하지 않고, SHA-256 해시만 저장합니다.
 */
@Getter
@Entity
@Table(name = "refresh_tokens")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 토큰을 발급받은 회원의 ID입니다. */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** SHA-256 결과를 16진수 문자열로 저장하므로 길이는 64자입니다. */
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    /** 토큰 만료 시각입니다. */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /** 재발급이나 로그아웃으로 폐기됐는지 나타냅니다. */
    @Column(nullable = false)
    private boolean revoked;

    /** 새로운 Refresh Token 저장 객체를 생성합니다. */
    public static RefreshToken create(
        Long userId,
        String tokenHash,
        LocalDateTime expiresAt
    ) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.userId = userId;
        refreshToken.tokenHash = tokenHash;
        refreshToken.expiresAt = expiresAt;
        refreshToken.revoked = false;
        return refreshToken;
    }

    /** 만료 시각과 같거나 지난 토큰은 사용할 수 없습니다. */
    public boolean isExpired(LocalDateTime now) {
        return !now.isBefore(expiresAt);
    }

    /** 재발급 또는 로그아웃 시 기존 토큰을 폐기합니다. */
    public void revoke() {
        this.revoked = true;
    }
}

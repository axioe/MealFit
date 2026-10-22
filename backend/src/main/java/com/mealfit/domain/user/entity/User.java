package com.mealfit.domain.user.entity;

import com.mealfit.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Locale;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    /** null이면 정상 회원이며, 탈퇴하면 최초 탈퇴 시각을 기록합니다. */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /** 중복 호출되어도 최초 탈퇴 시각을 유지합니다. */
    public void withdraw() {
        if (deletedAt == null) {
            deletedAt = LocalDateTime.now();
        }
    }

    public static User create(String email, String passwordHash) {
        User user = new User();
        user.email = email.trim().toLowerCase(Locale.ROOT);
        user.passwordHash = passwordHash;
        return user;
    }
}

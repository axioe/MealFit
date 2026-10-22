package com.mealfit.domain.user.entity;

import com.mealfit.global.common.BaseTimeEntity;
import jakarta.persistence.*;
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

    public static User create(String email, String passwordHash) {
        User user = new User();
        user.email = email.trim().toLowerCase(Locale.ROOT);
        user.passwordHash = passwordHash;
        return user;
    }
}

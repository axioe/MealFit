package com.mealfit.global.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 회원가입과 로그인에서 공통으로 사용할
 * 비밀번호 해시 처리 객체를 등록합니다.
 */
@Configuration
public class PasswordConfig {

    /**
     * 회원가입: encode(원본 비밀번호)로 해시를 생성합니다.
     * 로그인: matches(입력 비밀번호, 저장된 해시)로 비교합니다.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

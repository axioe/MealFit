package com.mealfit.global.security;

import lombok.RequiredArgsConstructor;
import com.mealfit.domain.user.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 공개 API와 인증이 필요한 API를 구분하고 JWT 필터를 연결합니다.
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final SecurityErrorHandler securityErrorHandler;
    private final UserRepository userRepository;

    @Bean
    public SecurityFilterChain securityFilterChain(
        HttpSecurity http
    ) throws Exception {

        JwtAuthenticationFilter jwtFilter =
            new JwtAuthenticationFilter(
                jwtTokenProvider,
                securityErrorHandler,
                userRepository
            );

        http
            // 현재 인증은 자동 전송 쿠키가 아닌 Bearer 헤더를 사용합니다.
            // 향후 Refresh Token을 쿠키로 옮기면 CSRF 정책도 변경해야 합니다.
            .csrf(AbstractHttpConfigurer::disable)

            // Spring 기본 로그인 화면과 HTTP Basic 인증을 사용하지 않습니다.
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)

            // 로그아웃은 별도 API에서 Refresh Token을 폐기합니다.
            .logout(AbstractHttpConfigurer::disable)

            // 인증 정보를 서버 세션에 저장하지 않습니다.
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // 인증 실패·권한 부족은 기존 ErrorResponse로 반환합니다.
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(securityErrorHandler)
                .accessDeniedHandler(securityErrorHandler)
            )

            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/v1/auth/signup",
                    "/api/v1/auth/login",
                    "/api/v1/auth/refresh",
                    "/api/v1/auth/logout"
                ).permitAll()

                // Swagger는 운영 프로필에서 별도로 비활성화됩니다.
                .requestMatchers(
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs",
                    "/v3/api-docs/**"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.GET,
                    "/actuator/health",
                    "/actuator/health/**"
                ).permitAll()

                .anyRequest().authenticated()
            )

            .addFilterBefore(
                jwtFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}

package com.mealfit.support;

import com.mealfit.global.security.JwtTokenProvider;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.web.context.support.WebApplicationContextUtils;

/**
 * 기능 테스트에도 실제 JWT 필터를 통과하는 인증 헤더를 넣습니다.
 * 임시 X-User-Id 헤더나 인증 우회 설정을 사용하지 않습니다.
 */
public final class TestJwt {
    private TestJwt() {
    }

    public static RequestPostProcessor user(long userId) {
        return request -> {
            var context = WebApplicationContextUtils
                .getRequiredWebApplicationContext(request.getServletContext());
            // 실제 보안 필터가 회원 상태를 확인하므로 테스트 회원·프로필도 준비합니다.
            // 이미 존재하는 회원의 상태(탈퇴 포함)는 변경하지 않습니다.
            TestUserFixture.create(context.getBean(org.springframework.jdbc.core.JdbcTemplate.class), userId);
            var provider = context.getBean(JwtTokenProvider.class);
            request.removeHeader("Authorization");
            request.addHeader("Authorization",
                "Bearer " + provider.createAccessToken(
                    userId, "test-" + userId + "@example.com"));
            return request;
        };
    }
}

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
            var provider = context.getBean(JwtTokenProvider.class);
            request.removeHeader("Authorization");
            request.addHeader("Authorization",
                "Bearer " + provider.createAccessToken(
                    userId, "test-" + userId + "@example.com"));
            return request;
        };
    }
}

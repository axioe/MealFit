package com.mealfit.global.web;

import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * @CurrentUserId 파라미터에 JWT로 인증된 회원 ID를 전달합니다.
 * 클라이언트가 보낸 X-User-Id 헤더나 기본 사용자 ID는 사용하지 않습니다.
 */
public class CurrentUserIdArgumentResolver
    implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUserId.class)
            && Long.class.equals(parameter.getParameterType());
    }

    @Override
    public Long resolveArgument(
        MethodParameter parameter,
        ModelAndViewContainer mavContainer,
        NativeWebRequest webRequest,
        WebDataBinderFactory binderFactory
    ) {
        Authentication authentication = SecurityContextHolder
            .getContext()
            .getAuthentication();

        // JWT 필터가 등록한 Long 타입 회원 ID만 허용합니다.
        if (authentication == null
            || !authentication.isAuthenticated()
            || !(authentication.getPrincipal() instanceof Long userId)
            || userId <= 0) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        return userId;
    }
}

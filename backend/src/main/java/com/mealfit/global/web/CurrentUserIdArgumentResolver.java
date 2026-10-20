package com.mealfit.global.web;

import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * [임시 개발용] 로그인 기능 완성 전까지 사용자 ID를 X-User-Id 헤더에서 읽는다 (없으면 1).
 * TODO(로그인 담당): 인증 정보(토큰)에서 사용자 ID를 꺼내도록 교체하고, 헤더 방식은 삭제할 것.
 */
public class CurrentUserIdArgumentResolver implements HandlerMethodArgumentResolver {

    public static final String HEADER = "X-User-Id";
    private static final long DEFAULT_DEV_USER_ID = 1L;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUserId.class)
                && Long.class.equals(parameter.getParameterType());
    }

    @Override
    public Long resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        String header = webRequest.getHeader(HEADER);
        if (header == null || header.isBlank()) {
            return DEFAULT_DEV_USER_ID;
        }
        try {
            return Long.valueOf(header.trim());
        } catch (NumberFormatException e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, HEADER + " 헤더는 숫자여야 합니다.");
        }
    }
}

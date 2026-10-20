package com.mealfit.global.web;

import io.swagger.v3.oas.annotations.Parameter;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 현재 사용자 ID를 컨트롤러 파라미터로 받는다.
 * 사용: {@code public LotResponse stockIn(@CurrentUserId Long userId, ...)}
 *
 * [임시] 로그인 기능이 완성되기 전까지는 X-User-Id 헤더 값(없으면 1)을 쓴다.
 * 로그인 담당자는 CurrentUserIdArgumentResolver만 바꾸면 되고, 컨트롤러 코드는 그대로 둔다.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Parameter(hidden = true)
public @interface CurrentUserId {
}

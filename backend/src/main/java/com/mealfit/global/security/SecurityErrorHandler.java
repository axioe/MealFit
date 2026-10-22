package com.mealfit.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mealfit.global.exception.ErrorCode;
import com.mealfit.global.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

/**
 * 인증·권한 오류를 기존 ErrorResponse 형식의 JSON으로 반환합니다.
 * Security 필터의 오류는 일반 Controller 예외 처리와 별도로 처리합니다.
 */
@Component
@RequiredArgsConstructor
public class SecurityErrorHandler
    implements AuthenticationEntryPoint, AccessDeniedHandler {

    /** Spring이 관리하는 JSON 변환기를 사용합니다. */
    private final ObjectMapper objectMapper;

    /** 로그인하지 않고 보호된 API에 접근하면 401을 반환합니다. */
    @Override
    public void commence(
        HttpServletRequest request,
        HttpServletResponse response,
        AuthenticationException exception
    ) throws IOException {
        writeError(response, ErrorCode.UNAUTHORIZED);
    }

    /** 접근 권한이 부족하면 403을 반환합니다. */
    @Override
    public void handle(
        HttpServletRequest request,
        HttpServletResponse response,
        AccessDeniedException exception
    ) throws IOException {
        writeError(response, ErrorCode.FORBIDDEN);
    }

    /** JWT 필터에서도 사용할 공통 오류 응답 메서드입니다. */
    public void writeError(
        HttpServletResponse response,
        ErrorCode errorCode
    ) throws IOException {
        // 이미 전송된 응답에는 오류 내용을 중복으로 쓰지 않습니다.
        if (response.isCommitted()) {
            return;
        }

        response.setStatus(errorCode.getStatus().value());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        objectMapper.writeValue(
            response.getOutputStream(),
            ErrorResponse.of(errorCode)
        );
    }
}

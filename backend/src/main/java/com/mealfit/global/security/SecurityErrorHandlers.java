package com.mealfit.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mealfit.global.exception.ErrorCode;
import com.mealfit.global.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

/** 필터 단계에서 발생한 401/403도 ErrorResponse 형식으로 내려준다. */
@Component
@RequiredArgsConstructor
public class SecurityErrorHandlers {

    private final ObjectMapper objectMapper;

    public AuthenticationEntryPoint entryPoint() {
        return (request, response, ex) -> {
            Object attr = request.getAttribute(JwtAuthenticationFilter.AUTH_ERROR_ATTRIBUTE);
            ErrorCode code = attr instanceof ErrorCode ec ? ec : ErrorCode.UNAUTHORIZED;
            write(response, code);
        };
    }

    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, ex) -> write(response, ErrorCode.FORBIDDEN);
    }

    private void write(HttpServletResponse response, ErrorCode code) throws IOException {
        response.setStatus(code.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(), ErrorResponse.of(code));
    }
}

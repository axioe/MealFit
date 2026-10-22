package com.mealfit.global.security;

import com.mealfit.global.exception.ErrorCode;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 요청의 Bearer JWT를 검증하고 현재 사용자 ID를 등록합니다.
 * SecurityConfig에서 생성해 보안 필터 체인에 연결합니다.
 */
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final SecurityErrorHandler securityErrorHandler;

    /**
     * 회원가입·로그인·재발급·로그아웃은 Access Token 없이 호출합니다.
     * 재발급·로그아웃은 요청 본문의 Refresh Token을 검증합니다.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();

        return "POST".equals(request.getMethod())
            && (
            "/api/v1/auth/signup".equals(path)
                || "/api/v1/auth/login".equals(path)
                || "/api/v1/auth/refresh".equals(path)
                || "/api/v1/auth/logout".equals(path)
        );
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {

        String authorization = request.getHeader(
            HttpHeaders.AUTHORIZATION
        );

        // 토큰이 없으면 인증하지 않고 다음 필터로 넘깁니다.
        // 보호된 경로의 접근 거부는 SecurityConfig가 담당합니다.
        if (authorization == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!authorization.regionMatches(
            true, 0, "Bearer ", 0, 7)) {
            reject(response, ErrorCode.AUTH_INVALID_TOKEN);
            return;
        }

        String token = authorization.substring(7).trim();

        if (token.isEmpty()) {
            reject(response, ErrorCode.AUTH_INVALID_TOKEN);
            return;
        }

        final Long userId;

        // JWT 검증 과정의 오류만 인증 오류로 처리합니다.
        // 이후 Controller·Service 오류까지 여기서 잡지 않습니다.
        try {
            userId = jwtTokenProvider.getUserId(token);
        } catch (ExpiredJwtException exception) {
            reject(response, ErrorCode.AUTH_ACCESS_TOKEN_EXPIRED);
            return;
        } catch (JwtException | IllegalArgumentException exception) {
            reject(response, ErrorCode.AUTH_INVALID_TOKEN);
            return;
        }

        var authentication =
            new UsernamePasswordAuthenticationToken(
                userId,
                null,
                List.of()
            );

        authentication.setDetails(
            new WebAuthenticationDetailsSource()
                .buildDetails(request)
        );

        // 인증된 사용자 ID를 저장합니다.
        // 이후 @CurrentUserId에서 이 값을 사용합니다.
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        filterChain.doFilter(request, response);
    }

    /** 잘못된 인증 정보는 제거하고 공통 JSON 오류를 반환합니다. */
    private void reject(
        HttpServletResponse response,
        ErrorCode errorCode
    ) throws IOException {
        SecurityContextHolder.clearContext();
        securityErrorHandler.writeError(response, errorCode);
    }
}

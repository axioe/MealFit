package com.mealfit.global.security;

import com.mealfit.global.exception.BusinessException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** 토큰 검증 실패 사유를 EntryPoint에 넘길 때 쓰는 request attribute 키 */
    public static final String AUTH_ERROR_ATTRIBUTE = "mealfit.authError";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            try {
                AuthUser authUser = tokenProvider.parse(header.substring(BEARER_PREFIX.length()));
                var authentication = new UsernamePasswordAuthenticationToken(
                        authUser, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (BusinessException e) {
                request.setAttribute(AUTH_ERROR_ATTRIBUTE, e.getErrorCode());
            }
        }
        chain.doFilter(request, response);
    }
}

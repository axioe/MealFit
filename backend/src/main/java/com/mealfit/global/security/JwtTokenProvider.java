package com.mealfit.global.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

/**
 * Access Token의 발급과 검증을 담당합니다.
 * 서명 알고리즘은 HS256만 허용합니다.
 */
@Component
public class JwtTokenProvider {

    private static final String ISSUER = "mealfit";

    private final JwtProperties properties;
    private final SecretKey signingKey;
    private final JwtParser parser;

    public JwtTokenProvider(JwtProperties properties) {
        this.properties = properties;
        this.signingKey = createSigningKey(properties.secret());

        // 같은 키로 서명을 검증하고, MealFit이 발급한 토큰만 허용합니다.
        this.parser = Jwts.parser()
            .verifyWith(signingKey)
            .requireIssuer(ISSUER)
            .sig()
            .clear()
            .add(Jwts.SIG.HS256)
            .and()
            .build();
    }

    /**
     * 환경 변수의 Base64 문자열을 서명 키로 변환합니다.
     * HS256은 최소 32바이트의 키가 필요합니다.
     */
    private SecretKey createSigningKey(String encodedSecret) {
        final byte[] keyBytes;

        try {
            keyBytes = Base64.getDecoder().decode(encodedSecret);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException(
                "JWT_SECRET은 올바른 Base64 형식이어야 합니다."
            );
        }

        if (keyBytes.length < 32) {
            throw new IllegalArgumentException(
                "JWT_SECRET은 디코딩 후 32바이트 이상이어야 합니다."
            );
        }

        return new SecretKeySpec(keyBytes, "HmacSHA256");
    }

    /**
     * 로그인한 회원의 Access Token을 발급합니다.
     * sub에는 회원 ID, email에는 이메일을 저장합니다.
     */
    public String createAccessToken(Long userId, String email) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException(
                "유효한 회원 ID가 필요합니다."
            );
        }

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException(
                "회원 이메일이 필요합니다."
            );
        }

        Instant now = Instant.now();

        return Jwts.builder()
            .issuer(ISSUER)
            .subject(userId.toString())
            .claim("email", email)
            .issuedAt(Date.from(now))
            .expiration(Date.from(
                now.plus(properties.accessTokenTtl())
            ))
            .signWith(signingKey, Jwts.SIG.HS256)
            .compact();
    }

    /**
     * 서명·만료·발급자를 검증한 뒤 회원 ID를 반환합니다.
     * 검증에 실패한 토큰의 내용은 인증에 사용하지 않습니다.
     *
     * 만료된 토큰은 ExpiredJwtException,
     * 변조되거나 잘못된 토큰은 JwtException 등으로 전달됩니다.
     * 이후 JWT 필터에서 각각 인증 오류 응답으로 변환합니다.
     */
    public Long getUserId(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new JwtException("Access Token이 없습니다.");
        }

        Claims claims = parser.parseSignedClaims(accessToken)
            .getPayload();

        // exp가 없는 토큰은 무기한 사용될 수 있으므로 거부합니다.
        if (claims.getExpiration() == null) {
            throw new JwtException("토큰에 만료 시각이 없습니다.");
        }

        String subject = claims.getSubject();

        if (subject == null || subject.isBlank()) {
            throw new JwtException("토큰에 회원 ID가 없습니다.");
        }

        final long userId;

        try {
            userId = Long.parseLong(subject);
        } catch (NumberFormatException exception) {
            throw new JwtException("토큰의 회원 ID가 올바르지 않습니다.");
        }

        if (userId <= 0) {
            throw new JwtException("토큰의 회원 ID가 올바르지 않습니다.");
        }

        return userId;
    }

    /** 응답의 expiresIn에 사용할 유효기간입니다. 단위는 초입니다. */
    public long getAccessTokenExpiresInSeconds() {
        return properties.accessTokenTtl().toSeconds();
    }
}

package com.mealfit.global.security;

import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

/** Access 토큰(JWT) 발급/검증. Refresh 토큰은 DB에 저장하는 불투명 문자열이다 (RefreshTokenService). */
@Component
public class JwtTokenProvider {

    private static final String CLAIM_EMAIL = "email";

    private final SecretKey key;
    private final JwtProperties properties;

    public JwtTokenProvider(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.secret()));
    }

    public String createAccessToken(Long userId, String email) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(CLAIM_EMAIL, email)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + properties.accessTokenValidity().toMillis()))
                .signWith(key)
                .compact();
    }

    public long getAccessTokenValiditySeconds() {
        return properties.accessTokenValidity().toSeconds();
    }

    /** 토큰을 검증하고 사용자 정보를 꺼낸다. 실패 시 EXPIRED_TOKEN 또는 INVALID_TOKEN. */
    public AuthUser parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return new AuthUser(Long.valueOf(claims.getSubject()), claims.get(CLAIM_EMAIL, String.class));
        } catch (ExpiredJwtException e) {
            throw new BusinessException(ErrorCode.EXPIRED_TOKEN);
        } catch (JwtException | IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
    }
}

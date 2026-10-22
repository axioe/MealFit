package com.mealfit.domain.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mealfit.domain.auth.repository.RefreshTokenRepository;
import com.mealfit.domain.user.repository.ProfileRepository;
import com.mealfit.domain.user.repository.UserRepository;
import com.mealfit.global.security.JwtProperties;
import com.mealfit.global.security.RefreshTokenProvider;
import io.jsonwebtoken.Jwts;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 실제 보안 필터·Service·H2 DB를 함께 검증합니다.
 * 테스트 전체를 하나의 트랜잭션으로 감싸지 않아 재사용 폐기의 커밋까지 확인합니다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthApiTest {
    private static final String PASSWORD = "Mealfit123!";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired ProfileRepository profiles;
    @Autowired RefreshTokenRepository tokens;
    @Autowired RefreshTokenProvider refreshProvider;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtProperties properties;
    @Autowired PlatformTransactionManager transactionManager;
    private final List<Long> createdUserIds = new ArrayList<>();

    /** 다른 기능 테스트의 데이터는 건드리지 않고 이 테스트 회원만 정리합니다. */
    @AfterEach
    void cleanup() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            for (Long userId : createdUserIds) {
                tokens.deleteAll(tokens.findAll().stream()
                    .filter(token -> token.getUserId().equals(userId)).toList());
                profiles.findByUserId(userId).ifPresent(profiles::delete);
                profiles.flush();
                users.deleteById(userId);
                users.flush();
            }
        });
    }

    private String email() {
        return "auth-" + UUID.randomUUID() + "@example.com";
    }

    private JsonNode signup(String email) throws Exception {
        var response = mvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", email, "password", PASSWORD, "nickname", "테스트회원"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.expiresIn").value(1800))
            .andReturn().getResponse();
        var body = mapper.readTree(response.getContentAsString());
        createdUserIds.add(body.path("user").path("id").asLong());
        return body;
    }

    private org.springframework.test.web.servlet.ResultActions refresh(String token)
            throws Exception {
        return mvc.perform(post("/api/v1/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("refreshToken", token))));
    }

    @Test
    void 가입시_해시와_기본프로필을_저장하고_대소문자_중복을_차단한다() throws Exception {
        String email = email();
        var body = signup(email.toUpperCase(java.util.Locale.ROOT));
        var user = users.findByEmail(email).orElseThrow();
        assertThat(passwordEncoder.matches(PASSWORD, user.getPasswordHash())).isTrue();
        assertThat(user.getPasswordHash()).isNotEqualTo(PASSWORD);
        assertThat(profiles.findByUserId(user.getId())).isPresent();
        assertThat(body.path("user").path("email").asText()).isEqualTo(email);
        var stored = tokens.findByTokenHash(
            refreshProvider.hashToken(body.path("refreshToken").asText())).orElseThrow();
        assertThat(stored.isRevoked()).isFalse();
        assertThat(stored.getTokenHash()).hasSize(64);

        mvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                    "email", email, "password", PASSWORD, "nickname", "중복회원"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("AUTH_001"));
    }

    @Test
    void 로그인_성공과_잘못된_비밀번호를_구분한다() throws Exception {
        String email = email();
        signup(email);
        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", email, "password", PASSWORD))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty());
        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", email, "password", "wrong"))))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("AUTH_002"));
    }

    @Test
    void 토큰없이_또는_임시헤더만으로_보호API에_접근할수없다() throws Exception {
        mvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("COMMON_401"));
        mvc.perform(get("/api/v1/me").header("X-User-Id", "1"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void JWT의_사용자만_조회하고_다른_사용자의_재고는_수정할수없다() throws Exception {
        var first = signup(email());
        var second = signup(email());
        String firstAuth = "Bearer " + first.path("accessToken").asText();
        String secondAuth = "Bearer " + second.path("accessToken").asText();
        mvc.perform(get("/api/v1/me").header("Authorization", firstAuth)
                .header("X-User-Id", second.path("user").path("id").asText()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(first.path("user").path("id").asLong()));
        var response = mvc.perform(post("/api/v1/inventory/lots")
                .header("Authorization", firstAuth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"ingredientName\":\"인증검증두부\",\"quantity\":1,\"unit\":\"개\",\"storageLocation\":\"FRIDGE\",\"minStockQty\":0}"))
            .andExpect(status().isCreated()).andReturn().getResponse();
        long lotId = mapper.readTree(response.getContentAsString()).path("id").asLong();
        try {
            mvc.perform(patch("/api/v1/inventory/lots/" + lotId)
                    .header("Authorization", secondAuth)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"action\":\"ADJUST\",\"quantity\":2}"))
                .andExpect(status().isNotFound());
        } finally {
            // 생성한 재고는 독립 트랜잭션에서 이력부터 정리합니다.
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                entityManager.createQuery(
                    "delete from InventoryTransaction t where t.lot.id = :lotId")
                    .setParameter("lotId", lotId).executeUpdate();
                entityManager.createQuery("delete from InventoryLot l where l.id = :lotId")
                    .setParameter("lotId", lotId).executeUpdate();
            });
        }
    }

    @Autowired jakarta.persistence.EntityManager entityManager;

    @Test
    void 변조된_JWT와_만료된_JWT를_거부한다() throws Exception {
        var body = signup(email());
        String access = body.path("accessToken").asText();
        int signatureStart = access.lastIndexOf('.') + 1;
        String tampered = access.substring(0, signatureStart)
            + (access.charAt(signatureStart) == 'A' ? "B" : "A")
            + access.substring(signatureStart + 1);
        mvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + tampered))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("AUTH_003"));

        var key = new SecretKeySpec(Base64.getDecoder().decode(properties.secret()), "HmacSHA256");
        String expired = Jwts.builder().issuer("mealfit")
            .subject(body.path("user").path("id").asText())
            .issuedAt(Date.from(Instant.now().minusSeconds(120)))
            .expiration(Date.from(Instant.now().minusSeconds(60)))
            .signWith(key, Jwts.SIG.HS256).compact();
        mvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + expired))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("AUTH_004"));
    }

    @Test
    void 재발급은_토큰을_교체하고_재사용하면_새토큰도_폐기된다() throws Exception {
        var body = signup(email());
        String oldToken = body.path("refreshToken").asText();
        var refreshed = refresh(oldToken).andExpect(status().isOk())
            .andReturn().getResponse();
        String nextToken = mapper.readTree(refreshed.getContentAsString())
            .path("refreshToken").asText();
        assertThat(nextToken).isNotEqualTo(oldToken);
        refresh(oldToken).andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("AUTH_005"));
        // 오류 응답 뒤에도 폐기가 DB에 커밋돼 있어야 합니다.
        assertThat(tokens.findByTokenHash(refreshProvider.hashToken(nextToken))
            .orElseThrow().isRevoked()).isTrue();
        refresh(nextToken).andExpect(status().isUnauthorized());
    }

    @Test
    void 로그아웃한_토큰으로는_재발급할수없다() throws Exception {
        String token = signup(email()).path("refreshToken").asText();
        mvc.perform(post("/api/v1/auth/logout").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("refreshToken", token))))
            .andExpect(status().isNoContent());
        refresh(token).andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("AUTH_005"));
    }

    @Test
    void 잘못된_입력과_비밀번호_바이트초과를_거부한다() throws Exception {
        for (String password : List.of("short", "한".repeat(25))) {
            mvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of(
                        "email", email(), "password", password, "nickname", "회원"))))
                .andExpect(status().isBadRequest());
        }
        refresh("not-a-real-token").andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void 동일토큰_동시재발급은_한건만_성공하고_재사용으로_폐기된다() throws Exception {
        var body = signup(email());
        String token = body.path("refreshToken").asText();
        var ready = new CountDownLatch(2);
        var start = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);
        try {
            java.util.concurrent.Callable<Integer> action = () -> {
                ready.countDown();
                if (!start.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("대기 시간 초과");
                return refresh(token).andReturn().getResponse().getStatus();
            };
            var first = executor.submit(action);
            var second = executor.submit(action);
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            assertThat(List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS)))
                .containsExactlyInAnyOrder(200, 401);
            long userId = body.path("user").path("id").asLong();
            assertThat(tokens.findAll().stream()
                .filter(row -> row.getUserId().equals(userId)))
                .allMatch(row -> row.isRevoked());
        } finally {
            start.countDown();
            executor.shutdownNow();
        }
    }
}

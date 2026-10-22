package com.mealfit.global.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

import com.mealfit.global.exception.GlobalExceptionHandler;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** 사용자 ID는 인증 정보에서만 읽고 임시 헤더는 무시하는지 검사합니다. */
class CurrentUserIdTest {
    @RestController
    static class EchoController {
        @GetMapping("/echo")
        Long echo(@CurrentUserId Long userId) {
            return userId;
        }
    }

    private final MockMvc mockMvc = standaloneSetup(new EchoController())
        .setCustomArgumentResolvers(new CurrentUserIdArgumentResolver())
        .setControllerAdvice(new GlobalExceptionHandler())
        .build();

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void 인증이_없으면_401() throws Exception {
        SecurityContextHolder.clearContext();
        mockMvc.perform(get("/echo"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("COMMON_401"));
    }

    @Test
    void 임시_헤더로_사용자를_가장할_수_없다() throws Exception {
        SecurityContextHolder.clearContext();
        mockMvc.perform(get("/echo").header("X-User-Id", "7"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void 인증된_사용자_ID를_반환하고_헤더는_무시한다() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(7L, null, List.of()));
        mockMvc.perform(get("/echo").header("X-User-Id", "999"))
            .andExpect(status().isOk())
            .andExpect(content().string("7"));
    }

    @Test
    void 문자열_principal은_허용하지_않는다() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("7", null, List.of()));
        mockMvc.perform(get("/echo")).andExpect(status().isUnauthorized());
    }
}

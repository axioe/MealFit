package com.mealfit.global.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

import com.mealfit.global.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @Test
    void 헤더가_없으면_개발용_기본_사용자() throws Exception {
        mockMvc.perform(get("/echo")).andExpect(content().string("1"));
    }

    @Test
    void 헤더로_사용자_지정() throws Exception {
        mockMvc.perform(get("/echo").header("X-User-Id", "7")).andExpect(content().string("7"));
    }

    @Test
    void 숫자가_아니면_400() throws Exception {
        mockMvc.perform(get("/echo").header("X-User-Id", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
    }
}

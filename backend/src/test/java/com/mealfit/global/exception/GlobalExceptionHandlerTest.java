package com.mealfit.global.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

import jakarta.validation.constraints.Positive;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Spring MVC 기본 예외가 500이 아니라 원래 상태 코드 + 공통 에러 형식으로 내려가는지 확인한다. */
class GlobalExceptionHandlerTest {

    record Body(String name) {
    }

    @RestController
    static class SampleController {
        @GetMapping("/items")
        int items(@RequestParam @Positive int servings) {
            return servings;
        }

        @GetMapping("/header")
        String header(@RequestHeader("X-Sample") String value) {
            return value;
        }

        @PostMapping(value = "/body", consumes = MediaType.APPLICATION_JSON_VALUE)
        String body(@RequestBody Body body) {
            return body.name();
        }

        @GetMapping("/boom")
        String boom() {
            throw new IllegalStateException("boom");
        }
    }

    private final MockMvc mockMvc = standaloneSetup(new SampleController())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

    @Test
    void 필수_파라미터가_없으면_400과_필드명() throws Exception {
        mockMvc.perform(get("/items"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"))
                .andExpect(jsonPath("$.errors[0].field").value("servings"));
    }

    @Test
    void 파라미터_타입이_틀리면_400과_필드명() throws Exception {
        mockMvc.perform(get("/items").param("servings", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"))
                .andExpect(jsonPath("$.errors[0].field").value("servings"));
    }

    @Test
    void 파라미터_검증에_실패하면_400과_필드명() throws Exception {
        mockMvc.perform(get("/items").param("servings", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"))
                .andExpect(jsonPath("$.errors[0].field").value("servings"));
    }

    @Test
    void 지원하지_않는_메서드면_405() throws Exception {
        mockMvc.perform(post("/items"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.code").value("COMMON_405"))
                .andExpect(header().string("Allow", "GET"));
    }

    @Test
    void 지원하지_않는_본문_형식이면_415() throws Exception {
        mockMvc.perform(post("/body").contentType(MediaType.TEXT_PLAIN).content("hi"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.code").value("COMMON_415"));
    }

    @Test
    void JSON이_깨졌으면_400() throws Exception {
        mockMvc.perform(post("/body").contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
    }

    @Test
    void 따로_처리하지_않은_Spring_예외도_4xx_유지() throws Exception {
        mockMvc.perform(get("/header"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("COMMON_400"));
    }

    @Test
    void 예상하지_못한_예외는_500() throws Exception {
        mockMvc.perform(get("/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("COMMON_500"));
    }
}

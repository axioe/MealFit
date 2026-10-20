package com.mealfit.domain.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void 회원가입_로그인_프로필_토큰갱신_흐름() throws Exception {
        String signup = """
                {"email":"Flow@Test.com","password":"password123","nickname":"밀핏"}
                """;
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(signup))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.email").value("flow@test.com"));

        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(signup))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AUTH_001"));

        JsonNode tokens = login("flow@test.com", "password123");
        String access = tokens.get("accessToken").asText();
        String refresh = tokens.get("refreshToken").asText();

        mockMvc.perform(get("/api/v1/me/profile").header("Authorization", "Bearer " + access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nickname").value("밀핏"))
                .andExpect(jsonPath("$.goal").value("MAINTAIN"));

        String update = """
                {"nickname":"밀핏2","goal":"LOSS","cookingTimePref":10,"budgetPerMeal":8000,
                 "allergies":["땅콩","새우"],"excludedIngredients":["오이"]}
                """;
        mockMvc.perform(put("/api/v1/me/profile").header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allergies.length()").value(2))
                .andExpect(jsonPath("$.cookingTimePref").value(10));

        String badUpdate = update.replace("\"cookingTimePref\":10", "\"cookingTimePref\":15");
        mockMvc.perform(put("/api/v1/me/profile").header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON).content(badUpdate))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));

        // Refresh 토큰 회전: 새 토큰 발급 후 이전 토큰은 재사용 불가
        String refreshBody = "{\"refreshToken\":\"" + refresh + "\"}";
        mockMvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(refreshBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
        mockMvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(refreshBody))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_005"));
    }

    @Test
    void 인증_실패_응답() throws Exception {
        mockMvc.perform(get("/api/v1/me/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("COMMON_401"));

        mockMvc.perform(get("/api/v1/me/profile").header("Authorization", "Bearer invalid.token.value"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_003"));

        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@test.com\",\"password\":\"wrongpass1\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_002"));
    }

    private JsonNode login(String email, String password) throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body);
    }
}

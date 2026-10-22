package com.mealfit.domain.user;

import static com.mealfit.support.TestJwt.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mealfit.support.TestUserFixture;
import jakarta.persistence.EntityManager;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

/** 실제 보안 필터·Flyway·DB를 통해 탭 간 공유, 검증, 회원 격리를 확인합니다. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ProfileDetailsApiTest {
    private static final long USER = 81001L;
    private static final long OTHER = 81002L;
    private static final String PATH = "/api/v1/me/profile/details";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager em;

    @BeforeEach
    void prepareUsers() {
        TestUserFixture.create(jdbc, USER);
        TestUserFixture.create(jdbc, OTHER);
    }

    private Map<String, Object> body() {
        return new HashMap<>(Map.of("nickname", "내닉네임", "age", 29,
            "height", 175.5, "currentWeight", 72.5, "targetWeight", 68.0,
            "gender", "male", "activityLevel", "moderate"));
    }

    private Map<String, Object> trainer() {
        var request = new HashMap<String, Object>();
        request.putAll(Map.of("age", 30, "height", 176.0, "currentWeight", 73.0,
            "workoutGoal", "hypertrophy", "workoutLevel", "advanced", "environment", "gym",
            "workoutMinutes", 45, "dietType", "high_protein", "mealBudget", 12000));
        request.putAll(Map.of("equipment", List.of("dumbbell", "band"), "injuries", List.of("무릎"),
            "allergies", List.of(" 땅콩 ", "땅콩"), "excludedIngredients", List.of("고수")));
        return request;
    }

    private Map<String, Object> diet() {
        return new HashMap<>(Map.of("goal", "LOSE", "cookTimeMin", 20, "mealBudget", 8000,
            "allergies", List.of("우유"), "excludedIngredients", List.of("오이"),
            "preferredFoods", List.of(" 두부 ", "두부"), "defaultServings", 2, "prioritizeFridge", true));
    }

    private Map<String, Object> fitness() {
        return new HashMap<>(Map.of("workoutGoal", "health", "workoutLevel", "starter",
            "workoutMinutes", 30, "daysPerWeek", 3, "equipment", List.of("none"),
            "injuries", List.of("허리", "어깨")));
    }

    private ResultActions save(String section, Object request) throws Exception {
        return mvc.perform(put(PATH + "/" + section).with(user(USER))
            .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)));
    }

    private JsonNode reload(long userId) throws Exception {
        // 영속성 캐시가 아닌 저장된 DB 값을 다시 읽습니다.
        em.flush();
        em.clear();
        return mapper.readTree(mvc.perform(get(PATH).with(user(userId)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    @Test
    void 기존회원은_추가행없이_빈설정을_조회한다() throws Exception {
        mvc.perform(get(PATH).with(user(USER))).andExpect(status().isOk())
            .andExpect(jsonPath("$.body.nickname").value("테스트회원" + USER))
            .andExpect(jsonPath("$.trainer.equipment").isEmpty())
            .andExpect(jsonPath("$.diet.prioritizeFridge").value(false))
            .andExpect(jsonPath("$.tests.pushups").doesNotExist());
        assertThat(jdbc.queryForObject("select count(*) from profile_details", Long.class)).isZero();
    }

    @Test
    void 신체정보와_닉네임이_DB에_저장되고_다른탭에_공유된다() throws Exception {
        save("common", body()).andExpect(status().isOk());
        var result = reload(USER);
        assertThat(result.path("body").path("nickname").asText()).isEqualTo("내닉네임");
        assertThat(result.path("body").path("targetWeight").asDouble()).isEqualTo(68.0);
        assertThat(result.path("trainer").path("height").asDouble()).isEqualTo(175.5);
        mvc.perform(get("/api/v1/me").with(user(USER))).andExpect(status().isOk())
            .andExpect(jsonPath("$.nickname").value("내닉네임"));
    }

    @Test
    void 트레이너설정의_신체운동식단_공유값과_목록을_저장한다() throws Exception {
        save("trainer", trainer()).andExpect(status().isOk());
        var result = reload(USER);
        assertThat(result.path("body").path("age").asInt()).isEqualTo(30);
        assertThat(result.path("fitness").path("workoutLevel").asText()).isEqualTo("advanced");
        assertThat(result.path("fitness").path("equipment").size()).isEqualTo(2);
        assertThat(result.path("diet").path("allergies").size()).isEqualTo(1);
        assertThat(result.path("diet").path("allergies").get(0).asText()).isEqualTo("땅콩");
        assertThat(result.path("diet").path("mealBudget").asInt()).isEqualTo(12000);
    }

    @Test
    void 식단설정은_기존_식단API와_같은_제한재료를_쓴다() throws Exception {
        save("diet", diet()).andExpect(status().isOk());
        var result = reload(USER);
        assertThat(result.path("diet").path("preferredFoods").size()).isEqualTo(1);
        assertThat(result.path("diet").path("preferredFoods").get(0).asText()).isEqualTo("두부");
        assertThat(result.path("diet").path("defaultServings").asInt()).isEqualTo(2);
        assertThat(result.path("diet").path("prioritizeFridge").asBoolean()).isTrue();
        mvc.perform(get("/api/v1/me/profile").with(user(USER))).andExpect(status().isOk())
            .andExpect(jsonPath("$.goal").value("LOSE"))
            .andExpect(jsonPath("$.allergies[0]").value("우유"));
    }

    @Test
    void 운동탭은_다른탭의_신체식단정보를_지우지않는다() throws Exception {
        save("common", body()).andExpect(status().isOk());
        save("diet", diet()).andExpect(status().isOk());
        save("fitness", fitness()).andExpect(status().isOk());
        var result = reload(USER);
        assertThat(result.path("body").path("nickname").asText()).isEqualTo("내닉네임");
        assertThat(result.path("diet").path("goal").asText()).isEqualTo("LOSE");
        assertThat(result.path("trainer").path("workoutGoal").asText()).isEqualTo("health");
        assertThat(result.path("trainer").path("injuries").size()).isEqualTo(2);
    }

    @Test
    void 체력측정은_0과_빈값을_구분하고_설정을_해제할수있다() throws Exception {
        save("tests", Map.of("restingHeartRate", 65, "pushups", 0, "squat30s", 15, "plankSeconds", 0))
            .andExpect(status().isOk());
        assertThat(reload(USER).path("tests").path("pushups").asInt(-1)).isZero();
        save("tests", Map.of()).andExpect(status().isOk());
        assertThat(reload(USER).path("tests").has("pushups")).isFalse();
    }

    @Test
    void 선택설정과_목록을_비워서_해제한다() throws Exception {
        save("diet", diet()).andExpect(status().isOk());
        save("diet", Map.of("allergies", List.of(), "excludedIngredients", List.of(),
            "preferredFoods", List.of(), "prioritizeFridge", false)).andExpect(status().isOk());
        var result = reload(USER).path("diet");
        assertThat(result.has("goal")).isFalse();
        assertThat(result.has("mealBudget")).isFalse();
        assertThat(result.path("allergies").isEmpty()).isTrue();
        assertThat(result.path("preferredFoods").isEmpty()).isTrue();
    }

    @Test
    void 잘못된_범위와_선택값과_목록을_거절한다() throws Exception {
        for (var change : List.of(Map.of("age", 17), Map.of("height", 175.55),
                Map.of("gender", "bad"), Map.of("activityLevel", "bad"), Map.of("nickname", " "))) {
            var request = body(); request.putAll(change);
            save("common", request).andExpect(status().isBadRequest());
        }
        for (var change : List.of(Map.of("workoutMinutes", 31), Map.of("daysPerWeek", 7),
                Map.of("workoutGoal", "bad"), Map.of("equipment", List.of("bad")),
                Map.of("equipment", List.of("none", "dumbbell")), Map.of("injuries", List.of(" ")))) {
            var request = fitness(); request.putAll(change);
            save("fitness", request).andExpect(status().isBadRequest());
        }
        for (var change : List.of(Map.of("cookTimeMin", 15), Map.of("mealBudget", 0),
                Map.of("defaultServings", 7), Map.of("preferredFoods", List.of(" ")),
                Map.of("allergies", List.of("x".repeat(101))))) {
            var request = diet(); request.putAll(change);
            save("diet", request).andExpect(status().isBadRequest());
        }
        save("tests", Map.of("pushups", 1.5)).andExpect(status().isBadRequest());
        save("tests", Map.of("pushups", -1)).andExpect(status().isBadRequest());
        save("tests", Map.of("plankSeconds", 7201)).andExpect(status().isBadRequest());
        save("tests", Map.of("restingHeartRate", 251)).andExpect(status().isBadRequest());
        var incomplete = trainer(); incomplete.remove("workoutLevel");
        save("trainer", incomplete).andExpect(status().isBadRequest());
        var missingList = fitness(); missingList.remove("equipment");
        save("fitness", missingList).andExpect(status().isBadRequest());
    }

    @Test
    void 미인증_조회와_저장을_차단한다() throws Exception {
        mvc.perform(get(PATH)).andExpect(status().isUnauthorized());
        for (String section : List.of("common", "trainer", "diet", "fitness", "tests")) {
            mvc.perform(put(PATH + "/" + section).header("X-User-Id", USER)
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        }
    }

    @Test
    void 다른회원ID를_끼워도_자기정보만_변경한다() throws Exception {
        mvc.perform(put(PATH + "/common").with(user(USER))
                .header("X-User-Id", OTHER).queryParam("userId", Long.toString(OTHER))
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body())))
            .andExpect(status().isOk());
        assertThat(reload(OTHER).path("body").path("nickname").asText()).isEqualTo("테스트회원" + OTHER);
        assertThat(reload(OTHER).path("body").has("age")).isFalse();
    }

    @Test
    void 기존_간단프로필API로_수정해도_확장설정은_보존한다() throws Exception {
        save("trainer", trainer()).andExpect(status().isOk());
        mvc.perform(put("/api/v1/me/profile").with(user(USER)).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("nickname", "변경", "goal", "MAINTAIN",
                    "allergies", List.of("달걀"), "excludedIngredients", List.of()))))
            .andExpect(status().isOk());
        var result = reload(USER);
        assertThat(result.path("body").path("nickname").asText()).isEqualTo("변경");
        assertThat(result.path("trainer").path("workoutGoal").asText()).isEqualTo("hypertrophy");
        assertThat(result.path("trainer").path("allergies").get(0).asText()).isEqualTo("달걀");
    }
}

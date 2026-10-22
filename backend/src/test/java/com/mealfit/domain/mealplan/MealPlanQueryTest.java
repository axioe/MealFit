package com.mealfit.domain.mealplan;

import com.mealfit.support.TestUserFixture;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.jdbc.core.JdbcTemplate;

import com.mealfit.support.TestJwt;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mealfit.domain.cooking.CookingEvent;
import com.mealfit.domain.cooking.CookingEventRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** 날짜별 식단 조회 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MealPlanQueryTest {

    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("Asia/Seoul"));
    private static final LocalDate DATE = TODAY.plusDays(1);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate fixtureJdbc;

    /** 프로필 연결부가 실제 회원 조건을 읽을 수 있도록 기본 데이터를 준비합니다. */
    @BeforeEach
    void prepareUserProfile() {
        // 이 클래스의 @Transactional에 포함돼 테스트 종료 시 함께 롤백됩니다.
        TestUserFixture.create(fixtureJdbc, 1L);
    }


    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private CookingEventRepository cookingEventRepository;

    @Autowired
    private EntityManager entityManager;

    private JsonNode recommend(LocalDate date) throws Exception {
        String body = mockMvc.perform(post("/api/v1/meal-plans/recommend").with(TestJwt.user(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"planDate\":\"" + date + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("mealPlans");
    }

    @Test
    void 날짜별_식단을_아침_점심_저녁_순으로_조회한다() throws Exception {
        JsonNode plans = recommend(DATE);

        mockMvc.perform(get("/api/v1/meal-plans").with(TestJwt.user(1L)).param("date", DATE.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planDate").value(DATE.toString()))
                .andExpect(jsonPath("$.mealPlans.length()").value(3))
                .andExpect(jsonPath("$.mealPlans[0].mealType").value("BREAKFAST"))
                .andExpect(jsonPath("$.mealPlans[0].id").value(plans.get(0).get("id").asLong()))
                .andExpect(jsonPath("$.mealPlans[1].mealType").value("LUNCH"))
                .andExpect(jsonPath("$.mealPlans[2].mealType").value("DINNER"))
                .andExpect(jsonPath("$.mealPlans[0].recipe.source").value("LOCAL_FALLBACK"))
                .andExpect(jsonPath("$.mealPlans[0].cooked").value(false));
    }

    @Test
    void 취소된_식단은_빼고_재추천한_식단을_보여준다() throws Exception {
        JsonNode plans = recommend(DATE);
        long oldBreakfast = plans.get(0).get("id").asLong();
        String body = mockMvc.perform(post("/api/v1/meal-plans/{id}/regenerate", oldBreakfast).with(TestJwt.user(1L)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long newBreakfast = objectMapper.readTree(body).get("id").asLong();

        mockMvc.perform(get("/api/v1/meal-plans").with(TestJwt.user(1L)).param("date", DATE.toString()))
                .andExpect(jsonPath("$.mealPlans.length()").value(3))
                .andExpect(jsonPath("$.mealPlans[0].id").value(newBreakfast));
    }

    @Test
    void 조리한_식단은_cooked가_true다() throws Exception {
        JsonNode plans = recommend(DATE);
        MealPlan lunch = mealPlanRepository.findById(plans.get(1).get("id").asLong()).orElseThrow();
        lunch.confirm();
        cookingEventRepository.save(CookingEvent.cooked(1L, lunch, 1));
        entityManager.flush();

        mockMvc.perform(get("/api/v1/meal-plans").with(TestJwt.user(1L)).param("date", DATE.toString()))
                .andExpect(jsonPath("$.mealPlans[1].status").value("CONFIRMED"))
                .andExpect(jsonPath("$.mealPlans[1].cooked").value(true))
                .andExpect(jsonPath("$.mealPlans[0].cooked").value(false));
    }

    @Test
    void 날짜가_없으면_오늘_식단을_조회한다() throws Exception {
        recommend(TODAY);

        mockMvc.perform(get("/api/v1/meal-plans").with(TestJwt.user(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planDate").value(TODAY.toString()))
                .andExpect(jsonPath("$.mealPlans.length()").value(3));
    }

    @Test
    void 식단이_없거나_다른_사용자면_빈_목록이다() throws Exception {
        recommend(DATE);

        mockMvc.perform(get("/api/v1/meal-plans").with(TestJwt.user(1L)).param("date", DATE.plusDays(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mealPlans.length()").value(0));
        mockMvc.perform(get("/api/v1/meal-plans").with(TestJwt.user(1L)).param("date", DATE.toString()).with(TestJwt.user(2L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mealPlans.length()").value(0));
    }

    @Test
    void 날짜_형식이_틀리면_400() throws Exception {
        mockMvc.perform(get("/api/v1/meal-plans").with(TestJwt.user(1L)).param("date", "2026-13-40"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
    }
}

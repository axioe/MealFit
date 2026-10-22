package com.mealfit.domain.mealplan;

import com.mealfit.support.TestJwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.inventory.InventoryLotRepository;
import com.mealfit.domain.inventory.StorageLocation;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

/** AI 연결부가 없는 상태(로컬 대체만)의 추천·재추천. 시드 레시피는 V2 마이그레이션 것을 쓴다. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MealPlanRecommendTest {

    private static final LocalDate DATE = LocalDate.now().plusDays(1);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private InventoryLotRepository inventoryLotRepository;

    @Autowired
    private EntityManager entityManager;

    private ResultActions recommend(LocalDate date) throws Exception {
        return mockMvc.perform(post("/api/v1/meal-plans/recommend").with(TestJwt.user(1L))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"planDate\":\"" + date + "\"}"));
    }

    private JsonNode recommendOk(LocalDate date) throws Exception {
        String body = recommend(date).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("mealPlans");
    }

    private JsonNode regenerate(long id) throws Exception {
        String body = mockMvc.perform(post("/api/v1/meal-plans/{id}/regenerate", id).with(TestJwt.user(1L)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body);
    }

    private MealPlan plan(JsonNode node) {
        return mealPlanRepository.findById(node.get("id").asLong()).orElseThrow();
    }

    private void saveLot(String name, LocalDate expiryDate) {
        inventoryLotRepository.save(InventoryLot.builder()
                .userId(1L)
                .ingredientName(name)
                .quantity(new BigDecimal("300"))
                .unit("g")
                .expiryDate(expiryDate)
                .storageLocation(StorageLocation.FRIDGE)
                .build());
    }

    @Test
    void 로컬_대체로_세_끼_초안을_만든다() throws Exception {
        recommend(DATE)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.planDate").value(DATE.toString()))
                .andExpect(jsonPath("$.mealPlans.length()").value(3))
                .andExpect(jsonPath("$.mealPlans[0].mealType").value("BREAKFAST"))
                .andExpect(jsonPath("$.mealPlans[1].mealType").value("LUNCH"))
                .andExpect(jsonPath("$.mealPlans[2].mealType").value("DINNER"))
                .andExpect(jsonPath("$.mealPlans[*].status").value(org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is("DRAFT"))))
                .andExpect(jsonPath("$.mealPlans[*].recipe.source").value(org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is("LOCAL_FALLBACK"))))
                .andExpect(jsonPath("$.mealPlans[0].servings").value(1))
                .andExpect(jsonPath("$.mealPlans[0].recommendationReason").isNotEmpty());
    }

    @Test
    void 전체_재추천은_초안만_바꾸고_확정된_끼니는_유지한다() throws Exception {
        JsonNode first = recommendOk(DATE);
        MealPlan lunch = plan(first.get(1));
        lunch.confirm();
        entityManager.flush();

        JsonNode second = recommendOk(DATE);

        assertThat(second).hasSize(3);
        assertThat(second.get(1).get("id").asLong()).isEqualTo(lunch.getId());
        assertThat(second.get(1).get("status").asText()).isEqualTo("CONFIRMED");
        assertThat(second.get(0).get("id").asLong()).isNotEqualTo(first.get(0).get("id").asLong());
        assertThat(second.get(2).get("id").asLong()).isNotEqualTo(first.get(2).get("id").asLong());
        // 직전 초안과 다른 메뉴를 고른다 (후보가 3개씩 있다)
        assertThat(second.get(0).get("recipe").get("name").asText())
                .isNotEqualTo(first.get(0).get("recipe").get("name").asText());
        assertThat(plan(first.get(0)).getStatus()).isEqualTo(MealPlanStatus.CANCELED);
        assertThat(plan(first.get(2)).getStatus()).isEqualTo(MealPlanStatus.CANCELED);
    }

    @Test
    void 세_끼가_모두_확정되면_재추천할_수_없다() throws Exception {
        recommendOk(DATE).forEach(node -> plan(node).confirm());
        entityManager.flush();

        recommend(DATE)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MEAL_PLAN_003"));
    }

    @Test
    void 한_끼_재추천은_그_끼니만_바꾼다() throws Exception {
        JsonNode plans = recommendOk(DATE);
        long breakfastId = plans.get(0).get("id").asLong();

        JsonNode regenerated = regenerate(breakfastId);

        assertThat(regenerated.get("id").asLong()).isNotEqualTo(breakfastId);
        assertThat(regenerated.get("mealType").asText()).isEqualTo("BREAKFAST");
        assertThat(regenerated.get("status").asText()).isEqualTo("DRAFT");
        assertThat(regenerated.get("recipe").get("name").asText())
                .isNotEqualTo(plans.get(0).get("recipe").get("name").asText());
        assertThat(plan(plans.get(0)).getStatus()).isEqualTo(MealPlanStatus.CANCELED);
        // 점심·저녁은 그대로
        assertThat(plan(plans.get(1)).getStatus()).isEqualTo(MealPlanStatus.DRAFT);
        assertThat(plan(plans.get(2)).getStatus()).isEqualTo(MealPlanStatus.DRAFT);
        List<MealPlan> alive = mealPlanRepository.findByUserIdAndPlanDateAndStatusNot(
                1L, DATE, MealPlanStatus.CANCELED);
        assertThat(alive).hasSize(3);
        Set<String> names = new HashSet<>();
        alive.forEach(p -> names.add(p.getRecipe().getName()));
        assertThat(names).hasSize(3);
    }

    @Test
    void 확정된_식단은_한_끼_재추천할_수_없다() throws Exception {
        MealPlan breakfast = plan(recommendOk(DATE).get(0));
        breakfast.confirm();
        entityManager.flush();

        mockMvc.perform(post("/api/v1/meal-plans/{id}/regenerate", breakfast.getId()).with(TestJwt.user(1L)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MEAL_PLAN_002"));
    }

    @Test
    void 다른_사용자의_식단은_재추천할_수_없다() throws Exception {
        long breakfastId = recommendOk(DATE).get(0).get("id").asLong();

        mockMvc.perform(post("/api/v1/meal-plans/{id}/regenerate", breakfastId).with(TestJwt.user(2L)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("MEAL_PLAN_001"));
    }

    @Test
    void 날짜가_없으면_400() throws Exception {
        mockMvc.perform(post("/api/v1/meal-plans/recommend").with(TestJwt.user(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
    }

    @Test
    void 기한_임박_재료를_쓰는_레시피를_먼저_고른다() throws Exception {
        saveLot("돼지고기", LocalDate.now().plusDays(1));

        JsonNode dinner = recommendOk(DATE).get(2);

        assertThat(dinner.get("recipe").get("name").asText()).isEqualTo("돼지고기 김치찌개");
        assertThat(dinner.get("recommendationReason").asText()).contains("돼지고기");
    }

    @Test
    void 기한이_지난_재고는_추천에_쓰지_않는다() throws Exception {
        saveLot("돼지고기", LocalDate.now().minusDays(1));

        JsonNode dinner = recommendOk(DATE).get(2);

        assertThat(dinner.get("recipe").get("name").asText()).isNotEqualTo("돼지고기 김치찌개");
    }
}

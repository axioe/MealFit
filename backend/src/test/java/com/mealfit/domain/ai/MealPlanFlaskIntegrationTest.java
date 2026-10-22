package com.mealfit.domain.ai;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mealfit.domain.inventory.*;
import com.mealfit.domain.mealplan.MealPlanAiClient;
import com.mealfit.support.TestJwt;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.anything;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@Import(MealPlanFlaskIntegrationTest.Config.class)
class MealPlanFlaskIntegrationTest {
    @TestConfiguration static class Config {
        @Bean MealBridge mealBridge(@org.springframework.beans.factory.annotation.Qualifier("aiRestClient") RestClient configured) {
            return new MealBridge(configured);
        }
        @Bean MockRestServiceServer mealServer(MealBridge bridge) { return bridge.server; }
        @Bean MealPlanAiClient mealClient(MealBridge bridge) { return request -> bridge.client.recommend(request); }
    }
    static class MealBridge {
        final MockRestServiceServer server;
        MealPlanAiClient client;
        MealBridge(RestClient configured) {
            var builder = configured.mutate().baseUrl("http://meal.test");
            server = MockRestServiceServer.bindTo(builder).build();
            client = new FlaskMealPlanAiClient(builder.build());
        }
    }
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired MockRestServiceServer mealServer;
    @Autowired InventoryLotRepository inventory;
    @Autowired MealBridge bridge;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("aiRestClient") RestClient configuredAi;
    private final LocalDate day = LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(2);

    @BeforeEach void setup() { mealServer.reset(); }

    private String meal(String kind) { return FlaskMealPlanAiClientTest.MEAL.replace("LUNCH", kind).replace("두부 볶음", kind + " 새 두부 요리"); }
    private JsonNode recommend() throws Exception {
        return mapper.readTree(mvc.perform(post("/api/v1/meal-plans/recommend").with(TestJwt.user(1L))
                .contentType(MediaType.APPLICATION_JSON).content("{\"planDate\":\"" + day + "\",\"servings\":2}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    @Test void savesAiRecipesAndRestoresByDateWithUserIsolation() throws Exception {
        inventory.save(InventoryLot.builder().userId(1L).ingredientName("내 재료").quantity(new BigDecimal("300"))
                .unit("g").storageLocation(StorageLocation.FRIDGE).build());
        inventory.save(InventoryLot.builder().userId(2L).ingredientName("타인 재료").quantity(new BigDecimal("100"))
                .unit("g").storageLocation(StorageLocation.FRIDGE).build());
        mealServer.expect(requestTo("http://meal.test/ai/meal-plans"))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.planDate").value(day.toString()))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.inventory[*].ingredientName").value(org.hamcrest.Matchers.hasItem("내 재료")))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.inventory[*].ingredientName").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem("타인 재료"))))
                .andRespond(withSuccess("[" + meal("BREAKFAST") + "," + meal("LUNCH") + "," + meal("DINNER") + "]", MediaType.APPLICATION_JSON));
        JsonNode response = recommend();
        for (JsonNode plan : response.get("mealPlans")) {
            assertThat(plan.get("id").asLong()).isPositive();
            assertThat(plan.get("status").asText()).isEqualTo("DRAFT");
            assertThat(plan.get("recipe").get("source").asText()).isEqualTo("AI_GENERATED");
            mvc.perform(get("/api/v1/recipes/{id}", plan.get("recipe").get("id").asLong()).with(TestJwt.user(1L)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.nutritionEstimated").value(true))
                    .andExpect(jsonPath("$.servingSize").value(2))
                    .andExpect(jsonPath("$.ingredients[0].quantity").value(300.125));
        }
        mvc.perform(get("/api/v1/meal-plans").param("date", day.toString()).with(TestJwt.user(1L)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.mealPlans.length()").value(3));
        mealServer.verify();
    }

    @Test void regeneratesOnlyRequestedDraftAndKeepsConfirmedMeal() throws Exception {
        mealServer.expect(anything()).andRespond(withSuccess("[" + meal("BREAKFAST") + "," + meal("LUNCH") + "," + meal("DINNER") + "]", MediaType.APPLICATION_JSON));
        JsonNode plans = recommend().get("mealPlans");
        long breakfast = plans.get(0).get("id").asLong(), lunch = plans.get(1).get("id").asLong();
        mvc.perform(post("/api/v1/meal-plans/{id}/confirm", breakfast).with(TestJwt.user(1L))).andExpect(status().isOk());
        mealServer.reset();
        mealServer.expect(anything()).andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.mealTypes.length()").value(1))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.mealTypes[0]").value("LUNCH"))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.keptMeals").isArray())
                .andRespond(withSuccess("[" + meal("LUNCH").replace("새 두부", "다른 두부") + "]", MediaType.APPLICATION_JSON));
        mvc.perform(post("/api/v1/meal-plans/{id}/regenerate", lunch).with(TestJwt.user(1L)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.recipe.source").value("AI_GENERATED"));
        mvc.perform(get("/api/v1/meal-plans").param("date", day.toString()).with(TestJwt.user(1L)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.mealPlans[0].id").value(breakfast))
                .andExpect(jsonPath("$.mealPlans[0].status").value("CONFIRMED"))
                .andExpect(jsonPath("$.mealPlans[2].id").value(plans.get(2).get("id").asLong()));
        mealServer.verify();
    }

    @Test void upstreamFailureUsesExistingClearlyLabeledFallback() throws Exception {
        mealServer.expect(anything()).andRespond(withStatus(org.springframework.http.HttpStatus.GATEWAY_TIMEOUT));
        for (JsonNode plan : recommend().get("mealPlans")) {
            assertThat(plan.get("recipe").get("source").asText()).isEqualTo("LOCAL_FALLBACK");
        }
    }

    @Test @EnabledIfEnvironmentVariable(named = "MEALFIT_LIVE_AI_URL", matches = ".+")
    void liveFlaskResponsePassesExistingPersistenceAndRecipeValidation() throws Exception {
        MealPlanAiClient previous = bridge.client;
        bridge.client = new FlaskMealPlanAiClient(configuredAi.mutate().baseUrl(System.getenv("MEALFIT_LIVE_AI_URL")).build());
        try {
            JsonNode plans = recommend().get("mealPlans");
            assertThat(plans.size()).isEqualTo(3);
            for (JsonNode plan : plans) {
                assertThat(plan.get("recipe").get("source").asText()).isEqualTo("AI_GENERATED");
                assertThat(plan.get("id").asLong()).isPositive();
            }
            System.out.println("LIVE_DAY_AI: authenticated MVC -> Spring -> Flask -> Gemini -> rollback-only H2: 3 meals saved");
        } finally {
            bridge.client = previous;
        }
    }
}

package com.mealfit.integration;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mealfit.domain.inventory.*;
import com.mealfit.domain.mealplan.*;
import com.mealfit.domain.mealplan.dto.AiMealPlanRequest;
import com.mealfit.domain.mealplan.dto.AiMealSuggestion;
import com.mealfit.domain.recipe.*;
import com.mealfit.support.TestJwt;
import com.mealfit.support.TestUserFixture;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
class UserJourneyIntegrationTest {
    private static final long USER = 91022L, OTHER = 91023L;
    private final LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired RecipeRepository recipes;
    @Autowired MealPlanRepository plans;
    @Autowired InventoryLotRepository lots;
    @Autowired InventoryTransactionRepository history;
    @Autowired EntityManager em;
    @Autowired JdbcTemplate jdbc;
    @Autowired javax.sql.DataSource dataSource;
    @MockitoBean MealPlanAiClient ai;

    @BeforeEach void setup() throws Exception {
        try (var connection = dataSource.getConnection()) {
            assertThat(connection.getMetaData().getURL()).startsWith("jdbc:h2:");
        }
        TestUserFixture.create(jdbc, USER);
        TestUserFixture.create(jdbc, OTHER);
        AtomicInteger sequence = new AtomicInteger();
        when(ai.recommend(any())).thenAnswer(call -> {
            AiMealPlanRequest request = call.getArgument(0);
            return request.mealTypes().stream().map(type -> new AiMealSuggestion(type,
                    type + " 통합식단 " + sequence.incrementAndGet(), "통합 테스트 응답", request.servings(), 15,
                    new BigDecimal("400"), new BigDecimal("20"), new BigDecimal("50"), new BigDecimal("10"),
                    List.of(new AiMealSuggestion.Ingredient("통합두부", new BigDecimal("300"), "g")),
                    List.of("두부를 준비하고 충분히 익힙니다."), "보유 재료 활용")).toList();
        });
    }

    private JsonNode send(MockHttpServletRequestBuilder request, Object body, int status) throws Exception {
        if (body != null) request.contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body));
        return mapper.readTree(mvc.perform(request.with(TestJwt.user(USER))).andExpect(status().is(status))
                .andReturn().getResponse().getContentAsString());
    }
    private long stock(String name, String amount, String unit, LocalDate expiry) throws Exception {
        var body = new java.util.LinkedHashMap<String, Object>();
        body.put("ingredientName", name); body.put("quantity", amount); body.put("unit", unit);
        body.put("storageLocation", "FRIDGE"); body.put("expiryDate", expiry);
        return send(post("/api/v1/inventory/lots"), body, 201).get("id").asLong();
    }
    private BigDecimal quantity(long id) {
        em.flush(); em.clear();
        return lots.findById(id).orElseThrow().getQuantity();
    }
    private JsonNode shopping() throws Exception { return send(get("/api/v1/shopping-items"), null, 200); }
    private JsonNode purchase(long id, String amount) throws Exception {
        return send(patch("/api/v1/shopping-items"), Map.of("items", List.of(Map.of("id", id, "purchasedQty", amount))), 200);
    }
    private JsonNode stockPurchase(long id, String amount) throws Exception {
        return send(post("/api/v1/shopping-items/stock-in"), Map.of("items", List.of(Map.of("id", id,
                "quantity", amount, "storageLocation", "FRIDGE", "expiryDate", today.plusDays(7)))), 201);
    }
    private Map<String, Object> quick(String id, String name, String amount, String unit) {
        return Map.of("clientRequestId", id, "recipeName", "통합 간편 요리", "servings", 1,
                "ingredients", List.of(Map.of("ingredientName", name, "quantity", amount, "unit", unit)));
    }

    @Test void recommendConfirmPartialPurchaseStockCookRestoreAndDisposeStayConsistent() throws Exception {
        long early = stock("통합두부", "100", "g", today.plusDays(1));
        long later = stock("통합두부", "150", "g", today.plusDays(5));
        stock("통합두부", "500", "g", today.minusDays(1));
        JsonNode result = send(post("/api/v1/meal-plans/recommend"), Map.of("planDate", today, "servings", 1), 201);
        JsonNode lunch = result.get("mealPlans").get(1);
        long planId = lunch.get("id").asLong();
        assertThat(lunch.get("recipe").get("source").asText()).isEqualTo("AI_GENERATED");
        send(post("/api/v1/meal-plans/{id}/confirm", planId), null, 200);
        JsonNode item = shopping().get(0);
        long shoppingId = item.get("id").asLong();
        assertThat(item.get("requiredQty").decimalValue()).isEqualByComparingTo("50");
        assertThat(purchase(shoppingId, "20").get(0).get("remainingQty").decimalValue()).isEqualByComparingTo("30");
        stockPurchase(shoppingId, "20");
        assertThat(shopping().get(0).get("requiredQty").decimalValue()).isEqualByComparingTo("30");
        purchase(shoppingId, "30"); stockPurchase(shoppingId, "30");
        assertThat(shopping().isEmpty()).isTrue();
        var cook = Map.of("mealPlanId", planId, "ingredients", List.of(Map.of("ingredientName", "통합두부", "quantity", "220", "unit", "g")));
        JsonNode preview = send(post("/api/v1/cooking/preview"), cook, 200);
        assertThat(preview.get("canCook").asBoolean()).isTrue();
        assertThat(preview.get("ingredients").get(0).get("deductions").get(0).get("lotId").asLong()).isEqualTo(early);
        JsonNode event = send(post("/api/v1/cooking-events"), cook, 201);
        long eventId = event.get("id").asLong();
        assertThat(quantity(early)).isZero();
        assertThat(quantity(later)).isEqualByComparingTo("30");
        send(post("/api/v1/cooking-events"), cook, 409);
        assertThat(shopping().isEmpty()).isTrue();
        JsonNode saved = send(get("/api/v1/meal-plans").param("date", today.toString()), null, 200).get("mealPlans").get(1);
        assertThat(saved.get("cooked").asBoolean()).isTrue();
        send(post("/api/v1/cooking-events/{id}/cancel", eventId), null, 200);
        send(post("/api/v1/cooking-events/{id}/cancel", eventId), null, 409);
        assertThat(quantity(early)).isEqualByComparingTo("100");
        assertThat(quantity(later)).isEqualByComparingTo("150");
        send(patch("/api/v1/inventory/lots/{id}", early), Map.of("action", "DISPOSE", "quantity", "20"), 200);
        assertThat(shopping().get(0).get("requiredQty").decimalValue()).isEqualByComparingTo("20");
        assertThat(history.findByUserIdOrderByCreatedAtDescIdDesc(USER).stream()
                .filter(change -> change.getType() == InventoryTransactionType.COOK_DEDUCT || change.getType() == InventoryTransactionType.COOK_RESTORE)
                .map(InventoryTransaction::getQtyChange).reduce(BigDecimal.ZERO, BigDecimal::add)).isZero();
    }

    @Test void sameUuidAfterRestoreReturnsOriginalRestoredEventWithoutDeductingAgain() throws Exception {
        long lot = stock("통합달걀", "6", "개", null);
        Map<String, Object> body = quick(UUID.randomUUID().toString(), "통합달걀", "2", "개");
        JsonNode first = send(post("/api/v1/cooking-events/ingredients"), body, 201);
        JsonNode replay = send(post("/api/v1/cooking-events/ingredients"), body, 201);
        assertThat(replay.get("id")).isEqualTo(first.get("id"));
        assertThat(quantity(lot)).isEqualByComparingTo("4");
        send(post("/api/v1/cooking-events/{id}/cancel", first.get("id").asLong()), null, 200);
        JsonNode restored = send(post("/api/v1/cooking-events/ingredients"), body, 201);
        assertThat(restored.get("status").asText()).isEqualTo("RESTORED");
        assertThat(quantity(lot)).isEqualByComparingTo("6");
        mvc.perform(post("/api/v1/cooking-events/{id}/cancel", first.get("id").asLong()).with(TestJwt.user(OTHER)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/inventory/transactions").param("lotId", String.valueOf(lot)).with(TestJwt.user(OTHER)))
                .andExpect(status().isNotFound());
    }

    @Test void editedUsageCanExcludeIngredientAndReduceQuantityWithoutChangingRecipe() throws Exception {
        long tofu = stock("사용량두부", "300", "g", null), egg = stock("사용량달걀", "3", "개", null);
        Recipe recipe = Recipe.builder().userId(USER).name("사용량 테스트").servingSize(1).cookTimeMin(10)
                .source(RecipeSource.AI_GENERATED).nutritionEstimated(true).steps(List.of("익힌다.")).build();
        recipe.addIngredient("사용량두부", new BigDecimal("200"), "g");
        recipe.addIngredient("사용량달걀", BigDecimal.ONE, "개");
        recipes.save(recipe);
        MealPlan plan = MealPlan.builder().userId(USER).planDate(today).mealType(MealType.DINNER).recipe(recipe).servings(1).build();
        plan.confirm(); plans.save(plan);
        JsonNode result = send(post("/api/v1/cooking-events"), Map.of("mealPlanId", plan.getId(), "ingredients",
                List.of(Map.of("ingredientName", "사용량두부", "quantity", "120", "unit", "g"))), 201);
        assertThat(result.get("changes").size()).isEqualTo(1);
        assertThat(quantity(tofu)).isEqualByComparingTo("180");
        assertThat(quantity(egg)).isEqualByComparingTo("3");
        JsonNode detail = send(get("/api/v1/recipes/{id}", recipe.getId()), null, 200);
        assertThat(detail.get("ingredients").get(0).get("quantity").decimalValue()).isEqualByComparingTo("200");
    }

    @Test void expiredDepletedAndIncompatibleUnitsCannotSupplyCooking() throws Exception {
        stock("단위검증양파", "4", "개", null);
        stock("단위검증양파", "100", "g", today.minusDays(1));
        long depleted = stock("단위검증양파", "50", "g", null);
        send(patch("/api/v1/inventory/lots/{id}", depleted), Map.of("action", "ADJUST", "quantity", "0"), 200);
        var body = quick(UUID.randomUUID().toString(), "단위검증양파", "50", "g");
        JsonNode preview = send(post("/api/v1/cooking/ingredients/preview"), body, 200);
        assertThat(preview.get("canCook").asBoolean()).isFalse();
        assertThat(preview.get("ingredients").get(0).get("availableQty").decimalValue()).isZero();
        assertThat(send(post("/api/v1/cooking-events/ingredients"), body, 409).get("code").asText()).isEqualTo("COOKING_004");
        assertThat(quantity(depleted)).isZero();
    }

    @Test void regenerationAndRepeatedRecommendationKeepConfirmedMealAndDate() throws Exception {
        var body = Map.of("planDate", today, "servings", 1);
        JsonNode original = send(post("/api/v1/meal-plans/recommend"), body, 201).get("mealPlans");
        long breakfast = original.get(0).get("id").asLong(), lunch = original.get(1).get("id").asLong();
        send(post("/api/v1/meal-plans/{id}/confirm", breakfast), null, 200);
        send(post("/api/v1/meal-plans/{id}/regenerate", lunch), null, 201);
        JsonNode replaced = send(post("/api/v1/meal-plans/recommend"), body, 201).get("mealPlans");
        assertThat(replaced.size()).isEqualTo(3);
        assertThat(replaced.get(0).get("id").asLong()).isEqualTo(breakfast);
        assertThat(replaced.get(0).get("status").asText()).isEqualTo("CONFIRMED");
        assertThat(send(get("/api/v1/meal-plans").param("date", today.plusDays(1).toString()), null, 200).get("mealPlans").isEmpty()).isTrue();
        assertThat(send(get("/api/v1/meal-plans").param("date", today.toString()), null, 200).get("mealPlans").size()).isEqualTo(3);
        mvc.perform(get("/api/v1/recipes/{id}", original.get(0).get("recipe").get("id").asLong()).with(TestJwt.user(OTHER)))
                .andExpect(status().isNotFound());
    }
}

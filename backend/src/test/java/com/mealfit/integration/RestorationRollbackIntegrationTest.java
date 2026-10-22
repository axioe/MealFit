package com.mealfit.integration;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mealfit.domain.cooking.CookingService;
import com.mealfit.domain.cooking.CookingEventRepository;
import com.mealfit.domain.cooking.CookingStatus;
import com.mealfit.domain.cooking.dto.IngredientCookingRequest;
import com.mealfit.domain.inventory.*;
import com.mealfit.domain.inventory.dto.StockInRequest;
import com.mealfit.domain.inventory.dto.UpdateLotRequest;
import com.mealfit.support.TestJwt;
import com.mealfit.support.TestUserFixture;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class RestorationRollbackIntegrationTest {
    private static final long USER = 91021L;
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired InventoryService inventory;
    @Autowired InventoryLotRepository lots;
    @Autowired InventoryTransactionRepository history;
    @Autowired CookingEventRepository events;
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;
    @Autowired com.mealfit.domain.shopping.ShoppingItemRepository shopping;
    @Autowired CookingService cooking;
    private TestUserFixture user;

    @BeforeEach void setup() throws Exception {
        try (var connection = dataSource.getConnection()) {
            assertThat(connection.getMetaData().getURL()).startsWith("jdbc:h2:");
        }
        user = TestUserFixture.create(jdbc, USER);
    }

    @AfterEach void cleanup() {
        if (user == null) return;
        // 이 테스트의 H2 데이터만 정리한다.
        for (String table : List.of("inventory_transactions", "cooking_events", "inventory_lots", "shopping_items"))
            jdbc.update("delete from " + table + " where user_id = ?", USER);
        user.close();
    }

    @Test void overflowingRestoreReturns400AndRollsBackEarlierLotAndHistory() throws Exception {
        long first = stock("복원첫째", "10"), second = stock("복원둘째", "10");
        Map<String, Object> body = Map.of("recipeName", "복원 경계 요리", "clientRequestId", UUID.randomUUID().toString(),
                "ingredients", List.of(Map.of("ingredientName", "복원첫째", "quantity", 1, "unit", "g"),
                        Map.of("ingredientName", "복원둘째", "quantity", 1, "unit", "g")));
        long eventId = mapper.readTree(mvc.perform(post("/api/v1/cooking-events/ingredients").with(TestJwt.user(USER))
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asLong();
        inventory.update(USER, second, new UpdateLotRequest(InventoryAction.ADJUST,
                new BigDecimal("999999999.999"), null, null, null, null, null));
        long count = history.count();
        mvc.perform(post("/api/v1/cooking-events/{id}/cancel", eventId).with(TestJwt.user(USER)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVENTORY_002"));
        assertThat(lots.findById(first).orElseThrow().getQuantity()).isEqualByComparingTo("9");
        assertThat(lots.findById(second).orElseThrow().getQuantity()).isEqualByComparingTo("999999999.999");
        assertThat(history.count()).isEqualTo(count);
        assertThat(events.findById(eventId).orElseThrow().getStatus()).isEqualTo(CookingStatus.COOKED);
        inventory.update(USER, second, new UpdateLotRequest(InventoryAction.ADJUST, new BigDecimal("9"), null, null, null, null, null));
        mvc.perform(post("/api/v1/cooking-events/{id}/cancel", eventId).with(TestJwt.user(USER))).andExpect(status().isOk());
        assertThat(lots.findById(first).orElseThrow().getQuantity()).isEqualByComparingTo("10");
        assertThat(lots.findById(second).orElseThrow().getQuantity()).isEqualByComparingTo("10");
    }

    private long stock(String name, String quantity) {
        return inventory.stockIn(USER, new StockInRequest(name, new BigDecimal(quantity), "g", null,
                StorageLocation.FRIDGE, null, null)).id();
    }

    @Test void failedMultiItemStockInRollsBackCreatedLotHistoryAndPurchasedQuantity() throws Exception {
        var first = com.mealfit.domain.shopping.ShoppingItem.create(USER, "구매첫째", new BigDecimal("20"), "g");
        var second = com.mealfit.domain.shopping.ShoppingItem.create(USER, "구매둘째", new BigDecimal("20"), "g");
        first.recordPurchase(new BigDecimal("10")); second.recordPurchase(new BigDecimal("10"));
        shopping.saveAllAndFlush(List.of(first, second));
        long count = history.count();
        var body = Map.of("items", List.of(Map.of("id", first.getId(), "quantity", 5, "storageLocation", "FRIDGE"),
                Map.of("id", second.getId(), "quantity", 11, "storageLocation", "FRIDGE")));
        mvc.perform(post("/api/v1/shopping-items/stock-in").with(TestJwt.user(USER)).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body))).andExpect(status().isConflict());
        assertThat(lots.findByUserIdOrderByExpiryDateAscIdAsc(USER)).isEmpty();
        assertThat(history.count()).isEqualTo(count);
        assertThat(shopping.findById(first.getId()).orElseThrow().getPurchasedQty()).isEqualByComparingTo("10");
        assertThat(shopping.findById(second.getId()).orElseThrow().getPurchasedQty()).isEqualByComparingTo("10");
    }

    @Test void concurrentQuickCookingCannotSpendTheSameStockTwice() throws Exception {
        long lot = stock("동시조리", "300");
        var latch = new java.util.concurrent.CountDownLatch(1);
        try (var executor = java.util.concurrent.Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<String> operation = () -> {
                latch.await();
                try {
                    cooking.cookIngredients(USER, new IngredientCookingRequest(UUID.randomUUID().toString(), "동시 요리", 1,
                            List.of(new IngredientCookingRequest.Ingredient("동시조리", new BigDecimal("200"), "g"))));
                    return "OK";
                } catch (com.mealfit.global.exception.BusinessException failure) {
                    return failure.getErrorCode().getCode();
                }
            };
            var first = executor.submit(operation); var second = executor.submit(operation); latch.countDown();
            assertThat(List.of(first.get(15, java.util.concurrent.TimeUnit.SECONDS), second.get(15, java.util.concurrent.TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder("OK", "COOKING_004");
        }
        assertThat(lots.findById(lot).orElseThrow().getQuantity()).isEqualByComparingTo("100");
        assertThat(history.findByLotIdOrderByCreatedAtDesc(lot).stream().filter(change -> change.getType() == InventoryTransactionType.COOK_DEDUCT)).hasSize(1);
    }

    @Test void repeatedPartialStockInRequestsAreDistinctOperationsUnderCurrentContract() throws Exception {
        var item = com.mealfit.domain.shopping.ShoppingItem.create(USER, "부분입고계약", new BigDecimal("100"), "g");
        item.recordPurchase(new BigDecimal("100")); shopping.saveAndFlush(item);
        var body = Map.of("items", List.of(Map.of("id", item.getId(), "quantity", 30, "storageLocation", "FRIDGE")));
        for (int i = 0; i < 2; i++) mvc.perform(post("/api/v1/shopping-items/stock-in").with(TestJwt.user(USER))
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body))).andExpect(status().isCreated());
        assertThat(lots.findByUserIdOrderByExpiryDateAscIdAsc(USER)).hasSize(2);
        assertThat(shopping.findById(item.getId()).orElseThrow().getPurchasedQty()).isEqualByComparingTo("40");
    }
}

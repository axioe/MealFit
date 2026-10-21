package com.mealfit.domain.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.doAnswer;
import com.mealfit.domain.inventory.dto.UpdateLotRequest;
import com.mealfit.global.exception.BusinessException;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InventoryApiTest {

    private static final String LOTS = "/api/v1/inventory/lots";
    private static final String TRANSACTIONS = "/api/v1/inventory/transactions";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private InventoryLotRepository lotRepository;
    @MockitoSpyBean
    private InventoryTransactionRepository transactionRepository;

    @Autowired
    private InventoryService inventoryService;
    @Autowired
    private EntityManager entityManager;

    @BeforeEach
    void cleanInventory() {
        transactionRepository.deleteAll();
        lotRepository.deleteAll();
    }

    @Test
    void stockInCreatesLotAndPositiveHistory() throws Exception {
        long id = createLot(1, "두부", "300.125", "g", null);
        InventoryLot lot = lotRepository.findById(id).orElseThrow();
        assertThat(lot.getQuantity()).isEqualByComparingTo("300.125");
        assertThat(lot.getMinStockQty()).isEqualByComparingTo("0");
        assertThat(lot.getStatus()).isEqualTo(LotStatus.ACTIVE);
        mockMvc.perform(get(TRANSACTIONS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].lotId").value(id))
                .andExpect(jsonPath("$[0].type").value("STOCK_IN"))
                .andExpect(jsonPath("$[0].qtyChange").value(300.125));
    }

    @Test
    void emptyInventoryAndHistoryReturnEmptyLists() throws Exception {
        mockMvc.perform(get(LOTS)).andExpect(status().isOk()).andExpect(jsonPath("$.groups").isEmpty());
        mockMvc.perform(get(TRANSACTIONS)).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void groupsKeepLotsSeparateAndDoNotConvertUnitsOrMixUsers() throws Exception {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        createLot(1, "두부", "100", "g", today.minusDays(1));
        createLot(1, "두부", "200", "g", null);
        createLot(1, "두부", "50", "g", today);
        createLot(1, "두부", "1", "kg", null);
        createLot(2, "두부", "999", "g", null);
        JsonNode response = read(mockMvc.perform(get(LOTS)).andExpect(status().isOk()));
        assertThat(response.path("groups").size()).isEqualTo(2);
        JsonNode grams = null;
        for (JsonNode group : response.path("groups")) {
            if (group.path("unit").asText().equals("g")) {
                grams = group;
            }
        }
        assertThat(grams).isNotNull();
        assertThat(grams.path("lots").size()).isEqualTo(3);
        assertThat(grams.path("totalQuantity").decimalValue()).isEqualByComparingTo("350");
        assertThat(grams.path("availableQuantity").decimalValue()).isEqualByComparingTo("250");
        assertThat(grams.path("expiredQuantity").decimalValue()).isEqualByComparingTo("100");
    }

    @Test
    void adjustStoresDifferenceAndUpdatesMetadata() throws Exception {
        long id = createLot(1, "두부", "300", "g", null);
        update(1, id, """
                {"action":"ADJUST","quantity":125.5,"storageLocation":"FREEZER",
                 "expiryDate":"2027-01-01","minStockQty":20,"memo":"냉동 보관"}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(125.5))
                .andExpect(jsonPath("$.storageLocation").value("FREEZER"))
                .andExpect(jsonPath("$.expiryDate").value("2027-01-01"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        mockMvc.perform(get(TRANSACTIONS).param("lotId", String.valueOf(id)))
                .andExpect(jsonPath("$[0].type").value("ADJUST"))
                .andExpect(jsonPath("$[0].qtyChange").value(-174.5));
        assertThat(transactionRepository.count()).isEqualTo(2);
    }

    @Test
    void increasedQuantityStoresPositiveDifference() throws Exception {
        long id = createLot(1, "두부", "100", "g", null);
        update(1, id, """ 
                {"action":"ADJUST","quantity":120.001}
                """).andExpect(status().isOk());
        mockMvc.perform(get(TRANSACTIONS))
                .andExpect(jsonPath("$[0].qtyChange").value(20.001));
    }

    @Test
    void metadataAndEqualQuantityDoNotCreateHistory() throws Exception {
        long id = createLot(1, "두부", "100", "g", LocalDate.of(2027, 1, 1));
        update(1, id, """
                {"action":"ADJUST","storageLocation":"PANTRY","memo":"보관 변경"}
                """).andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(100));
        update(1, id, """
                {"action":"ADJUST","quantity":100.000,"clearExpiryDate":true,"memo":""}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$.expirationStatus").value("UNKNOWN"))
                .andExpect(jsonPath("$.memo").value(""));
        assertThat(lotRepository.findById(id).orElseThrow().getExpiryDate()).isNull();
        assertThat(transactionRepository.count()).isEqualTo(1);
    }

    @Test
    void partialThenFullDisposalPreservesLotAndHistory() throws Exception {
        long id = createLot(1, "두부", "100", "g", null);
        update(1, id, """
                {"action":"DISPOSE","quantity":30,"memo":"일부 폐기"}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(70))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        update(1, id, """
                {"action":"DISPOSE","quantity":70}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(0))
                .andExpect(jsonPath("$.status").value("DISPOSED"));
        assertThat(lotRepository.existsById(id)).isTrue();
        mockMvc.perform(get(TRANSACTIONS).param("lotId", String.valueOf(id)))
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].type").value("DISPOSE"))
                .andExpect(jsonPath("$[0].qtyChange").value(-70))
                .andExpect(jsonPath("$[1].qtyChange").value(-30));
        mockMvc.perform(get(LOTS))
                .andExpect(jsonPath("$.groups[0].totalQuantity").value(0))
                .andExpect(jsonPath("$.groups[0].lots[0].status").value("DISPOSED"));
    }

    @Test
    void zeroAdjustmentDepletesAndNewPurchaseCreatesNewLot() throws Exception {
        long id = createLot(1, "두부", "100", "g", null);
        update(1, id, """
                {"action":"ADJUST","quantity":0}
                """).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DEPLETED"));
        long nextId = createLot(1, "두부", "50", "g", null);
        assertThat(nextId).isNotEqualTo(id);
        mockMvc.perform(get(LOTS))
                .andExpect(jsonPath("$.groups[0].lots.length()").value(2))
                .andExpect(jsonPath("$.groups[0].totalQuantity").value(50));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADJUST", "DISPOSE"})
    void inactiveLotsRejectQuantityAndMetadataUpdates(String action) throws Exception {
        for (String initialAction : new String[]{"ADJUST", "DISPOSE"}) {
            long id = createLot(1, "두부", "10", "g", null);
            update(1, id, "{\"action\":\"" + initialAction + "\",\"quantity\":"
                    + (initialAction.equals("ADJUST") ? "0" : "10") + "}").andExpect(status().isOk());
            update(1, id, "{\"action\":\"" + action + "\",\"quantity\":1}")
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("INVENTORY_003"));
            update(1, id, """
                    {"action":"ADJUST","storageLocation":"FREEZER"}
                    """).andExpect(status().isConflict());
            assertThat(transactionRepository.findByLotIdOrderByCreatedAtDesc(id)).hasSize(2);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{\"action\":\"DISPOSE\",\"quantity\":101}",
            "{\"action\":\"DISPOSE\",\"quantity\":0}",
            "{\"action\":\"DISPOSE\"}",
            "{\"action\":\"DISPOSE\",\"quantity\":-1}",
            "{\"action\":\"ADJUST\",\"quantity\":-1}",
            "{\"action\":\"ADJUST\",\"quantity\":0.0001}",
            "{\"action\":\"ADJUST\",\"quantity\":1000000000}",
            "{\"action\":\"ADJUST\",\"minStockQty\":-1}",
            "{\"action\":\"ADJUST\",\"minStockQty\":0.0001}",
            "{\"action\":\"ADJUST\",\"minStockQty\":1000000000}",
            "{\"action\":\"ADJUST\",\"storageLocation\":\"INVALID\"}",
            "{\"action\":\"UNKNOWN\"}",
            "{}",
            "{\"action\":\"ADJUST\",\"expiryDate\":\"2027-01-01\",\"clearExpiryDate\":true}",
            "{\"action\":\"DISPOSE\",\"quantity\":1,\"storageLocation\":\"FREEZER\"}"
    })
    void invalidUpdatesDoNotChangeLotOrHistory(String body) throws Exception {
        long id = createLot(1, "두부", "100", "g", null);
        update(1, id, body).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").exists()).andExpect(jsonPath("$.message").exists());
        assertThat(lotRepository.findById(id).orElseThrow().getQuantity()).isEqualByComparingTo("100");
        assertThat(transactionRepository.count()).isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1", "0.0001", "1000000000", "null"})
    void invalidStockQuantityDoesNotCreateLot(String quantity) throws Exception {
        mockMvc.perform(post(LOTS).contentType(MediaType.APPLICATION_JSON).content(
                "{\"ingredientName\":\"두부\",\"quantity\":" + quantity
                        + ",\"unit\":\"g\",\"storageLocation\":\"FRIDGE\"}"))
                .andExpect(status().isBadRequest());
        assertThat(lotRepository.count()).isZero();
        assertThat(transactionRepository.count()).isZero();
    }

    @Test
    void validatesRequiredFieldsAndMemoLength() throws Exception {
        mockMvc.perform(post(LOTS).contentType(MediaType.APPLICATION_JSON).content("""
                {"ingredientName":" ","quantity":1,"unit":"","minStockQty":-1}
                """)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
        long id = createLot(1, "두부", "1", "g", null);
        update(1, id, objectMapper.writeValueAsString(
                Map.of("action", "ADJUST", "memo", "가".repeat(256))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void acceptsMaximumDatabasePrecisionAndTrimsNameAndUnit() throws Exception {
        createLot(1, " 두부 ", "999999999.999", " g ", null);
        InventoryLot lot = lotRepository.findAll().getFirst();
        assertThat(lot.getIngredientName()).isEqualTo("두부");
        assertThat(lot.getUnit()).isEqualTo("g");
        assertThat(lot.getQuantity()).isEqualByComparingTo("999999999.999");
    }

    @Test
    void otherUsersCannotReadHistoryOrModifyLot() throws Exception {
        long mine = createLot(1, "두부", "10", "g", null);
        long other = createLot(2, "달걀", "2", "개", null);
        update(1, other, """
                {"action":"ADJUST","quantity":0}
                """).andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("INVENTORY_001"));
        mockMvc.perform(get(TRANSACTIONS).param("lotId", String.valueOf(other)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get(TRANSACTIONS)).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].lotId").value(mine));
        mockMvc.perform(get(LOTS).header("X-User-Id", "2"))
                .andExpect(jsonPath("$.groups.length()").value(1))
                .andExpect(jsonPath("$.groups[0].ingredientName").value("달걀"));
    }

    @Test
    void missingLotReturnsNotFound() throws Exception {
        update(1, Long.MAX_VALUE, """
                {"action":"ADJUST","quantity":1}
                """).andExpect(status().isNotFound());
        mockMvc.perform(get(TRANSACTIONS).param("lotId", String.valueOf(Long.MAX_VALUE)))
                .andExpect(status().isNotFound());
    }

    @Test
    void transactionFilterExcludesOtherLots() throws Exception {
        long first = createLot(1, "두부", "10", "g", null);
        createLot(1, "달걀", "2", "개", null);
        mockMvc.perform(get(TRANSACTIONS).param("lotId", String.valueOf(first)))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].lotId").value(first));
    }

    @Test
    void allExpirationStatesAreCalculated() throws Exception {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        LocalDate[] dates = {null, today.minusDays(1), today, today.plusDays(3), today.plusDays(4)};
        String[] statuses = {"UNKNOWN", "EXPIRED", "TODAY", "IMMINENT", "NORMAL"};
        for (int index = 0; index < dates.length; index++) {
            long id = createLot(1, "두부", "1", "g", dates[index]);
            String expected = statuses[index];
            JsonNode response = read(mockMvc.perform(get(LOTS)));
            boolean found = false;
            for (JsonNode lot : response.path("groups").get(0).path("lots")) {
                if (lot.path("id").asLong() == id) {
                    assertThat(lot.path("expirationStatus").asText()).isEqualTo(expected);
                    found = true;
                }
            }
            assertThat(found).isTrue();
        }
    }

    @Test
    void stockInRollsBackWhenHistorySaveFails() throws Exception {
        doThrow(new IllegalStateException("이력 저장 실패")).when(transactionRepository)
                .save(any(InventoryTransaction.class));
        mockMvc.perform(post(LOTS).contentType(MediaType.APPLICATION_JSON).content("""
                {"ingredientName":"두부","quantity":100,"unit":"g","storageLocation":"FRIDGE"}
                """)).andExpect(status().isInternalServerError());
        assertThat(lotRepository.count()).isZero();
        assertThat(transactionRepository.count()).isZero();
    }

    @Test
    void quantityAndStatusRollBackWhenHistorySaveFails() throws Exception {
        long id = createLot(1, "두부", "100", "g", null);
        doThrow(new IllegalStateException("이력 저장 실패")).when(transactionRepository)
                .save(any(InventoryTransaction.class));
        update(1, id, """
                {"action":"DISPOSE","quantity":100}
                """).andExpect(status().isInternalServerError());
        InventoryLot lot = lotRepository.findById(id).orElseThrow();
        assertThat(lot.getQuantity()).isEqualByComparingTo("100");
        assertThat(lot.getStatus()).isEqualTo(LotStatus.ACTIVE);
        assertThat(transactionRepository.count()).isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{\"action\":\"ADJUST\"}",
            "{\"action\":\"ADJUST\",\"quantity\":null,\"storageLocation\":null,\"expiryDate\":null,"
                    + "\"clearExpiryDate\":null,\"minStockQty\":null,\"memo\":null}",
            "{\"action\":\"ADJUST\",\"clearExpiryDate\":false}"
    })
    void emptyAdjustRejectsWithoutChangingLotOrHistory(String body) throws Exception {
        long id = createLot(1, "두부", "100", "g", LocalDate.of(2027, 1, 1));
        JsonNode inventoryBefore = read(mockMvc.perform(get(LOTS)).andExpect(status().isOk()));
        JsonNode historyBefore = read(mockMvc.perform(get(TRANSACTIONS)).andExpect(status().isOk()));

        update(1, id, body).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("INVENTORY_004"))
                .andExpect(jsonPath("$.message").value("수정할 항목을 하나 이상 입력해 주세요."));

        assertThat(read(mockMvc.perform(get(LOTS)).andExpect(status().isOk())))
                .isEqualTo(inventoryBefore);
        assertThat(read(mockMvc.perform(get(TRANSACTIONS)).andExpect(status().isOk())))
                .isEqualTo(historyBefore);
        assertThat(lotRepository.count()).isEqualTo(1);
        assertThat(transactionRepository.count()).isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{\"action\":\"ADJUST\",\"storageLocation\":\"FREEZER\"}",
            "{\"action\":\"ADJUST\",\"expiryDate\":\"2027-02-01\"}",
            "{\"action\":\"ADJUST\",\"clearExpiryDate\":true}",
            "{\"action\":\"ADJUST\",\"memo\":\"\"}",
            "{\"action\":\"ADJUST\",\"minStockQty\":0}",
            "{\"action\":\"ADJUST\",\"quantity\":100}"
    })
    void singleAdjustFieldRemainsAllowedWithoutQuantityHistory(String body) throws Exception {
        long id = createLot(1, "두부", "100", "g", LocalDate.of(2027, 1, 1));
        update(1, id, """
                {"action":"ADJUST","minStockQty":10,"memo":"기존 메모"}
                """).andExpect(status().isOk());

        update(1, id, body).andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(100))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        InventoryLot lot = lotRepository.findById(id).orElseThrow();
        JsonNode request = objectMapper.readTree(body);
        assertThat(lot.getStorageLocation()).isEqualTo(request.has("storageLocation")
                ? StorageLocation.FREEZER : StorageLocation.FRIDGE);
        assertThat(lot.getExpiryDate()).isEqualTo(request.has("clearExpiryDate") ? null
                : request.has("expiryDate") ? LocalDate.of(2027, 2, 1) : LocalDate.of(2027, 1, 1));
        assertThat(lot.getMinStockQty()).isEqualByComparingTo(request.has("minStockQty") ? "0" : "10");
        assertThat(lot.getMemo()).isEqualTo(request.has("memo") ? "" : "기존 메모");
        assertThat(transactionRepository.count()).isEqualTo(1);
    }


    @ParameterizedTest
    @ValueSource(strings = {"0.0001", "1000000000", "-0.001"})
    void invalidDisposalPrecisionAndRangePreserveInventory(String quantity) throws Exception {
        long id = createLot(1, "경계값", "100", "g", null);
        JsonNode before = read(mockMvc.perform(get(LOTS)));
        update(1, id, "{\"action\":\"DISPOSE\",\"quantity\":" + quantity + "}")
                .andExpect(status().isBadRequest());
        assertThat(read(mockMvc.perform(get(LOTS)))).isEqualTo(before);
        assertThat(transactionRepository.count()).isEqualTo(1);
    }

    @Test
    void unchangedAdjustmentDoesNotChangeInventoryOrHistory() throws Exception {
        long id = createLot(1, "경계값", "100", "g", null);
        JsonNode before = read(mockMvc.perform(get(LOTS)));
        update(1, id, """
                {"action":"ADJUST","quantity":100,"storageLocation":"FRIDGE","minStockQty":0}
                """).andExpect(status().isOk());
        assertThat(read(mockMvc.perform(get(LOTS)))).isEqualTo(before);
        assertThat(transactionRepository.count()).isEqualTo(1);
    }

    @Test
    void smallestQuantitySurvivesAdjustmentAndFullDisposal() throws Exception {
        long id = createLot(1, "경계값", "0.001", "g", null);
        update(1, id, """
                {"action":"ADJUST","quantity":0.003}
                """).andExpect(status().isOk());
        update(1, id, """
                {"action":"DISPOSE","quantity":0.002}
                """).andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(0.001));
        update(1, id, """
                {"action":"DISPOSE","quantity":0.001}
                """).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DISPOSED"));
        assertHistoryBalance(id, "0");
    }

    @Test
    void disposalCannotAccessForeignOrMissingLots() throws Exception {
        long other = createLot(2, "다른 사용자", "100", "g", null);
        for (long id : new long[]{other, Long.MAX_VALUE}) {
            update(1, id, """
                    {"action":"DISPOSE","quantity":1}
                    """).andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("INVENTORY_001"));
        }
        assertThat(lotRepository.findById(other).orElseThrow().getQuantity()).isEqualByComparingTo("100");
        assertThat(transactionRepository.count()).isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADJUST", "DISPOSE"})
    void flushedLotAndHistoryRollBackTogether(String action) throws Exception {
        long id = createLot(1, "롤백 검증", "100", "g", LocalDate.of(2027, 1, 1));
        JsonNode before = read(mockMvc.perform(get(LOTS)));
        JsonNode history = read(mockMvc.perform(get(TRANSACTIONS)));
        // SQL 반영 이후 실패해도 재고와 이력을 함께 되돌린다.
        doAnswer(invocation -> {
            entityManager.persist(invocation.getArgument(0, InventoryTransaction.class));
            entityManager.flush();
            throw new IllegalStateException("SQL 반영 후 실패");
        }).when(transactionRepository).save(any(InventoryTransaction.class));
        String body = action.equals("ADJUST")
                ? """
                  {"action":"ADJUST","quantity":0,"storageLocation":"FREEZER",
                   "clearExpiryDate":true,"minStockQty":0,"memo":"실패할 수정"}
                  """
                : """
                  {"action":"DISPOSE","quantity":100,"memo":"실패할 폐기"}
                  """;
        update(1, id, body).andExpect(status().isInternalServerError());
        assertThat(read(mockMvc.perform(get(LOTS)))).isEqualTo(before);
        assertThat(read(mockMvc.perform(get(TRANSACTIONS)))).isEqualTo(history);
    }

    @Test
    void concurrentExcessDisposalOnlyAllowsOneRequest() throws Exception {
        long id = createLot(1, "동시 폐기", "100", "g", null);
        List<Boolean> results = concurrentUpdates(id, InventoryAction.DISPOSE, "60", "60");
        assertThat(results).containsExactlyInAnyOrder(true, false);
        assertThat(lotRepository.findById(id).orElseThrow().getQuantity()).isEqualByComparingTo("40");
        assertThat(transactionRepository.count()).isEqualTo(2);
        assertHistoryBalance(id, "40");
    }

    @Test
    void concurrentPartialDisposalsBecomeFullDisposal() throws Exception {
        long id = createLot(1, "동시 폐기", "100", "g", null);
        assertThat(concurrentUpdates(id, InventoryAction.DISPOSE, "50", "50"))
                .containsExactly(true, true);
        assertThat(lotRepository.findById(id).orElseThrow().getStatus()).isEqualTo(LotStatus.DISPOSED);
        assertThat(transactionRepository.count()).isEqualTo(3);
        assertHistoryBalance(id, "0");
    }

    @Test
    void concurrentAbsoluteAdjustmentsKeepHistoryConsistent() throws Exception {
        long id = createLot(1, "동시 수정", "100", "g", null);
        assertThat(concurrentUpdates(id, InventoryAction.ADJUST, "80", "60"))
                .containsExactly(true, true);
        BigDecimal quantity = lotRepository.findById(id).orElseThrow().getQuantity();
        assertThat(quantity).isIn(new BigDecimal("80.000"), new BigDecimal("60.000"));
        assertThat(transactionRepository.count()).isEqualTo(3);
        assertHistoryBalance(id, quantity.toPlainString());
    }

    private List<Boolean> concurrentUpdates(long id, InventoryAction action, String first, String second)
            throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Callable<Boolean> left = concurrentUpdate(id, action, first, ready, start);
            Callable<Boolean> right = concurrentUpdate(id, action, second, ready, start);
            var leftResult = executor.submit(left);
            var rightResult = executor.submit(right);
            try {
                assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            } finally {
                start.countDown();
            }
            return List.of(leftResult.get(10, TimeUnit.SECONDS), rightResult.get(10, TimeUnit.SECONDS));
        }
    }

    private Callable<Boolean> concurrentUpdate(long id, InventoryAction action, String quantity,
                                               CountDownLatch ready, CountDownLatch start) {
        return () -> {
            ready.countDown();
            if (!start.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("동시 요청 대기 초과");
            try {
                inventoryService.update(1L, id, new UpdateLotRequest(action, new BigDecimal(quantity),
                        null, null, null, null, null));
                return true;
            } catch (BusinessException exception) {
                assertThat(exception.getMessage()).contains("현재 재고보다");
                return false;
            }
        };
    }

    private void assertHistoryBalance(long id, String expected) {
        BigDecimal balance = transactionRepository.findByLotIdOrderByCreatedAtDesc(id).stream()
                .map(InventoryTransaction::getQtyChange).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(balance).isEqualByComparingTo(expected);
        assertThat(lotRepository.findById(id).orElseThrow().getQuantity()).isEqualByComparingTo(expected);
    }

    private long createLot(long userId, String name, String quantity, String unit, LocalDate expiry) throws Exception {
        String body = objectMapper.writeValueAsString(new StockBody(name, new BigDecimal(quantity), unit,
                expiry, "FRIDGE"));
        return read(mockMvc.perform(post(LOTS).header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())).path("id").asLong();
    }

    private ResultActions update(long userId, long id, String body) throws Exception {
        return mockMvc.perform(patch(LOTS + "/" + id).header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private JsonNode read(ResultActions result) throws Exception {
        return objectMapper.readTree(result.andReturn().getResponse().getContentAsString());
    }

    private record StockBody(String ingredientName, BigDecimal quantity, String unit,
                             LocalDate expiryDate, String storageLocation) {
    }
}

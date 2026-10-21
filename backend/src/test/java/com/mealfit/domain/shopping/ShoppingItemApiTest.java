package com.mealfit.domain.shopping;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.inventory.InventoryLotRepository;
import com.mealfit.domain.inventory.InventoryTransaction;
import com.mealfit.domain.inventory.InventoryTransactionRepository;
import com.mealfit.domain.inventory.InventoryTransactionType;
import com.mealfit.domain.inventory.LotStatus;
import com.mealfit.domain.inventory.StorageLocation;
import com.mealfit.domain.mealplan.MealPlan;
import com.mealfit.domain.mealplan.MealPlanRepository;
import com.mealfit.domain.mealplan.MealType;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeRepository;
import com.mealfit.domain.recipe.RecipeSource;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

/** 장보기 목록 조회, 부분 구매, 구매분 입고 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ShoppingItemApiTest {

    private static final Long USER = 1L;
    private static final LocalDate DATE = LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(1);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private ShoppingItemRepository shoppingItemRepository;

    @Autowired
    private InventoryLotRepository inventoryLotRepository;

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    @Autowired
    private EntityManager entityManager;

    @BeforeEach
    void setUp() {
        // 확정 식단: 달걀 4개, 우유 0.5L → 장보기 달걀 4개, 우유 500ml
        Recipe recipe = Recipe.builder()
                .name("테스트 달걀찜과 우유")
                .servingSize(1)
                .cookTimeMin(10)
                .nutritionEstimated(true)
                .source(RecipeSource.SEED)
                .steps(List.of("조리한다."))
                .build();
        recipe.addIngredient("달걀", new BigDecimal("4"), "개");
        recipe.addIngredient("우유", new BigDecimal("0.5"), "L");
        recipeRepository.save(recipe);
        MealPlan plan = MealPlan.builder()
                .userId(USER)
                .planDate(DATE)
                .mealType(MealType.BREAKFAST)
                .recipe(recipe)
                .servings(1)
                .build();
        plan.confirm();
        mealPlanRepository.save(plan);
    }

    private Long itemId(String name) throws Exception {
        mockMvc.perform(get("/api/v1/shopping-items")).andExpect(status().isOk());
        return shoppingItemRepository.findByUserIdOrderByIdAsc(USER).stream()
                .filter(item -> item.getIngredientName().equals(name))
                .findFirst().orElseThrow()
                .getId();
    }

    private ResultActions purchase(Long id, String qty) throws Exception {
        return mockMvc.perform(patch("/api/v1/shopping-items")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"items\":[{\"id\":" + id + ",\"purchasedQty\":" + qty + "}]}"));
    }

    private ResultActions stockIn(String itemsJson) throws Exception {
        return mockMvc.perform(post("/api/v1/shopping-items/stock-in")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"items\":[" + itemsJson + "]}"));
    }

    private ShoppingItem reload(Long id) {
        entityManager.flush();
        entityManager.clear();
        return shoppingItemRepository.findById(id).orElse(null);
    }

    private List<InventoryLot> lotsOf(String name) {
        entityManager.flush();
        entityManager.clear();
        return inventoryLotRepository.findByUserIdOrderByExpiryDateAscIdAsc(USER).stream()
                .filter(lot -> lot.getIngredientName().equals(name))
                .toList();
    }

    @Test
    void 확정_식단의_부족분을_조회한다() throws Exception {
        mockMvc.perform(get("/api/v1/shopping-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].ingredientName").value("달걀"))
                .andExpect(jsonPath("$[0].requiredQty").value(4.0))
                .andExpect(jsonPath("$[0].remainingQty").value(4.0))
                .andExpect(jsonPath("$[0].unit").value("개"))
                .andExpect(jsonPath("$[0].status").value("NEEDED"))
                .andExpect(jsonPath("$[1].ingredientName").value("우유"))
                .andExpect(jsonPath("$[1].requiredQty").value(500.0))
                .andExpect(jsonPath("$[1].unit").value("ml"));
    }

    @Test
    void 냉장고_재고가_바뀌면_조회할_때_다시_계산한다() throws Exception {
        itemId("달걀");
        inventoryLotRepository.save(InventoryLot.builder()
                .userId(USER).ingredientName("달걀").quantity(new BigDecimal("4")).unit("개")
                .storageLocation(StorageLocation.FRIDGE).build());

        mockMvc.perform(get("/api/v1/shopping-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].ingredientName").value("우유"));
    }

    @Test
    void 구매_수량에_따라_상태가_바뀐다() throws Exception {
        Long id = itemId("달걀");

        purchase(id, "2").andExpect(status().isOk());
        assertThat(reload(id).getStatus()).isEqualTo(ShoppingItemStatus.PARTIAL);

        purchase(id, "4").andExpect(status().isOk());
        assertThat(reload(id).getStatus()).isEqualTo(ShoppingItemStatus.PURCHASED);

        purchase(id, "6").andExpect(status().isOk());
        assertThat(reload(id).getStatus()).isEqualTo(ShoppingItemStatus.PURCHASED);

        purchase(id, "0")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("NEEDED"))
                .andExpect(jsonPath("$[0].remainingQty").value(4.0));
    }

    @Test
    void 잘못된_구매_요청은_거부한다() throws Exception {
        Long id = itemId("달걀");

        purchase(id, "-1")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
        mockMvc.perform(patch("/api/v1/shopping-items").header("X-User-Id", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"id\":" + id + ",\"purchasedQty\":1}]}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SHOPPING_001"));
        mockMvc.perform(patch("/api/v1/shopping-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"id\":" + id + ",\"purchasedQty\":1},{\"id\":" + id
                                + ",\"purchasedQty\":2}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SHOPPING_004"));
    }

    @Test
    void 부분_구매분만_입고하고_이력을_남긴다() throws Exception {
        // QA-11: 필요 4개 중 2개 구매 → 입고하면 재고 +2, STOCK_IN 이력, 남은 필요량 2개
        Long id = itemId("달걀");
        purchase(id, "2").andExpect(status().isOk());

        stockIn("{\"id\":" + id + ",\"storageLocation\":\"FRIDGE\",\"expiryDate\":\"" + DATE.plusDays(10) + "\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lots.length()").value(1))
                .andExpect(jsonPath("$.lots[0].ingredientName").value("달걀"))
                .andExpect(jsonPath("$.lots[0].quantity").value(2))
                .andExpect(jsonPath("$.lots[0].unit").value("개"))
                .andExpect(jsonPath("$.lots[0].storageLocation").value("FRIDGE"))
                .andExpect(jsonPath("$.shoppingItems[0].ingredientName").value("달걀"))
                .andExpect(jsonPath("$.shoppingItems[0].requiredQty").value(2.0))
                .andExpect(jsonPath("$.shoppingItems[0].purchasedQty").value(0.0))
                .andExpect(jsonPath("$.shoppingItems[0].status").value("NEEDED"));

        List<InventoryLot> lots = lotsOf("달걀");
        assertThat(lots).hasSize(1);
        assertThat(lots.get(0).getQuantity()).isEqualByComparingTo("2");
        assertThat(lots.get(0).getStatus()).isEqualTo(LotStatus.ACTIVE);
        List<InventoryTransaction> transactions = transactionRepository.findByLotIdOrderByCreatedAtDesc(
                lots.get(0).getId());
        assertThat(transactions).hasSize(1);
        assertThat(transactions.get(0).getType()).isEqualTo(InventoryTransactionType.STOCK_IN);
        assertThat(transactions.get(0).getQtyChange()).isEqualByComparingTo("2");
    }

    @Test
    void 같은_입고를_다시_보내면_중복_입고되지_않는다() throws Exception {
        Long id = itemId("달걀");
        purchase(id, "2").andExpect(status().isOk());
        String body = "{\"id\":" + id + ",\"storageLocation\":\"FRIDGE\"}";

        stockIn(body).andExpect(status().isCreated());
        stockIn(body)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SHOPPING_003"));

        assertThat(lotsOf("달걀")).hasSize(1);
    }

    @Test
    void 산_수량보다_많이_입고할_수_없다() throws Exception {
        Long id = itemId("달걀");
        purchase(id, "1").andExpect(status().isOk());

        stockIn("{\"id\":" + id + ",\"quantity\":2,\"storageLocation\":\"FRIDGE\"}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SHOPPING_003"));

        assertThat(lotsOf("달걀")).isEmpty();
        assertThat(reload(id).getPurchasedQty()).isEqualByComparingTo("1");
    }

    @Test
    void 일부만_입고하면_나머지는_구매량으로_남는다() throws Exception {
        Long id = itemId("달걀");
        purchase(id, "3").andExpect(status().isOk());

        stockIn("{\"id\":" + id + ",\"quantity\":1,\"storageLocation\":\"FRIDGE\"}")
                .andExpect(status().isCreated());

        ShoppingItem item = reload(id);
        assertThat(item.getPurchasedQty()).isEqualByComparingTo("2");
        assertThat(item.getRequiredQty()).isEqualByComparingTo("3");
        assertThat(item.getStatus()).isEqualTo(ShoppingItemStatus.PARTIAL);
    }

    @Test
    void 필요량을_모두_사서_입고하면_목록에서_빠진다() throws Exception {
        Long id = itemId("우유");
        purchase(id, "500").andExpect(status().isOk());

        stockIn("{\"id\":" + id + ",\"storageLocation\":\"FRIDGE\",\"minStockQty\":0}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shoppingItems.length()").value(1))
                .andExpect(jsonPath("$.shoppingItems[0].ingredientName").value("달걀"));

        assertThat(reload(id)).isNull();
        assertThat(lotsOf("우유").get(0).getUnit()).isEqualTo("ml");
    }

    @Test
    void 구매하지_않은_항목은_입고할_수_없다() throws Exception {
        Long id = itemId("달걀");

        stockIn("{\"id\":" + id + ",\"storageLocation\":\"FRIDGE\"}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SHOPPING_003"));
    }

    @Test
    void 보관_위치가_없으면_400() throws Exception {
        Long id = itemId("달걀");

        stockIn("{\"id\":" + id + "}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
    }
}

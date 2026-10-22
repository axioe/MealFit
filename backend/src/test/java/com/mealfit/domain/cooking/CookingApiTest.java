package com.mealfit.domain.cooking;

import com.mealfit.support.TestJwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.inventory.InventoryLotRepository;
import com.mealfit.domain.inventory.InventoryTransaction;
import com.mealfit.domain.inventory.InventoryTransactionRepository;
import com.mealfit.domain.inventory.InventoryTransactionType;
import com.mealfit.domain.inventory.LotStatus;
import com.mealfit.domain.inventory.StorageLocation;
import com.mealfit.domain.mealplan.MealPlan;
import com.mealfit.domain.mealplan.MealPlanRepository;
import com.mealfit.domain.mealplan.MealPlanStatus;
import com.mealfit.domain.mealplan.MealType;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeRepository;
import com.mealfit.domain.recipe.RecipeSource;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

/** 조리 미리보기·완료(차감)·취소(원본 복원) */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CookingApiTest {

    private static final Long USER = 1L;
    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("Asia/Seoul"));

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private InventoryLotRepository lotRepository;

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    @Autowired
    private CookingEventRepository cookingEventRepository;

    @Autowired
    private EntityManager entityManager;

    /** ingredients: 재료명, 수량, 단위 순서로 반복. 기준 1인분 레시피의 확정 식단을 만든다. */
    private MealPlan confirmedPlan(int servings, String... ingredients) {
        MealPlan plan = draftPlan(servings, ingredients);
        plan.confirm();
        return plan;
    }

    private MealPlan draftPlan(int servings, String... ingredients) {
        Recipe recipe = Recipe.builder()
                .name("테스트 볶음")
                .servingSize(1)
                .cookTimeMin(10)
                .nutritionEstimated(true)
                .source(RecipeSource.SEED)
                .steps(List.of("볶는다."))
                .build();
        for (int i = 0; i < ingredients.length; i += 3) {
            recipe.addIngredient(ingredients[i], new BigDecimal(ingredients[i + 1]), ingredients[i + 2]);
        }
        recipeRepository.save(recipe);
        return mealPlanRepository.save(MealPlan.builder()
                .userId(USER)
                .planDate(TODAY)
                .mealType(MealType.DINNER)
                .recipe(recipe)
                .servings(servings)
                .build());
    }

    private InventoryLot lot(String name, String qty, String unit, LocalDate expiryDate) {
        return lotRepository.save(InventoryLot.builder()
                .userId(USER)
                .ingredientName(name)
                .quantity(new BigDecimal(qty))
                .unit(unit)
                .expiryDate(expiryDate)
                .storageLocation(StorageLocation.FRIDGE)
                .build());
    }

    private ResultActions preview(MealPlan plan) throws Exception {
        return mockMvc.perform(get("/api/v1/cooking/preview").with(TestJwt.user(1L)).param("mealPlanId", plan.getId().toString()));
    }

    private ResultActions cook(MealPlan plan) throws Exception {
        return mockMvc.perform(post("/api/v1/cooking-events").with(TestJwt.user(1L))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"mealPlanId\":" + plan.getId() + "}"));
    }

    private long cookOk(MealPlan plan) throws Exception {
        String body = cook(plan).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    private ResultActions cancel(long eventId) throws Exception {
        return mockMvc.perform(post("/api/v1/cooking-events/{id}/cancel", eventId).with(TestJwt.user(1L)));
    }

    private InventoryLot reload(InventoryLot lot) {
        entityManager.flush();
        entityManager.clear();
        return lotRepository.findById(lot.getId()).orElseThrow();
    }

    @Test
    void 미리보기는_재고와_이력을_바꾸지_않는다() throws Exception {
        // QA-12: 재고 500g, 필요 200g → 미리보기 후에도 500g
        MealPlan plan = confirmedPlan(1, "돼지고기", "200", "g");
        InventoryLot pork = lot("돼지고기", "500", "g", TODAY.plusDays(3));

        preview(plan)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canCook").value(true))
                .andExpect(jsonPath("$.ingredients[0].requiredQty").value(200.0))
                .andExpect(jsonPath("$.ingredients[0].availableQty").value(500.0))
                .andExpect(jsonPath("$.ingredients[0].shortageQty").value(0))
                .andExpect(jsonPath("$.ingredients[0].deductions[0].lotId").value(pork.getId()))
                .andExpect(jsonPath("$.ingredients[0].deductions[0].quantity").value(200.0));

        assertThat(reload(pork).getQuantity()).isEqualByComparingTo("500");
        assertThat(transactionRepository.findByLotIdOrderByCreatedAtDesc(pork.getId())).isEmpty();
    }

    @Test
    void 조리_완료하면_재고를_차감하고_이력을_남긴다() throws Exception {
        // QA-12: 500g - 200g = 300g, COOK_DEDUCT -200
        MealPlan plan = confirmedPlan(1, "돼지고기", "200", "g");
        InventoryLot pork = lot("돼지고기", "500", "g", TODAY.plusDays(3));

        cook(plan)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("COOKED"))
                .andExpect(jsonPath("$.mealPlanId").value(plan.getId()))
                .andExpect(jsonPath("$.changes[0].type").value("COOK_DEDUCT"))
                .andExpect(jsonPath("$.changes[0].qtyChange").value(-200.0));

        assertThat(reload(pork).getQuantity()).isEqualByComparingTo("300");
        List<InventoryTransaction> transactions = transactionRepository.findByLotIdOrderByCreatedAtDesc(pork.getId());
        assertThat(transactions).hasSize(1);
        assertThat(transactions.get(0).getType()).isEqualTo(InventoryTransactionType.COOK_DEDUCT);
        assertThat(transactions.get(0).getCookingEvent()).isNotNull();
        mockMvc.perform(get("/api/v1/meal-plans").with(TestJwt.user(1L)).param("date", TODAY.toString()))
                .andExpect(jsonPath("$.mealPlans[0].cooked").value(true));
    }

    @Test
    void 기한이_빠른_묶음부터_차감하고_기한_미등록은_마지막에_쓴다() throws Exception {
        // D11: 오늘 만료 100g → 3일 뒤 100g → 기한 미등록 100g, 기한 경과 묶음은 쓰지 않음
        MealPlan plan = confirmedPlan(1, "양파", "250", "g");
        InventoryLot unknown = lot("양파", "100", "g", null);
        InventoryLot later = lot("양파", "100", "g", TODAY.plusDays(3));
        InventoryLot today = lot("양파", "100", "g", TODAY);
        InventoryLot expired = lot("양파", "100", "g", TODAY.minusDays(1));

        preview(plan)
                .andExpect(jsonPath("$.ingredients[0].availableQty").value(300.0))
                .andExpect(jsonPath("$.ingredients[0].deductions.length()").value(3))
                .andExpect(jsonPath("$.ingredients[0].deductions[0].lotId").value(today.getId()))
                .andExpect(jsonPath("$.ingredients[0].deductions[0].expirationStatus").value("TODAY"))
                .andExpect(jsonPath("$.ingredients[0].deductions[1].lotId").value(later.getId()))
                .andExpect(jsonPath("$.ingredients[0].deductions[2].lotId").value(unknown.getId()))
                .andExpect(jsonPath("$.ingredients[0].deductions[2].quantity").value(50.0));
        cook(plan).andExpect(status().isCreated());

        assertThat(reload(today).getStatus()).isEqualTo(LotStatus.DEPLETED);
        assertThat(reload(later).getStatus()).isEqualTo(LotStatus.DEPLETED);
        assertThat(reload(unknown).getQuantity()).isEqualByComparingTo("50");
        assertThat(reload(expired).getQuantity()).isEqualByComparingTo("100");
    }

    @Test
    void 인분과_단위를_환산해_차감한다() throws Exception {
        // 1인분 300g × 2인분 = 600g, 재고 1kg 묶음 → 0.4kg 남음
        MealPlan plan = confirmedPlan(2, "닭고기", "300", "g");
        InventoryLot chicken = lot("닭고기", "1", "kg", TODAY.plusDays(2));

        cook(plan).andExpect(status().isCreated());

        assertThat(reload(chicken).getQuantity()).isEqualByComparingTo("0.4");
        assertThat(reload(chicken).getUnit()).isEqualTo("kg");
    }

    @Test
    void 재고가_부족하면_아무것도_차감하지_않고_거부한다() throws Exception {
        MealPlan plan = confirmedPlan(1, "달걀", "3", "개", "우유", "200", "ml");
        InventoryLot egg = lot("달걀", "2", "개", TODAY.plusDays(5));
        InventoryLot milk = lot("우유", "1", "L", TODAY.plusDays(5));

        preview(plan)
                .andExpect(jsonPath("$.canCook").value(false))
                .andExpect(jsonPath("$.blockedReason").value(org.hamcrest.Matchers.containsString("달걀 1개")))
                .andExpect(jsonPath("$.ingredients[0].shortageQty").value(1.0));
        cook(plan)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COOKING_004"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("달걀 1개")));

        assertThat(reload(egg).getQuantity()).isEqualByComparingTo("2");
        assertThat(reload(milk).getQuantity()).isEqualByComparingTo("1");
        assertThat(cookingEventRepository.existsByMealPlanIdAndStatus(plan.getId(), CookingStatus.COOKED)).isFalse();
    }

    @Test
    void 확정하지_않은_식단은_조리할_수_없다() throws Exception {
        MealPlan plan = draftPlan(1, "달걀", "1", "개");
        lot("달걀", "5", "개", null);

        preview(plan)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canCook").value(false))
                .andExpect(jsonPath("$.blockedReason").value("확정된 식단만 조리할 수 있습니다."));
        cook(plan)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COOKING_002"));
    }

    @Test
    void 같은_식단을_두_번_조리할_수_없다() throws Exception {
        MealPlan plan = confirmedPlan(1, "달걀", "1", "개");
        InventoryLot egg = lot("달걀", "5", "개", null);

        cookOk(plan);
        cook(plan)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COOKING_003"));

        assertThat(reload(egg).getQuantity()).isEqualByComparingTo("4");
    }

    @Test
    void 취소하면_조리_당시_차감한_묶음에_원래대로_복원한다() throws Exception {
        // QA-13: 묶음 A 150g + B 50g 차감 → 취소하면 A에 150g, B에 50g
        MealPlan plan = confirmedPlan(1, "감자", "200", "g");
        InventoryLot a = lot("감자", "150", "g", TODAY.plusDays(1));
        InventoryLot b = lot("감자", "100", "g", TODAY.plusDays(5));
        long eventId = cookOk(plan);
        assertThat(reload(a).getStatus()).isEqualTo(LotStatus.DEPLETED);
        assertThat(reload(b).getQuantity()).isEqualByComparingTo("50");

        cancel(eventId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESTORED"))
                .andExpect(jsonPath("$.restoredAt").isNotEmpty())
                .andExpect(jsonPath("$.changes.length()").value(2))
                .andExpect(jsonPath("$.changes[0].type").value("COOK_RESTORE"));

        InventoryLot restoredA = reload(a);
        assertThat(restoredA.getQuantity()).isEqualByComparingTo("150");
        assertThat(restoredA.getStatus()).isEqualTo(LotStatus.ACTIVE);
        assertThat(reload(b).getQuantity()).isEqualByComparingTo("100");
        mockMvc.perform(get("/api/v1/meal-plans").with(TestJwt.user(1L)).param("date", TODAY.toString()))
                .andExpect(jsonPath("$.mealPlans[0].cooked").value(false));
    }

    @Test
    void 레시피_재료량이_바뀌어도_조리_당시_차감량만_복원한다() throws Exception {
        // QA-13·FR-COOK-03: 조리 후 레시피를 200g → 50g으로 바꿔도 복원은 200g
        MealPlan plan = confirmedPlan(1, "감자", "200", "g");
        InventoryLot potato = lot("감자", "500", "g", null);
        long eventId = cookOk(plan);
        entityManager.createQuery("update RecipeIngredient ingredient set ingredient.requiredQty = :qty "
                        + "where ingredient.recipe = :recipe")
                .setParameter("qty", new BigDecimal("50"))
                .setParameter("recipe", plan.getRecipe())
                .executeUpdate();

        cancel(eventId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changes[0].qtyChange").value(200.0));

        assertThat(reload(potato).getQuantity()).isEqualByComparingTo("500");
    }

    @Test
    void 두_번_취소해도_한_번만_복원한다() throws Exception {
        // BR-10·QA-13: 두 번째 취소는 거부, 수량 증가 없음
        MealPlan plan = confirmedPlan(1, "감자", "200", "g");
        InventoryLot potato = lot("감자", "500", "g", null);
        long eventId = cookOk(plan);
        cancel(eventId).andExpect(status().isOk());

        cancel(eventId)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COOKING_005"));

        assertThat(reload(potato).getQuantity()).isEqualByComparingTo("500");
        assertThat(transactionRepository.findByLotIdOrderByCreatedAtDesc(potato.getId())).hasSize(2);
    }

    @Test
    void 취소_후에는_다시_조리하거나_식단을_취소할_수_있다() throws Exception {
        MealPlan plan = confirmedPlan(1, "감자", "200", "g");
        InventoryLot potato = lot("감자", "500", "g", null);
        long eventId = cookOk(plan);

        mockMvc.perform(post("/api/v1/meal-plans/{id}/cancel", plan.getId()).with(TestJwt.user(1L)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MEAL_PLAN_007"));
        cancel(eventId).andExpect(status().isOk());
        cookOk(plan);
        assertThat(reload(potato).getQuantity()).isEqualByComparingTo("300");
    }

    @Test
    void 다른_사용자의_식단과_조리_기록은_다룰_수_없다() throws Exception {
        MealPlan plan = confirmedPlan(1, "감자", "200", "g");
        lot("감자", "500", "g", null);
        long eventId = cookOk(plan);

        mockMvc.perform(get("/api/v1/cooking/preview").with(TestJwt.user(1L)).param("mealPlanId", plan.getId().toString())
                        .with(TestJwt.user(2L)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("MEAL_PLAN_001"));
        mockMvc.perform(post("/api/v1/cooking-events/{id}/cancel", eventId).with(TestJwt.user(2L)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("COOKING_001"));
        assertThat(mealPlanRepository.findById(plan.getId()).orElseThrow().getStatus())
                .isEqualTo(MealPlanStatus.CONFIRMED);
    }

    @Test
    void 식단_id가_없으면_400() throws Exception {
        mockMvc.perform(get("/api/v1/cooking/preview").with(TestJwt.user(1L)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
        mockMvc.perform(post("/api/v1/cooking-events").with(TestJwt.user(1L)).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
    }
}

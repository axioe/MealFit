package com.mealfit.domain.mealplan;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mealfit.domain.cooking.CookingEvent;
import com.mealfit.domain.cooking.CookingEventRepository;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.inventory.InventoryLotRepository;
import com.mealfit.domain.inventory.StorageLocation;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeRepository;
import com.mealfit.domain.recipe.RecipeSource;
import com.mealfit.domain.shopping.ShoppingItem;
import com.mealfit.domain.shopping.ShoppingItemRepository;
import com.mealfit.domain.shopping.ShoppingItemStatus;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

/** 식단 확정(서버 검증·부족분 계산)과 취소 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MealPlanConfirmTest {

    private static final LocalDate DATE = LocalDate.now().plusDays(1);
    private static final Long USER = 1L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private InventoryLotRepository inventoryLotRepository;

    @Autowired
    private ShoppingItemRepository shoppingItemRepository;

    @Autowired
    private CookingEventRepository cookingEventRepository;

    @Autowired
    private EntityManager entityManager;

    @MockitoBean
    private UserDietProfileProvider profileProvider;

    @BeforeEach
    void setUp() {
        given(profileProvider.getProfile(any())).willReturn(UserDietProfile.empty());
    }

    /** ingredients: 재료명, 수량, 단위 순서로 반복 */
    private MealPlan draft(MealType mealType, int servingSize, int servings, String... ingredients) {
        Recipe recipe = Recipe.builder()
                .name("테스트 " + mealType)
                .servingSize(servingSize)
                .cookTimeMin(10)
                .nutritionEstimated(true)
                .source(RecipeSource.SEED)
                .steps(List.of("조리한다."))
                .build();
        for (int i = 0; i < ingredients.length; i += 3) {
            recipe.addIngredient(ingredients[i], new BigDecimal(ingredients[i + 1]), ingredients[i + 2]);
        }
        recipeRepository.save(recipe);
        return mealPlanRepository.save(MealPlan.builder()
                .userId(USER)
                .planDate(DATE)
                .mealType(mealType)
                .recipe(recipe)
                .servings(servings)
                .build());
    }

    private void lot(String name, String qty, String unit, String minStock, LocalDate expiryDate) {
        inventoryLotRepository.save(InventoryLot.builder()
                .userId(USER)
                .ingredientName(name)
                .quantity(new BigDecimal(qty))
                .unit(unit)
                .minStockQty(new BigDecimal(minStock))
                .expiryDate(expiryDate)
                .storageLocation(StorageLocation.FRIDGE)
                .build());
    }

    private ResultActions confirm(MealPlan plan) throws Exception {
        return mockMvc.perform(post("/api/v1/meal-plans/{id}/confirm", plan.getId()));
    }

    private ResultActions cancel(MealPlan plan) throws Exception {
        return mockMvc.perform(post("/api/v1/meal-plans/{id}/cancel", plan.getId()));
    }

    private List<ShoppingItem> shoppingItems() {
        entityManager.flush();
        entityManager.clear();
        return shoppingItemRepository.findByUserIdOrderByIdAsc(USER);
    }

    private BigDecimal requiredOf(String name) {
        return shoppingItems().stream()
                .filter(item -> item.getIngredientName().equals(name))
                .findFirst().orElseThrow()
                .getRequiredQty();
    }

    @Test
    void 확정하면_CONFIRMED가_되고_부족분을_돌려준다() throws Exception {
        // QA-09 사례 1: 필요 4, 최소 유지 2, 현재고 2 → 구매 4
        MealPlan plan = draft(MealType.LUNCH, 1, 1, "달걀", "4", "개");
        lot("달걀", "2", "개", "2", null);

        confirm(plan)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mealPlan.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.shortages.length()").value(1))
                .andExpect(jsonPath("$.shortages[0].ingredientName").value("달걀"))
                .andExpect(jsonPath("$.shortages[0].requiredQty").value(4.0))
                .andExpect(jsonPath("$.shortages[0].remainingQty").value(4.0))
                .andExpect(jsonPath("$.shortages[0].unit").value("개"))
                .andExpect(jsonPath("$.shortages[0].status").value("NEEDED"));
    }

    @Test
    void 재고가_충분하면_부족분이_없다() throws Exception {
        // QA-09 사례 2: 필요 1, 최소 유지 0, 현재고 5 → 0 (음수 없음)
        MealPlan plan = draft(MealType.LUNCH, 1, 1, "달걀", "1", "개");
        lot("달걀", "5", "개", "0", null);

        confirm(plan)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortages.length()").value(0));
        assertThat(shoppingItems()).isEmpty();
    }

    @Test
    void 기한이_지난_재고는_현재고에서_뺀다() throws Exception {
        // QA-10: 필요 5, 정상 재고 2, 기한 경과 10 → 부족분 3
        MealPlan plan = draft(MealType.DINNER, 1, 1, "감자", "5", "개");
        lot("감자", "2", "개", "0", LocalDate.now().plusDays(5));
        lot("감자", "10", "개", "0", LocalDate.now().minusDays(1));

        confirm(plan).andExpect(status().isOk());

        assertThat(requiredOf("감자")).isEqualByComparingTo("3");
    }

    @Test
    void 인분과_단위를_환산해_계산한다() throws Exception {
        // 2인분 기준 돼지고기 0.3kg을 3인분으로 → 450g, 재고 200g → 부족 250g
        MealPlan plan = draft(MealType.DINNER, 2, 3, "돼지고기", "0.3", "kg");
        lot("돼지고기", "200", "g", "0", null);

        confirm(plan).andExpect(status().isOk());

        List<ShoppingItem> items = shoppingItems();
        assertThat(items).hasSize(1);
        assertThat(items.get(0).getUnit()).isEqualTo("g");
        assertThat(items.get(0).getRequiredQty()).isEqualByComparingTo("250");
    }

    @Test
    void 여러_끼니의_같은_재료는_한_줄로_합쳐_계산한다() throws Exception {
        // D06: 점심 달걀 2 + 저녁 달걀 2, 재고 2 → 한 줄, 부족 2 (끼니별로 따로 보면 0이 되어 틀린다)
        MealPlan lunch = draft(MealType.LUNCH, 1, 1, "달걀", "2", "개");
        MealPlan dinner = draft(MealType.DINNER, 1, 1, "달걀", "2", "개");
        lot("달걀", "2", "개", "0", null);

        confirm(lunch).andExpect(status().isOk()).andExpect(jsonPath("$.shortages.length()").value(0));
        confirm(dinner).andExpect(status().isOk()).andExpect(jsonPath("$.shortages[0].requiredQty").value(2.0));

        List<ShoppingItem> items = shoppingItems();
        assertThat(items).hasSize(1);
        assertThat(items.get(0).getRequiredQty()).isEqualByComparingTo("2");
    }

    @Test
    void 최소_유지량은_묶음_중_가장_큰_값을_쓴다() throws Exception {
        // D05: 묶음 A(유지 2), 묶음 B(유지 3) → 3 (합계 5가 아님). 필요 1 + 유지 3 - 재고 2 = 2
        MealPlan plan = draft(MealType.BREAKFAST, 1, 1, "우유", "1", "개");
        lot("우유", "1", "개", "2", null);
        lot("우유", "1", "개", "3", null);

        confirm(plan).andExpect(status().isOk());

        assertThat(requiredOf("우유")).isEqualByComparingTo("2");
    }

    @Test
    void 다른_계열_단위는_합치지_않는다() throws Exception {
        // BR-03: 두부 1팩 필요, 재고 두부 300g → 팩과 g는 합산하지 않으므로 1팩 부족
        MealPlan plan = draft(MealType.DINNER, 1, 1, "두부", "1", "팩");
        lot("두부", "300", "g", "0", null);

        confirm(plan).andExpect(status().isOk());

        List<ShoppingItem> items = shoppingItems();
        assertThat(items).hasSize(1);
        assertThat(items.get(0).getUnit()).isEqualTo("팩");
        assertThat(items.get(0).getRequiredQty()).isEqualByComparingTo("1");
    }

    @Test
    void 알레르기_재료가_있으면_확정하지_않는다() throws Exception {
        // QA-05: 확정 차단, 장보기에도 반영되지 않음
        given(profileProvider.getProfile(any()))
                .willReturn(new UserDietProfile(null, null, null, Set.of("땅콩"), Set.of()));
        MealPlan plan = draft(MealType.LUNCH, 1, 1, "땅콩버터", "20", "g", "식빵", "2", "장");

        confirm(plan)
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("MEAL_PLAN_005"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("땅콩버터")));

        assertThat(shoppingItems()).isEmpty();
        assertThat(mealPlanRepository.findById(plan.getId()).orElseThrow().getStatus())
                .isEqualTo(MealPlanStatus.DRAFT);
    }

    @Test
    void 제외_재료가_있어도_확정하지_않는다() throws Exception {
        given(profileProvider.getProfile(any()))
                .willReturn(new UserDietProfile(null, null, null, Set.of(), Set.of("오이")));
        MealPlan plan = draft(MealType.LUNCH, 1, 1, "오이", "1", "개");

        confirm(plan)
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("MEAL_PLAN_005"));
    }

    @Test
    void 수량이_비정상인_레시피는_확정하지_않는다() throws Exception {
        MealPlan plan = draft(MealType.LUNCH, 1, 1, "달걀", "0", "개");

        confirm(plan)
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("MEAL_PLAN_006"));
    }

    @Test
    void 이미_확정했거나_취소한_식단은_확정할_수_없다() throws Exception {
        // QA-15: 취소 후 재확정 차단
        MealPlan plan = draft(MealType.LUNCH, 1, 1, "달걀", "1", "개");
        confirm(plan).andExpect(status().isOk());
        confirm(plan).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("COMMON_409"));

        cancel(plan).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELED"));
        confirm(plan).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("COMMON_409"));
    }

    @Test
    void 다른_사용자의_식단은_확정할_수_없다() throws Exception {
        MealPlan plan = draft(MealType.LUNCH, 1, 1, "달걀", "1", "개");

        mockMvc.perform(post("/api/v1/meal-plans/{id}/confirm", plan.getId()).header("X-User-Id", "2"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("MEAL_PLAN_001"));
    }

    @Test
    void 확정_식단을_취소하면_부족분을_다시_계산한다() throws Exception {
        MealPlan lunch = draft(MealType.LUNCH, 1, 1, "달걀", "3", "개");
        MealPlan dinner = draft(MealType.DINNER, 1, 1, "달걀", "2", "개", "양파", "1", "개");
        confirm(lunch).andExpect(status().isOk());
        confirm(dinner).andExpect(status().isOk());
        assertThat(requiredOf("달걀")).isEqualByComparingTo("5");

        cancel(dinner).andExpect(status().isOk());

        List<ShoppingItem> items = shoppingItems();
        assertThat(items).extracting(ShoppingItem::getIngredientName).containsExactly("달걀");
        assertThat(items.get(0).getRequiredQty()).isEqualByComparingTo("3");
        assertThat(items.get(0).getStatus()).isEqualTo(ShoppingItemStatus.NEEDED);
    }

    @Test
    void 조리한_식단은_조리를_먼저_취소해야_한다() throws Exception {
        MealPlan plan = draft(MealType.LUNCH, 1, 1, "달걀", "1", "개");
        confirm(plan).andExpect(status().isOk());
        cookingEventRepository.save(CookingEvent.cooked(USER, plan, 1));

        cancel(plan)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MEAL_PLAN_007"));
    }

    @Test
    void 조리한_식단은_부족분_계산에서_뺀다() throws Exception {
        MealPlan cooked = draft(MealType.LUNCH, 1, 1, "달걀", "2", "개");
        confirm(cooked).andExpect(status().isOk());
        cookingEventRepository.save(CookingEvent.cooked(USER, cooked, 1));
        MealPlan dinner = draft(MealType.DINNER, 1, 1, "달걀", "1", "개");

        confirm(dinner).andExpect(status().isOk());

        assertThat(requiredOf("달걀")).isEqualByComparingTo("1");
    }
}

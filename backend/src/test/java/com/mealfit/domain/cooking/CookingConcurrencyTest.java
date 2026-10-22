package com.mealfit.domain.cooking;

import com.mealfit.support.TestUserFixture;
import org.junit.jupiter.api.BeforeEach;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

import com.mealfit.domain.cooking.dto.CookingEventRequest;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.inventory.InventoryLotRepository;
import com.mealfit.domain.inventory.InventoryTransaction;
import com.mealfit.domain.inventory.InventoryTransactionRepository;
import com.mealfit.domain.inventory.StorageLocation;
import com.mealfit.domain.mealplan.MealPlan;
import com.mealfit.domain.mealplan.MealPlanRepository;
import com.mealfit.domain.mealplan.MealPlanService;
import com.mealfit.domain.mealplan.MealPlanStatus;
import com.mealfit.domain.mealplan.MealType;
import com.mealfit.domain.mealplan.dto.MealPlanRecommendRequest;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeRepository;
import com.mealfit.domain.recipe.RecipeSource;
import com.mealfit.global.exception.BusinessException;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

/**
 * 조리·식단의 동시·반복 요청 정합성 (BR-13, QA-20, D06)과 조리 저장 실패 시 롤백 (FR-COOK-02, QA-12).
 * 요청마다 실제로 커밋되어야 하므로 테스트 트랜잭션을 쓰지 않고, 끝나면 이 사용자의 데이터를 지운다.
 */
@SpringBootTest
@ActiveProfiles("test")
class CookingConcurrencyTest {

    private static final Long USER = 7001L;
    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("Asia/Seoul"));
    private static final String OK = "OK";

    @Autowired
    private CookingService cookingService;
    @Autowired
    private MealPlanService mealPlanService;
    @Autowired
    private RecipeRepository recipeRepository;
    @Autowired
    private MealPlanRepository mealPlanRepository;
    @Autowired
    private InventoryLotRepository lotRepository;
    @MockitoSpyBean
    private InventoryTransactionRepository transactionRepository;
    @Autowired
    private CookingEventRepository cookingEventRepository;
    @Autowired
    private EntityManager entityManager;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    private TestUserFixture userFixture;

    /** 작업 스레드에서도 조회할 수 있게 커밋된 회원·프로필을 준비합니다. */
    @BeforeEach
    void prepareUserProfile() {
        userFixture = TestUserFixture.create(jdbcTemplate, USER);
    }

    @AfterEach
    void cleanUp() {
        jdbcTemplate.update("delete from inventory_transactions where user_id = ?", USER);
        jdbcTemplate.update("delete from cooking_events where user_id = ?", USER);
        jdbcTemplate.update("delete from inventory_lots where user_id = ?", USER);
        jdbcTemplate.update("delete from shopping_items where user_id = ?", USER);
        jdbcTemplate.update("delete from meal_plans where user_id = ?", USER);
        jdbcTemplate.update("delete from recipes where user_id = ?", USER);

        // 재고·식단 정리 후 이 테스트가 생성한 회원·프로필만 제거합니다.
        if (userFixture != null) {
            userFixture.close();
        }
    }

    @Test
    void 같은_재고로_두_식단을_동시에_조리하면_한_번만_차감한다() throws Exception {
        // QA-20: 재고 300g, 두 식단이 각각 200g → 하나만 조리되고 음수 재고가 생기지 않는다
        MealPlan lunch = plan(MealType.LUNCH, true, "돼지고기", "200", "g");
        MealPlan dinner = plan(MealType.DINNER, true, "돼지고기", "200", "g");
        InventoryLot pork = lot("돼지고기", "300", "g");

        List<String> results = concurrently(() -> cook(lunch), () -> cook(dinner));

        assertThat(results).containsExactlyInAnyOrder(OK, "COOKING_004");
        assertThat(reloadLot(pork).getQuantity()).isEqualByComparingTo("100");
        assertThat(historyBalance(pork)).isEqualByComparingTo("-200");
    }

    @Test
    void 같은_식단을_동시에_조리해도_한_번만_차감한다() throws Exception {
        MealPlan dinner = plan(MealType.DINNER, true, "달걀", "2", "개");
        InventoryLot egg = lot("달걀", "10", "개");

        List<String> results = concurrently(() -> cook(dinner), () -> cook(dinner));

        assertThat(results).containsExactlyInAnyOrder(OK, "COOKING_003");
        assertThat(reloadLot(egg).getQuantity()).isEqualByComparingTo("8");
        assertThat(historyBalance(egg)).isEqualByComparingTo("-2");
    }

    @Test
    void 같은_조리_취소를_동시에_보내도_한_번만_복원한다() throws Exception {
        // BR-10·QA-20: 중복 복원 없음
        MealPlan dinner = plan(MealType.DINNER, true, "감자", "200", "g");
        InventoryLot potato = lot("감자", "500", "g");
        long eventId = cookingService.cook(USER, new CookingEventRequest(dinner.getId())).id();

        List<String> results = concurrently(() -> cancelCooking(eventId), () -> cancelCooking(eventId));

        assertThat(results).containsExactlyInAnyOrder(OK, "COOKING_005");
        assertThat(reloadLot(potato).getQuantity()).isEqualByComparingTo("500");
        assertThat(historyBalance(potato)).isEqualByComparingTo("0");
    }

    @Test
    void 조리와_식단_취소가_동시에_와도_취소된_식단에_차감이_남지_않는다() throws Exception {
        // BR-09·BR-13: 먼저 처리된 쪽만 성공한다. 조리가 먼저면 취소는 MEAL_PLAN_007, 취소가 먼저면 조리는 COOKING_002
        MealPlan dinner = plan(MealType.DINNER, true, "두부", "100", "g");
        InventoryLot tofu = lot("두부", "300", "g");

        List<String> results = concurrently(() -> cook(dinner), () -> cancelPlan(dinner));

        assertThat(results).containsOnlyOnce(OK);
        assertThat(results).containsAnyOf("MEAL_PLAN_007", "COOKING_002");
        MealPlanStatus status = mealPlanRepository.findById(dinner.getId()).orElseThrow().getStatus();
        boolean cooked = cookingEventRepository.existsByMealPlanIdAndStatus(dinner.getId(), CookingStatus.COOKED);
        if (status == MealPlanStatus.CANCELED) {
            assertThat(cooked).isFalse();
            assertThat(reloadLot(tofu).getQuantity()).isEqualByComparingTo("300");
        } else {
            assertThat(cooked).isTrue();
            assertThat(reloadLot(tofu).getQuantity()).isEqualByComparingTo("200");
        }
    }

    @Test
    void 같은_식단을_동시에_확정해도_한_번만_확정된다() throws Exception {
        MealPlan dinner = plan(MealType.DINNER, false, "양파", "100", "g");

        List<String> results = concurrently(() -> confirm(dinner), () -> confirm(dinner));

        assertThat(results).containsExactlyInAnyOrder(OK, "COMMON_409");
        assertThat(mealPlanRepository.findById(dinner.getId()).orElseThrow().getStatus())
                .isEqualTo(MealPlanStatus.CONFIRMED);
    }

    @Test
    void 전체_재추천을_동시에_보내도_끼니마다_초안이_하나만_남는다() throws Exception {
        // D06 A안: 같은 날짜의 식단을 잠가 재추천을 하나씩 처리한다
        mealPlanService.recommend(USER, new MealPlanRecommendRequest(TODAY, 1));

        List<String> results = concurrently(
                () -> mealPlanService.recommend(USER, new MealPlanRecommendRequest(TODAY, 1)),
                () -> mealPlanService.recommend(USER, new MealPlanRecommendRequest(TODAY, 1)));

        assertThat(results).containsExactly(OK, OK);
        List<MealPlan> live = mealPlanRepository.findByUserIdAndPlanDateAndStatusNot(
                USER, TODAY, MealPlanStatus.CANCELED);
        assertThat(live).extracting(MealPlan::getMealType)
                .containsExactlyInAnyOrder(MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER);
    }

    @Test
    void 이력_저장에_실패하면_조리_기록과_재고_차감을_모두_되돌린다() {
        // QA-12: 이력 저장 오류를 주입하면 조리 이벤트·재고·이력이 변경 전 상태로 남는다
        MealPlan dinner = plan(MealType.DINNER, true, "돼지고기", "200", "g");
        InventoryLot pork = lot("돼지고기", "500", "g");
        doAnswer(invocation -> {
            entityManager.persist(invocation.getArgument(0, InventoryTransaction.class));
            entityManager.flush();
            throw new IllegalStateException("이력 저장 실패");
        }).when(transactionRepository).save(any(InventoryTransaction.class));

        assertThatThrownBy(() -> cookingService.cook(USER, new CookingEventRequest(dinner.getId())))
                .isInstanceOf(IllegalStateException.class);

        assertThat(reloadLot(pork).getQuantity()).isEqualByComparingTo("500");
        assertThat(cookingEventRepository.existsByMealPlanIdAndStatus(dinner.getId(), CookingStatus.COOKED))
                .isFalse();
        assertThat(transactionRepository.findByLotIdOrderByCreatedAtDesc(pork.getId())).isEmpty();
    }

    /** ingredients: 재료명, 수량, 단위 순서로 반복. 기준 1인분 레시피의 1인분 식단을 만든다. */
    private MealPlan plan(MealType mealType, boolean confirmed, String... ingredients) {
        Recipe recipe = Recipe.builder()
                .userId(USER)
                .name("동시성 " + mealType)
                .servingSize(1)
                .cookTimeMin(10)
                .nutritionEstimated(true)
                .source(RecipeSource.SEED)
                .steps(List.of("조리한다."))
                .build();
        for (int i = 0; i < ingredients.length; i += 3) {
            recipe.addIngredient(ingredients[i], new BigDecimal(ingredients[i + 1]), ingredients[i + 2]);
        }
        recipeRepository.save(recipe);
        MealPlan plan = MealPlan.builder()
                .userId(USER)
                .planDate(TODAY)
                .mealType(mealType)
                .recipe(recipe)
                .servings(1)
                .build();
        if (confirmed) {
            plan.confirm();
        }
        return mealPlanRepository.save(plan);
    }

    private InventoryLot lot(String name, String qty, String unit) {
        return lotRepository.save(InventoryLot.builder()
                .userId(USER)
                .ingredientName(name)
                .quantity(new BigDecimal(qty))
                .unit(unit)
                .storageLocation(StorageLocation.FRIDGE)
                .build());
    }

    private InventoryLot reloadLot(InventoryLot lot) {
        return lotRepository.findById(lot.getId()).orElseThrow();
    }

    /** 이 묶음 이력의 증감 합계. 테스트 묶음은 이력 없이 만들었으므로 차감·복원분만 남는다. */
    private BigDecimal historyBalance(InventoryLot lot) {
        return transactionRepository.findByLotIdOrderByCreatedAtDesc(lot.getId()).stream()
                .map(InventoryTransaction::getQtyChange)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void cook(MealPlan plan) {
        cookingService.cook(USER, new CookingEventRequest(plan.getId()));
    }

    private void cancelCooking(long eventId) {
        cookingService.cancel(USER, eventId);
    }

    private void cancelPlan(MealPlan plan) {
        mealPlanService.cancel(USER, plan.getId());
    }

    private void confirm(MealPlan plan) {
        mealPlanService.confirm(USER, plan.getId());
    }

    /** 두 요청을 동시에 시작한다. 결과는 성공이면 OK, 도메인 오류면 에러 코드. 그 밖의 예외는 테스트 실패로 드러낸다. */
    private List<String> concurrently(ThrowingAction first, ThrowingAction second) throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var left = executor.submit(attempt(first, ready, start));
            var right = executor.submit(attempt(second, ready, start));
            try {
                assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            } finally {
                start.countDown();
            }
            return List.of(left.get(10, TimeUnit.SECONDS), right.get(10, TimeUnit.SECONDS));
        }
    }

    private static Callable<String> attempt(ThrowingAction action, CountDownLatch ready, CountDownLatch start) {
        return () -> {
            ready.countDown();
            if (!start.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("동시 요청 대기 초과");
            }
            try {
                action.run();
                return OK;
            } catch (BusinessException exception) {
                return exception.getErrorCode().getCode();
            }
        };
    }

    @FunctionalInterface
    private interface ThrowingAction {
        void run() throws Exception;
    }
}

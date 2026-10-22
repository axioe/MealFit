package com.mealfit.domain.cooking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
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
import com.mealfit.domain.mealplan.UserDietProfile;
import com.mealfit.domain.mealplan.UserDietProfileProvider;
import com.mealfit.support.TestJwt;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

/** 식단 없이 재료 목록만으로 조리 미리보기·완료(차감)·취소(복원) — 15분 요리 등 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CookingIngredientsApiTest {

    private static final Long USER = 1L;
    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("Asia/Seoul"));

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private InventoryLotRepository lotRepository;

    @Autowired
    private InventoryTransactionRepository transactionRepository;

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

    /** ingredients: 재료명, 수량, 단위 순서로 반복 */
    private String body(String clientRequestId, String... ingredients) throws Exception {
        List<Map<String, Object>> items = new ArrayList<>();
        for (int i = 0; i < ingredients.length; i += 3) {
            items.add(Map.of("ingredientName", ingredients[i],
                    "quantity", new BigDecimal(ingredients[i + 1]), "unit", ingredients[i + 2]));
        }
        Map<String, Object> request = new LinkedHashMap<>();
        if (clientRequestId != null) {
            request.put("clientRequestId", clientRequestId);
        }
        request.put("recipeName", "달걀 양파 볶음");
        request.put("servings", 1);
        request.put("ingredients", items);
        return objectMapper.writeValueAsString(request);
    }

    private ResultActions preview(String... ingredients) throws Exception {
        return mockMvc.perform(post("/api/v1/cooking/ingredients/preview").with(TestJwt.user(USER))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(null, ingredients)));
    }

    private ResultActions cook(String clientRequestId, String... ingredients) throws Exception {
        return mockMvc.perform(post("/api/v1/cooking-events/ingredients").with(TestJwt.user(USER))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(clientRequestId, ingredients)));
    }

    private long cookOk(String clientRequestId, String... ingredients) throws Exception {
        String response = cook(clientRequestId, ingredients)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private InventoryLot reload(InventoryLot lot) {
        entityManager.flush();
        entityManager.clear();
        return lotRepository.findById(lot.getId()).orElseThrow();
    }

    private static String newRequestId() {
        return UUID.randomUUID().toString();
    }

    @Test
    void 미리보기는_재고와_이력을_바꾸지_않는다() throws Exception {
        InventoryLot egg = lot("달걀", "5", "개", TODAY.plusDays(3));

        preview("달걀", "2", "개")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mealPlanId").doesNotExist())
                .andExpect(jsonPath("$.recipeName").value("달걀 양파 볶음"))
                .andExpect(jsonPath("$.servings").value(1))
                .andExpect(jsonPath("$.canCook").value(true))
                .andExpect(jsonPath("$.ingredients[0].requiredQty").value(2.0))
                .andExpect(jsonPath("$.ingredients[0].deductions[0].lotId").value(egg.getId()));

        assertThat(reload(egg).getQuantity()).isEqualByComparingTo("5");
        assertThat(transactionRepository.findByLotIdOrderByCreatedAtDesc(egg.getId())).isEmpty();
    }

    @Test
    void 조리_완료하면_보낸_수량대로_차감하고_취소하면_복원한다() throws Exception {
        // 양파 0.3kg 묶음에서 50g, 달걀은 기한이 빠른 묶음부터 2개
        InventoryLot onion = lot("양파", "0.3", "kg", TODAY.plusDays(5));
        InventoryLot eggLater = lot("달걀", "5", "개", TODAY.plusDays(7));
        InventoryLot eggSoon = lot("달걀", "1", "개", TODAY.plusDays(1));

        String response = cook(newRequestId(), "달걀", "2", "개", "양파", "50", "g")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("COOKED"))
                .andExpect(jsonPath("$.mealPlanId").doesNotExist())
                .andExpect(jsonPath("$.recipeName").value("달걀 양파 볶음"))
                .andExpect(jsonPath("$.changes.length()").value(3))
                .andReturn().getResponse().getContentAsString();

        assertThat(reload(eggSoon).getStatus()).isEqualTo(LotStatus.DEPLETED);
        assertThat(reload(eggLater).getQuantity()).isEqualByComparingTo("4");
        assertThat(reload(onion).getQuantity()).isEqualByComparingTo("0.25");
        List<InventoryTransaction> transactions = transactionRepository.findByLotIdOrderByCreatedAtDesc(onion.getId());
        assertThat(transactions).hasSize(1);
        assertThat(transactions.get(0).getType()).isEqualTo(InventoryTransactionType.COOK_DEDUCT);
        assertThat(transactions.get(0).getMemo()).isEqualTo("조리: 달걀 양파 볶음");

        long eventId = objectMapper.readTree(response).get("id").asLong();
        mockMvc.perform(post("/api/v1/cooking-events/{id}/cancel", eventId).with(TestJwt.user(USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESTORED"))
                .andExpect(jsonPath("$.mealPlanId").doesNotExist())
                .andExpect(jsonPath("$.changes.length()").value(3));

        assertThat(reload(eggSoon).getQuantity()).isEqualByComparingTo("1");
        assertThat(reload(eggSoon).getStatus()).isEqualTo(LotStatus.ACTIVE);
        assertThat(reload(eggLater).getQuantity()).isEqualByComparingTo("5");
        assertThat(reload(onion).getQuantity()).isEqualByComparingTo("0.3");
    }

    @Test
    void 같은_요청_ID로_다시_보내면_한_번만_차감한다() throws Exception {
        InventoryLot egg = lot("달걀", "5", "개", null);
        String requestId = newRequestId();

        long first = cookOk(requestId, "달걀", "2", "개");
        cook(requestId.toUpperCase(), "달걀", "2", "개")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(first))
                .andExpect(jsonPath("$.changes[0].qtyChange").value(-2.0));

        assertThat(reload(egg).getQuantity()).isEqualByComparingTo("3");
        assertThat(transactionRepository.findByLotIdOrderByCreatedAtDesc(egg.getId())).hasSize(1);
        assertThat(cookingEventRepository.findAll()).hasSize(1);
    }

    @Test
    void 재고가_부족하면_아무것도_차감하지_않고_거부한다() throws Exception {
        InventoryLot egg = lot("달걀", "1", "개", null);
        InventoryLot onion = lot("양파", "100", "g", null);
        InventoryLot expired = lot("달걀", "5", "개", TODAY.minusDays(1));

        preview("달걀", "2", "개", "양파", "50", "g")
                .andExpect(jsonPath("$.canCook").value(false))
                .andExpect(jsonPath("$.blockedReason").value(org.hamcrest.Matchers.containsString("달걀 1개")));
        cook(newRequestId(), "달걀", "2", "개", "양파", "50", "g")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COOKING_004"));
        cook(newRequestId(), "두부", "100", "g")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COOKING_004"));

        assertThat(reload(egg).getQuantity()).isEqualByComparingTo("1");
        assertThat(reload(onion).getQuantity()).isEqualByComparingTo("100");
        assertThat(reload(expired).getQuantity()).isEqualByComparingTo("5");
        assertThat(cookingEventRepository.findAll()).isEmpty();
    }

    @Test
    void 단위_계열이_다르면_차감하지_않는다() throws Exception {
        // 개 단위 재고를 g으로 쓸 수는 없다 (개·팩 등은 환산하지 않음)
        InventoryLot egg = lot("달걀", "5", "개", null);

        cook(newRequestId(), "달걀", "100", "g")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COOKING_004"));

        assertThat(reload(egg).getQuantity()).isEqualByComparingTo("5");
    }

    @Test
    void 알레르기_제외_재료가_있으면_거부한다() throws Exception {
        given(profileProvider.getProfile(USER))
                .willReturn(new UserDietProfile(null, null, null, Set.of("달걀"), Set.of()));
        InventoryLot egg = lot("달걀", "5", "개", null);

        preview("달걀", "2", "개")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canCook").value(false))
                .andExpect(jsonPath("$.blockedReason").value(org.hamcrest.Matchers.containsString("달걀")));
        cook(newRequestId(), "달걀", "2", "개")
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("COOKING_008"));

        assertThat(reload(egg).getQuantity()).isEqualByComparingTo("5");
    }

    @Test
    void 같은_재료를_두_번_보내면_거부한다() throws Exception {
        lot("양파", "500", "g", null);

        cook(newRequestId(), "양파", "100", "g", "양파", "0.1", "kg")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COOKING_007"));
        preview("양파", "100", "g", "양파", "100", "g")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COOKING_007"));
    }

    @Test
    void 입력이_올바르지_않으면_400() throws Exception {
        lot("달걀", "5", "개", null);

        // 조리 완료에는 요청 ID가 필요하다
        cook(null, "달걀", "1", "개")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
        cook("not-a-uuid", "달걀", "1", "개")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
        cook(newRequestId(), "달걀", "0", "개")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
        cook(newRequestId())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
        mockMvc.perform(post("/api/v1/cooking-events/ingredients").with(TestJwt.user(USER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"clientRequestId\":\"" + newRequestId() + "\",\"ingredients\":"
                                + "[{\"ingredientName\":\"달걀\",\"quantity\":1,\"unit\":\"개\"}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
        assertThat(cookingEventRepository.findAll()).isEmpty();
    }

    @Test
    void 다른_사용자의_재고는_쓰지_않고_조리_기록도_취소할_수_없다() throws Exception {
        InventoryLot egg = lot("달걀", "5", "개", null);
        long eventId = cookOk(newRequestId(), "달걀", "1", "개");

        mockMvc.perform(post("/api/v1/cooking-events/ingredients").with(TestJwt.user(2L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(newRequestId(), "달걀", "1", "개")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COOKING_004"));
        mockMvc.perform(post("/api/v1/cooking-events/{id}/cancel", eventId).with(TestJwt.user(2L)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("COOKING_001"));

        assertThat(reload(egg).getQuantity()).isEqualByComparingTo("4");
    }
}

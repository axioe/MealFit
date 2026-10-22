package com.mealfit.domain.mealplan;

import com.mealfit.support.TestJwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willReturn;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mealfit.domain.mealplan.dto.AiMealPlanRequest;
import com.mealfit.domain.mealplan.dto.AiMealSuggestion;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeIngredient;
import com.mealfit.domain.recipe.RecipeRepository;
import com.mealfit.domain.recipe.RecipeSource;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;

/** AI 제안의 서버 검증과 로컬 대체 전환, 알레르기·제외 재료 차단 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MealPlanAiFallbackTest {

    private static final LocalDate DATE = LocalDate.now().plusDays(1);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RecipeRepository recipeRepository;

    @MockitoBean
    private MealPlanAiClient aiClient;

    @MockitoBean
    private UserDietProfileProvider profileProvider;

    @BeforeEach
    void setUp() {
        given(profileProvider.getProfile(any())).willReturn(UserDietProfile.empty());
        given(aiClient.recommend(any())).willThrow(new ResourceAccessException("connection refused"));
    }

    private ResultActions recommend() throws Exception {
        return mockMvc.perform(post("/api/v1/meal-plans/recommend").with(TestJwt.user(1L))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"planDate\":\"" + DATE + "\"}"));
    }

    private JsonNode recommendOk() throws Exception {
        String body = recommend().andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("mealPlans");
    }

    private Recipe recipe(JsonNode plan) {
        return recipeRepository.findById(plan.get("recipe").get("id").asLong()).orElseThrow();
    }

    private static UserDietProfile restrict(Set<String> allergies, Set<String> excluded) {
        return new UserDietProfile(null, null, null, allergies, excluded);
    }

    private static AiMealSuggestion suggestion(MealType mealType, String name, String ingredient, String qty) {
        return new AiMealSuggestion(mealType, name, "AI 설명", 1, 15,
                new BigDecimal("400"), null, null, null,
                List.of(new AiMealSuggestion.Ingredient(ingredient, new BigDecimal(qty), "g")),
                List.of("재료를 손질한다.", "조리해 완성한다."), "AI 추천 이유");
    }

    @Test
    void AI가_실패하면_모든_끼니를_로컬_대체로_채운다() throws Exception {
        recommend()
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mealPlans.length()").value(3))
                .andExpect(jsonPath("$.mealPlans[*].recipe.source").value(org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is("LOCAL_FALLBACK"))));
    }

    @Test
    void 검증을_통과한_AI_제안만_쓰고_나머지는_로컬_대체로_바꾼다() throws Exception {
        given(profileProvider.getProfile(any())).willReturn(restrict(Set.of("땅콩"), Set.of()));
        // setUp의 예외 설정을 호출하지 않도록 willReturn().given() 형태로 다시 설정한다
        willReturn(List.of(
                suggestion(MealType.BREAKFAST, "AI 오트밀", "귀리", "50"),
                suggestion(MealType.LUNCH, "AI 수량오류 덮밥", "밥", "0"),
                suggestion(MealType.DINNER, "AI 땅콩 국수", "땅콩버터", "20")))
                .given(aiClient).recommend(any());

        JsonNode plans = recommendOk();

        assertThat(plans.get(0).get("recipe").get("source").asText()).isEqualTo("AI_GENERATED");
        assertThat(plans.get(0).get("recipe").get("name").asText()).isEqualTo("AI 오트밀");
        assertThat(plans.get(0).get("recommendationReason").asText()).isEqualTo("AI 추천 이유");
        assertThat(plans.get(1).get("recipe").get("source").asText()).isEqualTo("LOCAL_FALLBACK");
        assertThat(plans.get(2).get("recipe").get("source").asText()).isEqualTo("LOCAL_FALLBACK");

        Recipe aiRecipe = recipe(plans.get(0));
        assertThat(aiRecipe.getUserId()).isEqualTo(1L);
        assertThat(aiRecipe.getSource()).isEqualTo(RecipeSource.AI_GENERATED);
        assertThat(aiRecipe.isNutritionEstimated()).isTrue();
        assertThat(aiRecipe.getIngredients()).extracting(RecipeIngredient::getIngredientName).containsExactly("귀리");
        assertThat(aiRecipe.getSteps()).hasSize(2);

        // AI에는 끼니·제약만 보내고 개인 식별 정보는 없다 (요청 레코드에 이름·이메일 필드가 없음)
        ArgumentCaptor<AiMealPlanRequest> captor = ArgumentCaptor.forClass(AiMealPlanRequest.class);
        verify(aiClient).recommend(captor.capture());
        assertThat(captor.getValue().mealTypes()).containsExactly(MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER);
        assertThat(captor.getValue().allergies()).containsExactly("땅콩");
    }

    @Test
    void 제외_재료가_든_로컬_대체_레시피는_고르지_않는다() throws Exception {
        given(profileProvider.getProfile(any())).willReturn(restrict(Set.of(), Set.of("달걀")));

        JsonNode plans = recommendOk();

        assertThat(plans.get(0).get("recipe").get("name").asText()).isEqualTo("그릭요거트 과일 볼");
        plans.forEach(plan -> assertThat(recipe(plan).getIngredients())
                .extracting(RecipeIngredient::getIngredientName)
                .noneMatch(name -> name.contains("달걀")));
    }

    @Test
    void 제약을_통과하는_후보가_없으면_422() throws Exception {
        given(profileProvider.getProfile(any())).willReturn(restrict(Set.of("달걀"), Set.of("바나나")));

        recommend()
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("MEAL_PLAN_004"));
    }
}

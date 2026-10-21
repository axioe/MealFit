package com.mealfit.domain.recipe;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RecipeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecipeRepository recipeRepository;

    private Recipe saveRecipe(Long userId) {
        Recipe recipe = Recipe.builder()
                .userId(userId)
                .name("닭가슴살 샐러드")
                .servingSize(2)
                .cookTimeMin(15)
                .calories(new BigDecimal("420.0"))
                .nutritionEstimated(true)
                .source(RecipeSource.SEED)
                .steps(List.of("닭가슴살을 굽는다.", "채소와 섞는다."))
                .build();
        recipe.addIngredient("닭가슴살", new BigDecimal("300"), "g");
        recipe.addIngredient("달걀", new BigDecimal("1"), "개");
        return recipeRepository.save(recipe);
    }

    @Test
    void 요청한_인분으로_재료량을_환산한다() throws Exception {
        Recipe recipe = saveRecipe(null);

        mockMvc.perform(get("/api/v1/recipes/{id}", recipe.getId()).param("servings", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.servingSize").value(2))
                .andExpect(jsonPath("$.servings").value(3))
                .andExpect(jsonPath("$.source").value("SEED"))
                .andExpect(jsonPath("$.nutritionEstimated").value(true))
                .andExpect(jsonPath("$.steps[1]").value("채소와 섞는다."))
                .andExpect(jsonPath("$.ingredients[0].ingredientName").value("닭가슴살"))
                .andExpect(jsonPath("$.ingredients[0].quantity").value(450.0))
                .andExpect(jsonPath("$.ingredients[0].unit").value("g"))
                // 달걀 1개 × 3/2 = 1.5개 → 개수 단위는 올림해 2개
                .andExpect(jsonPath("$.ingredients[1].quantity").value(2.0));
    }

    @Test
    void 인분이_없으면_기준_인분() throws Exception {
        Recipe recipe = saveRecipe(null);

        mockMvc.perform(get("/api/v1/recipes/{id}", recipe.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.servings").value(2))
                .andExpect(jsonPath("$.ingredients[0].quantity").value(300.0));
    }

    @Test
    void 본인_레시피는_조회된다() throws Exception {
        Recipe recipe = saveRecipe(7L);

        mockMvc.perform(get("/api/v1/recipes/{id}", recipe.getId()).header("X-User-Id", "7"))
                .andExpect(status().isOk());
    }

    @Test
    void 다른_사용자의_레시피는_404() throws Exception {
        Recipe recipe = saveRecipe(7L);

        mockMvc.perform(get("/api/v1/recipes/{id}", recipe.getId()).header("X-User-Id", "8"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RECIPE_001"));
    }

    @Test
    void 없는_레시피는_404() throws Exception {
        mockMvc.perform(get("/api/v1/recipes/{id}", 999_999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RECIPE_001"));
    }

    @Test
    void 인분이_1_미만이면_400() throws Exception {
        Recipe recipe = saveRecipe(null);

        mockMvc.perform(get("/api/v1/recipes/{id}", recipe.getId()).param("servings", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_400"));
    }
}

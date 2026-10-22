package com.mealfit.domain.ai;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
import com.mealfit.domain.inventory.ExpirationStatus;
import com.mealfit.domain.mealplan.MealType;
import com.mealfit.domain.mealplan.dto.AiMealPlanRequest;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class FlaskMealPlanAiClientTest {
    private MockRestServiceServer server;
    private FlaskMealPlanAiClient client;
    static final String MEAL = """
        {"mealType":"LUNCH","recipeName":"두부 볶음","description":"간단한 요리","servingSize":2,
        "cookTimeMin":15,"calories":"600","proteinG":"40.1","carbsG":"50","fatG":"20",
        "ingredients":[{"name":"두부","quantity":"300.125","unit":"g"}],
        "steps":["충분히 익혀 주세요."],"reason":"보유 재료 활용"}
        """;

    @BeforeEach void setup() {
        var builder = RestClient.builder().baseUrl("http://flask.test");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new FlaskMealPlanAiClient(builder.build());
    }

    private AiMealPlanRequest request() {
        return new AiMealPlanRequest(LocalDate.of(2026, 10, 23), List.of(MealType.LUNCH), 2,
                "LOSE", 20, 8000, Set.of("땅콩"), Set.of("새우"),
                List.of(new AiMealPlanRequest.InventoryItem("두부", new BigDecimal("300.125"), "g",
                        LocalDate.of(2026, 10, 23), ExpirationStatus.IMMINENT)), List.of("확정 아침"), List.of("어제 메뉴"));
    }

    @Test void forwardsExistingContractAndMapsDecimalResponse() {
        server.expect(requestTo("http://flask.test/ai/meal-plans"))
                .andExpect(jsonPath("$.mealTypes[0]").value("LUNCH"))
                .andExpect(jsonPath("$.inventory[0].ingredientName").value("두부"))
                .andExpect(jsonPath("$.inventory[0].quantity").value(300.125))
                .andExpect(jsonPath("$.goal").value("LOSE"))
                .andExpect(jsonPath("$.keptMeals[0]").value("확정 아침"))
                .andExpect(jsonPath("$.userId").doesNotExist())
                .andExpect(jsonPath("$.email").doesNotExist())
                .andRespond(withSuccess("[" + MEAL + "]", MediaType.APPLICATION_JSON));
        var result = client.recommend(request());
        assertThat(result.getFirst().ingredients().getFirst().quantity()).isEqualByComparingTo("300.125");
        assertThat(result.getFirst().mealType()).isEqualTo(MealType.LUNCH);
        server.verify();
    }

    @Test void protectsLogsFromUpstreamErrorBody() {
        server.expect(anything()).andRespond(withStatus(HttpStatus.GATEWAY_TIMEOUT)
                .body("private-key-and-request").contentType(MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> client.recommend(request())).isInstanceOf(IllegalStateException.class)
                .hasMessage("AI 식단 서비스에 연결하지 못했습니다.").hasNoCause();
    }

    @Test void rejectsMalformedResponsesAndNullItems() {
        for (String body : List.of("{}", "not json", "null", "[null]")) {
            server.reset();
            server.expect(anything()).andRespond(withSuccess(body, MediaType.APPLICATION_JSON));
            assertThatThrownBy(() -> client.recommend(request())).isInstanceOf(IllegalStateException.class);
        }
    }

    @Test void connectionFailureIsSafeForExistingFallback() {
        server.expect(anything()).andRespond(withException(new java.net.ConnectException("private-address")));
        assertThatThrownBy(() -> client.recommend(request())).hasMessageNotContaining("private-address").hasNoCause();
    }
}

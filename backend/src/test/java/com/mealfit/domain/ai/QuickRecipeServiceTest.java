package com.mealfit.domain.ai;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
import com.mealfit.domain.inventory.*;
import com.mealfit.domain.mealplan.*;
import jakarta.validation.Validation;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class QuickRecipeServiceTest {
    private InventoryLotRepository inventory;
    private ObjectProvider<UserDietProfileProvider> profiles;
    private MockRestServiceServer server;
    private QuickRecipeService service;
    private final QuickRecipeModels.Request request = new QuickRecipeModels.Request(List.of(1L), 15, 1);
    static final String RESPONSE = """
        {"source":"AI_GENERATED","asOfDate":"2026-10-22","recipes":[{"title":"달걀 볶음","description":"간편한 요리",
        "cookingMinutes":10,"servings":1,"reason":"보유 재료 활용","steps":["익혀 주세요."],"ingredients":[{"name":"달걀",
        "quantity":"2","unit":"개","inventory":{"quantity":"4","unit":"개","shortageQuantity":"0","status":"SUFFICIENT","hasIncompatibleUnits":false}}]}]}
        """;

    @BeforeEach @SuppressWarnings("unchecked")
    void setup() {
        inventory = mock(InventoryLotRepository.class);
        profiles = mock(ObjectProvider.class);
        var builder = RestClient.builder().baseUrl("http://flask.test");
        server = MockRestServiceServer.bindTo(builder).build();
        service = service(builder.build());
        when(inventory.findByUserIdAndStatusOrderByExpiryDateAsc(7L, LotStatus.ACTIVE)).thenReturn(List.of(lot()));
    }
    private QuickRecipeService service(RestClient client) {
        return new QuickRecipeService(client, inventory, profiles, Validation.buildDefaultValidatorFactory().getValidator());
    }
    private InventoryLot lot() {
        var lot = InventoryLot.builder().userId(7L).ingredientName("달걀").quantity(new BigDecimal("4"))
                .unit("개").storageLocation(StorageLocation.FRIDGE).expiryDate(LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(3)).build();
        ReflectionTestUtils.setField(lot, "id", 1L);
        return lot;
    }
    @Test void buildsRequestFromCurrentUserStockAndMapsResponse() {
        server.expect(requestTo("http://flask.test/ai/quick-recipes"))
                .andExpect(jsonPath("$.ingredients[0].quantity").value(4))
                .andExpect(jsonPath("$.ingredients[0].name").value("달걀"))
                .andExpect(jsonPath("$.selectedIngredients[0]").value("달걀"))
                .andExpect(jsonPath("$.email").doesNotExist())
                .andRespond(withSuccess(RESPONSE, MediaType.APPLICATION_JSON));
        assertThat(service.recommend(7L, request).recipes().getFirst().title()).isEqualTo("달걀 볶음");
        verify(inventory).findByUserIdAndStatusOrderByExpiryDateAsc(7L, LotStatus.ACTIVE);
        server.verify();
    }
    @Test void rejectsOtherUsersOrMissingLotsBeforeAiCall() {
        assertThatThrownBy(() -> service.recommend(8L, request)).isInstanceOf(QuickRecipeException.class)
                .satisfies(error -> assertThat(((QuickRecipeException) error).getStatus()).isEqualTo(400));
        server.verify();
    }
    @Test void rejectsExpiredSelection() {
        var expired = lot(); ReflectionTestUtils.setField(expired, "expiryDate", LocalDate.now().minusDays(1));
        when(inventory.findByUserIdAndStatusOrderByExpiryDateAsc(7L, LotStatus.ACTIVE)).thenReturn(List.of(expired));
        assertThatThrownBy(() -> service.recommend(7L, request)).isInstanceOf(QuickRecipeException.class);
    }
    @Test void forwardsProfileWithoutIdentityAndRejectsRestrictedResult() {
        var provider = mock(UserDietProfileProvider.class);
        when(profiles.getIfAvailable()).thenReturn(provider);
        when(provider.getProfile(7L)).thenReturn(new UserDietProfile("MAINTAIN", null, null, Set.of("땅콩"), Set.of()));
        server.expect(anything()).andExpect(jsonPath("$.userGoal").value("MAINTAIN"))
                .andExpect(jsonPath("$.allergies[0]").value("땅콩"))
                .andRespond(withSuccess(RESPONSE.replace("달걀 볶음", "땅콩 볶음").replace("\"name\":\"달걀\"", "\"name\":\"땅콩\""), MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> service.recommend(7L, request)).isInstanceOf(QuickRecipeException.class);
    }
    @Test void rejectsInvalidSourceAndEmptyResultAndWrongPrecision() {
        for (String response : List.of(RESPONSE.replace("AI_GENERATED", "mock"), "{\"source\":\"AI_GENERATED\",\"recipes\":[]}", RESPONSE.replace("\"quantity\":\"2\"", "\"quantity\":\"0.0001\""))) {
            server.reset(); server.expect(anything()).andRespond(withSuccess(response, MediaType.APPLICATION_JSON));
            assertThatThrownBy(() -> service.recommend(7L, request)).isInstanceOf(QuickRecipeException.class);
        }
    }
    @Test void handlesAiTimeoutWithoutFallback() {
        server.expect(anything()).andRespond(withStatus(HttpStatus.GATEWAY_TIMEOUT));
        assertThatThrownBy(() -> service.recommend(7L, request)).isInstanceOf(QuickRecipeException.class)
                .satisfies(error -> assertThat(((QuickRecipeException) error).getStatus()).isEqualTo(504));
    }
    @Test void handlesConnectionFailureWithoutLeakingDetails() {
        server.expect(anything()).andRespond(withException(new java.net.ConnectException("private-url")));
        assertThatThrownBy(() -> service.recommend(7L, request)).isInstanceOf(QuickRecipeException.class)
                .hasMessageNotContaining("private-url");
    }
    @Test @EnabledIfEnvironmentVariable(named = "MEALFIT_LIVE_AI_URL", matches = ".+")
    void liveFlaskGeminiRecommendationWithoutDatabaseWrites() {
        RestClient client = RestClient.builder().baseUrl(System.getenv("MEALFIT_LIVE_AI_URL"))
                .requestFactory(new org.springframework.http.client.JdkClientHttpRequestFactory(
                        java.net.http.HttpClient.newBuilder().connectTimeout(java.time.Duration.ofSeconds(3)).build()) {{ setReadTimeout(java.time.Duration.ofSeconds(20)); }})
                .build();
        var result = service(client).recommend(7L, new QuickRecipeModels.Request(List.of(1L), 15, 3));
        assertThat(result.source()).isEqualTo("AI_GENERATED");
        assertThat(result.recipes()).hasSize(3);
        System.out.println("LIVE_FLASK_GEMINI_SUCCESS recipes=" + result.recipes().size());
    }
}

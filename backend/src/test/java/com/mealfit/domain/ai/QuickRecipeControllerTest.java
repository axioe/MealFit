package com.mealfit.domain.ai;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.mealfit.support.TestJwt;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class QuickRecipeControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockitoBean QuickRecipeService service;
    @Test void authenticatedUserIsPassedToService() throws Exception {
        when(service.recommend(eq(7L), any())).thenReturn(mapper.readValue(QuickRecipeServiceTest.RESPONSE, QuickRecipeModels.Response.class));
        mvc.perform(post("/api/v1/quick-recipes/recommend").with(TestJwt.user(7L)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"selectedLotIds\":[1],\"maxCookingMinutes\":15,\"recommendationCount\":1}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.source").value("AI_GENERATED"));
        verify(service).recommend(eq(7L), any());
    }
    @Test void anonymousRequestIsRejected() throws Exception {
        mvc.perform(post("/api/v1/quick-recipes/recommend").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }
    @Test void invalidSelectionIsRejected() throws Exception {
        mvc.perform(post("/api/v1/quick-recipes/recommend").with(TestJwt.user(7L)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"selectedLotIds\":[],\"maxCookingMinutes\":16,\"recommendationCount\":3}"))
                .andExpect(status().isBadRequest());
    }
    @Test void upstreamFailureUsesExistingErrorShape() throws Exception {
        when(service.recommend(anyLong(), any())).thenThrow(new QuickRecipeException(504,"QUICK_AI_004","추천 시간이 초과되었습니다."));
        mvc.perform(post("/api/v1/quick-recipes/recommend").with(TestJwt.user(7L)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"selectedLotIds\":[1],\"maxCookingMinutes\":15,\"recommendationCount\":1}"))
                .andExpect(status().isGatewayTimeout()).andExpect(jsonPath("$.code").value("QUICK_AI_004"))
                .andExpect(jsonPath("$.errors").isArray());
    }
    @Test
    @org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable(named = "MEALFIT_LIVE_AI_URL", matches = ".+")
    @SuppressWarnings("unchecked")
    void liveAuthenticatedSpringToFlaskGeminiWithoutDatabaseWrites() throws Exception {
        var inventory = mock(com.mealfit.domain.inventory.InventoryLotRepository.class);
        var lot = com.mealfit.domain.inventory.InventoryLot.builder().userId(7L).ingredientName("달걀")
                .quantity(new java.math.BigDecimal("4")).unit("개")
                .storageLocation(com.mealfit.domain.inventory.StorageLocation.FRIDGE).build();
        org.springframework.test.util.ReflectionTestUtils.setField(lot, "id", 1L);
        when(inventory.findByUserIdAndStatusOrderByExpiryDateAsc(7L, com.mealfit.domain.inventory.LotStatus.ACTIVE))
                .thenReturn(java.util.List.of(lot));
        org.springframework.beans.factory.ObjectProvider<com.mealfit.domain.mealplan.UserDietProfileProvider> profiles = mock(org.springframework.beans.factory.ObjectProvider.class);
        var factory = new org.springframework.http.client.JdkClientHttpRequestFactory(
                java.net.http.HttpClient.newBuilder().connectTimeout(java.time.Duration.ofSeconds(3)).build());
        factory.setReadTimeout(java.time.Duration.ofSeconds(20));
        var client = org.springframework.web.client.RestClient.builder().baseUrl(System.getenv("MEALFIT_LIVE_AI_URL")).requestFactory(factory).build();
        var bridge = new QuickRecipeService(client, inventory, profiles, jakarta.validation.Validation.buildDefaultValidatorFactory().getValidator());
        when(service.recommend(eq(7L), any())).thenAnswer(call -> bridge.recommend(call.getArgument(0), call.getArgument(1)));
        var result = mvc.perform(post("/api/v1/quick-recipes/recommend").with(TestJwt.user(7L)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"selectedLotIds\":[1],\"maxCookingMinutes\":15,\"recommendationCount\":3}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.source").value("AI_GENERATED"))
                .andExpect(jsonPath("$.recipes.length()").value(3)).andReturn();
        String capture = System.getenv("MEALFIT_AI_CAPTURE_PATH");
        if (capture != null) java.nio.file.Files.writeString(java.nio.file.Path.of(capture), result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
        System.out.println("LIVE_SPRING_FLASK_GEMINI_SUCCESS recipes=3");
    }

}

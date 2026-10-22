package com.mealfit.integration;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import com.mealfit.domain.mealplan.*;
import com.mealfit.domain.mealplan.dto.*;
import com.mealfit.support.TestUserFixture;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import javax.sql.DataSource;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest @ActiveProfiles("test")
class InitialRecommendationConcurrencyTest {
    private static final long USER = 91024L;
    @Autowired MealPlanService service;
    @Autowired MealPlanRepository plans;
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;
    @MockitoBean MealPlanAiClient ai;
    private TestUserFixture user;

    @BeforeEach void setup() throws Exception {
        try (var connection = dataSource.getConnection()) {
            assertThat(connection.getMetaData().getURL()).startsWith("jdbc:h2:");
        }
        user = TestUserFixture.create(jdbc, USER);
    }
    @AfterEach void cleanup() {
        if (user == null) return;
        jdbc.update("delete from meal_plans where user_id = ?", USER);
        jdbc.update("delete from recipe_ingredients where recipe_id in (select id from recipes where user_id = ?)", USER);
        jdbc.update("delete from recipe_steps where recipe_id in (select id from recipes where user_id = ?)", USER);
        jdbc.update("delete from recipes where user_id = ?", USER);
        user.close();
    }

    @Test void concurrentFirstRecommendationsLeaveOneDraftPerMeal() throws Exception {
        var aiEntered = new CountDownLatch(2);
        var sequence = new AtomicInteger();
        when(ai.recommend(any())).thenAnswer(call -> {
            aiEntered.countDown();
            aiEntered.await(500, TimeUnit.MILLISECONDS);
            AiMealPlanRequest body = call.getArgument(0);
            return body.mealTypes().stream().map(type -> new AiMealSuggestion(type, type + " 동시첫추천 " + sequence.incrementAndGet(),
                    "통합 검증", 1, 10, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE,
                    List.of(new AiMealSuggestion.Ingredient("동시두부", BigDecimal.ONE, "g")), List.of("익힌다."), "검증")).toList();
        });
        var start = new CountDownLatch(1);
        LocalDate day = LocalDate.of(2030, 1, 1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<MealPlanRecommendResponse> request = () -> {
                start.await();
                return service.recommend(USER, new MealPlanRecommendRequest(day, 1));
            };
            var first = executor.submit(request); var second = executor.submit(request); start.countDown();
            first.get(15, TimeUnit.SECONDS); second.get(15, TimeUnit.SECONDS);
        }
        assertThat(plans.findByUserIdAndPlanDateAndStatusNot(USER, day, MealPlanStatus.CANCELED)).hasSize(3);
    }
}

package com.mealfit;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Flyway 스키마와 JPA 엔티티가 서로 맞는지(ddl-auto: validate) 확인한다. */
@SpringBootTest
@ActiveProfiles("test")
class MealFitApplicationTests {

    @Test
    void contextLoads() {
    }
}

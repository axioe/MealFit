-- MealFit Phase 0 초기 스키마
-- 규칙: 이미 머지된 마이그레이션 파일은 수정하지 않는다. 변경은 V2__설명.sql 처럼 새 파일로 추가한다.
-- 수량 컬럼은 DECIMAL(12,3) (Java BigDecimal), enum 컬럼은 VARCHAR + @Enumerated(STRING)

-- ============================================================
-- 사용자
-- ============================================================
CREATE TABLE users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    updated_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE profiles (
    id                BIGINT      NOT NULL AUTO_INCREMENT,
    user_id           BIGINT      NOT NULL,
    nickname          VARCHAR(50) NOT NULL,
    goal              VARCHAR(20) NOT NULL,
    cooking_time_pref INT         NOT NULL,
    budget_per_meal   INT         NULL,
    created_at        DATETIME(6) NOT NULL,
    updated_at        DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_profiles_user UNIQUE (user_id),
    CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE profile_allergies (
    profile_id BIGINT       NOT NULL,
    allergy    VARCHAR(100) NOT NULL,
    PRIMARY KEY (profile_id, allergy),
    CONSTRAINT fk_profile_allergies_profile FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
);

CREATE TABLE profile_excluded_ingredients (
    profile_id      BIGINT       NOT NULL,
    ingredient_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (profile_id, ingredient_name),
    CONSTRAINT fk_profile_excluded_profile FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
);

CREATE TABLE refresh_tokens (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    token_hash CHAR(64)    NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ============================================================
-- 레시피
-- ============================================================
CREATE TABLE recipes (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NULL, -- NULL = 공용(시드/로컬 대체) 레시피
    name                VARCHAR(100)  NOT NULL,
    description         VARCHAR(500)  NULL,
    serving_size        INT           NOT NULL,
    cook_time_min       INT           NOT NULL,
    calories            DECIMAL(8, 1) NULL,
    protein_g           DECIMAL(8, 1) NULL,
    carbs_g             DECIMAL(8, 1) NULL,
    fat_g               DECIMAL(8, 1) NULL,
    nutrition_estimated BOOLEAN       NOT NULL DEFAULT TRUE,
    source              VARCHAR(20)   NOT NULL, -- AI_GENERATED / LOCAL_FALLBACK / SEED
    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_recipes_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE recipe_steps (
    recipe_id   BIGINT       NOT NULL,
    step_order  INT          NOT NULL,
    description VARCHAR(500) NOT NULL,
    PRIMARY KEY (recipe_id, step_order),
    CONSTRAINT fk_recipe_steps_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
);

CREATE TABLE recipe_ingredients (
    id              BIGINT         NOT NULL AUTO_INCREMENT,
    recipe_id       BIGINT         NOT NULL,
    ingredient_name VARCHAR(100)   NOT NULL,
    required_qty    DECIMAL(12, 3) NOT NULL,
    unit            VARCHAR(20)    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_recipe_ingredients_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
);

-- ============================================================
-- 냉장고 / 장보기
-- ============================================================
CREATE TABLE inventory_lots (
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    user_id          BIGINT         NOT NULL,
    ingredient_name  VARCHAR(100)   NOT NULL,
    quantity         DECIMAL(12, 3) NOT NULL,
    unit             VARCHAR(20)    NOT NULL,
    expiry_date      DATE           NULL, -- NULL = 기한 미등록
    storage_location VARCHAR(20)    NOT NULL,
    min_stock_qty    DECIMAL(12, 3) NOT NULL DEFAULT 0,
    status           VARCHAR(20)    NOT NULL, -- ACTIVE / DEPLETED / DISPOSED
    memo             VARCHAR(255)   NULL,
    created_at       DATETIME(6)    NOT NULL,
    updated_at       DATETIME(6)    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_inventory_lots_user FOREIGN KEY (user_id) REFERENCES users (id)
);
CREATE INDEX idx_inventory_lots_user_ingredient ON inventory_lots (user_id, ingredient_name);

CREATE TABLE shopping_items (
    id              BIGINT         NOT NULL AUTO_INCREMENT,
    user_id         BIGINT         NOT NULL,
    ingredient_name VARCHAR(100)   NOT NULL,
    required_qty    DECIMAL(12, 3) NOT NULL,
    purchased_qty   DECIMAL(12, 3) NOT NULL DEFAULT 0,
    unit            VARCHAR(20)    NOT NULL,
    status          VARCHAR(20)    NOT NULL, -- NEEDED / PARTIAL / PURCHASED
    created_at      DATETIME(6)    NOT NULL,
    updated_at      DATETIME(6)    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_shopping_items_user FOREIGN KEY (user_id) REFERENCES users (id)
);
CREATE INDEX idx_shopping_items_user_status ON shopping_items (user_id, status);

-- ============================================================
-- 식단 / 조리 / 섭취
-- ============================================================
CREATE TABLE meal_plans (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    user_id               BIGINT       NOT NULL,
    plan_date             DATE         NOT NULL,
    meal_type             VARCHAR(20)  NOT NULL, -- BREAKFAST / LUNCH / DINNER
    recipe_id             BIGINT       NOT NULL,
    servings              INT          NOT NULL DEFAULT 1,
    status                VARCHAR(20)  NOT NULL, -- DRAFT / CONFIRMED / CANCELED
    recommendation_reason VARCHAR(500) NULL,
    created_at            DATETIME(6)  NOT NULL,
    updated_at            DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_meal_plans_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_meal_plans_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (id)
);
CREATE INDEX idx_meal_plans_user_date ON meal_plans (user_id, plan_date);

CREATE TABLE cooking_events (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    user_id      BIGINT      NOT NULL,
    recipe_id    BIGINT      NOT NULL,
    meal_plan_id BIGINT      NOT NULL,
    servings     INT         NOT NULL,
    status       VARCHAR(20) NOT NULL, -- COOKED / RESTORED
    cooked_at    DATETIME(6) NOT NULL,
    restored_at  DATETIME(6) NULL,
    created_at   DATETIME(6) NOT NULL,
    updated_at   DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_cooking_events_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_cooking_events_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (id),
    CONSTRAINT fk_cooking_events_meal_plan FOREIGN KEY (meal_plan_id) REFERENCES meal_plans (id)
);

CREATE TABLE inventory_transactions (
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    user_id          BIGINT         NOT NULL,
    lot_id           BIGINT         NOT NULL,
    cooking_event_id BIGINT         NULL,
    type             VARCHAR(20)    NOT NULL, -- STOCK_IN / COOK_DEDUCT / COOK_RESTORE / ADJUST / DISPOSE
    qty_change       DECIMAL(12, 3) NOT NULL, -- 증가 +, 감소 -
    memo             VARCHAR(255)   NULL,
    created_at       DATETIME(6)    NOT NULL,
    updated_at       DATETIME(6)    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_inventory_tx_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_inventory_tx_lot FOREIGN KEY (lot_id) REFERENCES inventory_lots (id),
    CONSTRAINT fk_inventory_tx_cooking_event FOREIGN KEY (cooking_event_id) REFERENCES cooking_events (id)
);
CREATE INDEX idx_inventory_tx_lot ON inventory_transactions (lot_id);

CREATE TABLE intake_logs (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    user_id       BIGINT      NOT NULL,
    meal_plan_id  BIGINT      NOT NULL,
    intake_status VARCHAR(20) NOT NULL, -- PLANNED / EATEN / SKIPPED
    logged_at     DATETIME(6) NOT NULL,
    created_at    DATETIME(6) NOT NULL,
    updated_at    DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_intake_logs_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_intake_logs_meal_plan FOREIGN KEY (meal_plan_id) REFERENCES meal_plans (id)
);
CREATE INDEX idx_intake_logs_meal_plan ON intake_logs (meal_plan_id);

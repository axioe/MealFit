-- 기존 프로필·회원 데이터는 유지하고 추가 설정만 별도 테이블로 관리합니다.
CREATE TABLE profile_details (
    profile_id BIGINT NOT NULL,
    age INT NULL,
    height DECIMAL(4,1) NULL,
    current_weight DECIMAL(4,1) NULL,
    target_weight DECIMAL(4,1) NULL,
    gender VARCHAR(30) NULL,
    activity_level VARCHAR(30) NULL,
    workout_goal VARCHAR(30) NULL,
    workout_level VARCHAR(30) NULL,
    environment VARCHAR(30) NULL,
    workout_minutes INT NULL,
    days_per_week INT NULL,
    diet_type VARCHAR(30) NULL,
    default_servings INT NULL,
    prioritize_fridge BOOLEAN NOT NULL DEFAULT FALSE,
    resting_heart_rate INT NULL,
    pushups INT NULL,
    squat30s INT NULL,
    plank_seconds INT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (profile_id),
    CONSTRAINT fk_profile_details_profile FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
);

CREATE TABLE profile_detail_equipment (
    profile_id BIGINT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (profile_id, item_name),
    CONSTRAINT fk_detail_equipment FOREIGN KEY (profile_id) REFERENCES profile_details (profile_id) ON DELETE CASCADE
);

CREATE TABLE profile_detail_injuries (
    profile_id BIGINT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (profile_id, item_name),
    CONSTRAINT fk_detail_injuries FOREIGN KEY (profile_id) REFERENCES profile_details (profile_id) ON DELETE CASCADE
);

CREATE TABLE profile_detail_preferred_foods (
    profile_id BIGINT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (profile_id, item_name),
    CONSTRAINT fk_detail_preferred_foods FOREIGN KEY (profile_id) REFERENCES profile_details (profile_id) ON DELETE CASCADE
);

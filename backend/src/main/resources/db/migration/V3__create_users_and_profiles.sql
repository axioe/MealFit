CREATE TABLE users (
                     id              BIGINT       NOT NULL AUTO_INCREMENT,
                     email           VARCHAR(254) NOT NULL,
                     password_hash   VARCHAR(100) NOT NULL,
                     created_at      DATETIME(6)  NOT NULL,
                     updated_at      DATETIME(6)  NOT NULL,
                     PRIMARY KEY (id),
                     CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE profiles (
                        id              BIGINT      NOT NULL AUTO_INCREMENT,
                        user_id         BIGINT      NOT NULL,
                        nickname        VARCHAR(50) NOT NULL,
                        goal            VARCHAR(20) NULL,
                        cook_time_min   INT         NULL,
                        meal_budget     INT         NULL,
                        created_at      DATETIME(6) NOT NULL,
                        updated_at      DATETIME(6) NOT NULL,
                        PRIMARY KEY (id),
                        CONSTRAINT uk_profiles_user UNIQUE (user_id),
                        CONSTRAINT fk_profiles_user
                          FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE profile_allergies (
                                 profile_id      BIGINT       NOT NULL,
                                 ingredient_name VARCHAR(100) NOT NULL,
                                 PRIMARY KEY (profile_id, ingredient_name),
                                 CONSTRAINT fk_profile_allergies_profile
                                   FOREIGN KEY (profile_id) REFERENCES profiles (id)
);

CREATE TABLE profile_excluded_ingredients (
                                            profile_id      BIGINT       NOT NULL,
                                            ingredient_name VARCHAR(100) NOT NULL,
                                            PRIMARY KEY (profile_id, ingredient_name),
                                            CONSTRAINT fk_profile_excluded_profile
                                              FOREIGN KEY (profile_id) REFERENCES profiles (id)
);

-- 식단 없이 재료 목록만으로 조리 차감 (15분 요리 등)
-- recipe_id·meal_plan_id는 식단 기반 조리에만 채우고, 메뉴 이름은 recipe_name에 따로 남긴다.
-- client_request_id: 같은 조리 요청을 다시 보내도 한 번만 차감하기 위한 키 (식단 없는 조리만 사용)
-- H2(테스트)에서도 돌도록 문장을 하나씩 나눠 쓴다.

ALTER TABLE cooking_events MODIFY recipe_id BIGINT NULL;
ALTER TABLE cooking_events MODIFY meal_plan_id BIGINT NULL;

ALTER TABLE cooking_events ADD COLUMN recipe_name VARCHAR(100) NULL;
UPDATE cooking_events
SET recipe_name = (SELECT recipes.name FROM recipes WHERE recipes.id = cooking_events.recipe_id);
ALTER TABLE cooking_events MODIFY recipe_name VARCHAR(100) NOT NULL;

ALTER TABLE cooking_events ADD COLUMN client_request_id VARCHAR(36) NULL;
CREATE UNIQUE INDEX uk_cooking_events_user_request ON cooking_events (user_id, client_request_id);

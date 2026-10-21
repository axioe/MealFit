-- 검증된 로컬 대체(LOCAL_FALLBACK) 레시피
-- AI 호출이 실패하거나 AI 제안이 서버 검증을 통과하지 못하면 이 레시피로 식단을 채운다.
-- 영양 정보는 근거 자료가 없는 추정치다(nutrition_estimated = TRUE).

-- 로컬 대체 후보로 쓸 끼니. NULL이면 모든 끼니에 쓸 수 있다.
ALTER TABLE recipes ADD COLUMN meal_type VARCHAR(20) NULL;

-- BREAKFAST · 달걀 토스트
INSERT INTO recipes (user_id, name, description, serving_size, cook_time_min, calories, protein_g, carbs_g, fat_g, nutrition_estimated, source, meal_type, created_at, updated_at)
VALUES (NULL, '달걀 토스트', '식빵에 달걀을 올려 굽는 간단한 아침', 1, 10, 380.0, 18.0, 38.0, 16.0, TRUE, 'LOCAL_FALLBACK', 'BREAKFAST', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '식빵', 2, '장' FROM recipes WHERE name = '달걀 토스트' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '달걀', 2, '개' FROM recipes WHERE name = '달걀 토스트' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '버터', 10, 'g' FROM recipes WHERE name = '달걀 토스트' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '양상추', 20, 'g' FROM recipes WHERE name = '달걀 토스트' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 0, '팬에 버터를 녹이고 식빵 두 장을 노릇하게 굽는다.' FROM recipes WHERE name = '달걀 토스트' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 1, '같은 팬에 달걀 두 개를 부쳐 반숙으로 익힌다.' FROM recipes WHERE name = '달걀 토스트' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 2, '식빵 위에 양상추와 달걀을 올려 완성한다.' FROM recipes WHERE name = '달걀 토스트' AND source = 'LOCAL_FALLBACK';

-- BREAKFAST · 그릭요거트 과일 볼
INSERT INTO recipes (user_id, name, description, serving_size, cook_time_min, calories, protein_g, carbs_g, fat_g, nutrition_estimated, source, meal_type, created_at, updated_at)
VALUES (NULL, '그릭요거트 과일 볼', '과일과 귀리를 곁들인 요거트 아침', 1, 5, 320.0, 17.0, 42.0, 9.0, TRUE, 'LOCAL_FALLBACK', 'BREAKFAST', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '그릭요거트', 150, 'g' FROM recipes WHERE name = '그릭요거트 과일 볼' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '바나나', 1, '개' FROM recipes WHERE name = '그릭요거트 과일 볼' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '블루베리', 50, 'g' FROM recipes WHERE name = '그릭요거트 과일 볼' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '귀리', 30, 'g' FROM recipes WHERE name = '그릭요거트 과일 볼' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 0, '바나나를 한입 크기로 썬다.' FROM recipes WHERE name = '그릭요거트 과일 볼' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 1, '그릇에 그릭요거트를 담는다.' FROM recipes WHERE name = '그릭요거트 과일 볼' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 2, '바나나, 블루베리, 귀리를 올려 완성한다.' FROM recipes WHERE name = '그릭요거트 과일 볼' AND source = 'LOCAL_FALLBACK';

-- BREAKFAST · 두부 달걀 스크램블
INSERT INTO recipes (user_id, name, description, serving_size, cook_time_min, calories, protein_g, carbs_g, fat_g, nutrition_estimated, source, meal_type, created_at, updated_at)
VALUES (NULL, '두부 달걀 스크램블', '두부와 달걀로 만드는 단백질 아침', 1, 10, 300.0, 24.0, 6.0, 19.0, TRUE, 'LOCAL_FALLBACK', 'BREAKFAST', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '두부', 150, 'g' FROM recipes WHERE name = '두부 달걀 스크램블' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '달걀', 2, '개' FROM recipes WHERE name = '두부 달걀 스크램블' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '대파', 20, 'g' FROM recipes WHERE name = '두부 달걀 스크램블' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '식용유', 5, 'ml' FROM recipes WHERE name = '두부 달걀 스크램블' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 0, '두부의 물기를 빼고 으깬다.' FROM recipes WHERE name = '두부 달걀 스크램블' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 1, '대파를 송송 썬다.' FROM recipes WHERE name = '두부 달걀 스크램블' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 2, '팬에 식용유를 두르고 두부를 볶다가 달걀을 풀어 넣는다.' FROM recipes WHERE name = '두부 달걀 스크램블' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 3, '대파를 넣고 달걀이 익을 때까지 저어 완성한다.' FROM recipes WHERE name = '두부 달걀 스크램블' AND source = 'LOCAL_FALLBACK';

-- LUNCH · 닭가슴살 샐러드
INSERT INTO recipes (user_id, name, description, serving_size, cook_time_min, calories, protein_g, carbs_g, fat_g, nutrition_estimated, source, meal_type, created_at, updated_at)
VALUES (NULL, '닭가슴살 샐러드', '닭가슴살과 채소로 만드는 가벼운 점심', 1, 15, 350.0, 38.0, 12.0, 15.0, TRUE, 'LOCAL_FALLBACK', 'LUNCH', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '닭가슴살', 150, 'g' FROM recipes WHERE name = '닭가슴살 샐러드' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '양상추', 100, 'g' FROM recipes WHERE name = '닭가슴살 샐러드' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '방울토마토', 80, 'g' FROM recipes WHERE name = '닭가슴살 샐러드' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '올리브유', 10, 'ml' FROM recipes WHERE name = '닭가슴살 샐러드' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 0, '닭가슴살을 팬에 앞뒤로 7분 정도 굽는다.' FROM recipes WHERE name = '닭가슴살 샐러드' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 1, '양상추는 한입 크기로 뜯고 방울토마토는 반으로 자른다.' FROM recipes WHERE name = '닭가슴살 샐러드' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 2, '구운 닭가슴살을 썰어 채소 위에 올리고 올리브유를 뿌린다.' FROM recipes WHERE name = '닭가슴살 샐러드' AND source = 'LOCAL_FALLBACK';

-- LUNCH · 참치 김치볶음밥
INSERT INTO recipes (user_id, name, description, serving_size, cook_time_min, calories, protein_g, carbs_g, fat_g, nutrition_estimated, source, meal_type, created_at, updated_at)
VALUES (NULL, '참치 김치볶음밥', '김치와 참치로 만드는 한 그릇 점심', 1, 15, 620.0, 28.0, 78.0, 20.0, TRUE, 'LOCAL_FALLBACK', 'LUNCH', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '밥', 210, 'g' FROM recipes WHERE name = '참치 김치볶음밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '김치', 80, 'g' FROM recipes WHERE name = '참치 김치볶음밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '참치캔', 1, '캔' FROM recipes WHERE name = '참치 김치볶음밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '달걀', 1, '개' FROM recipes WHERE name = '참치 김치볶음밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '식용유', 10, 'ml' FROM recipes WHERE name = '참치 김치볶음밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 0, '김치를 잘게 썰고 참치는 기름을 뺀다.' FROM recipes WHERE name = '참치 김치볶음밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 1, '팬에 식용유를 두르고 김치를 2분 볶는다.' FROM recipes WHERE name = '참치 김치볶음밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 2, '밥과 참치를 넣고 고루 볶는다.' FROM recipes WHERE name = '참치 김치볶음밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 3, '달걀 프라이를 올려 완성한다.' FROM recipes WHERE name = '참치 김치볶음밥' AND source = 'LOCAL_FALLBACK';

-- LUNCH · 소고기 버섯 덮밥
INSERT INTO recipes (user_id, name, description, serving_size, cook_time_min, calories, protein_g, carbs_g, fat_g, nutrition_estimated, source, meal_type, created_at, updated_at)
VALUES (NULL, '소고기 버섯 덮밥', '간장 양념 소고기와 버섯을 올린 덮밥', 1, 20, 580.0, 30.0, 75.0, 15.0, TRUE, 'LOCAL_FALLBACK', 'LUNCH', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '밥', 210, 'g' FROM recipes WHERE name = '소고기 버섯 덮밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '소고기', 100, 'g' FROM recipes WHERE name = '소고기 버섯 덮밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '표고버섯', 50, 'g' FROM recipes WHERE name = '소고기 버섯 덮밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '양파', 50, 'g' FROM recipes WHERE name = '소고기 버섯 덮밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '간장', 15, 'ml' FROM recipes WHERE name = '소고기 버섯 덮밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 0, '양파와 표고버섯을 얇게 썬다.' FROM recipes WHERE name = '소고기 버섯 덮밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 1, '팬에 소고기를 볶다가 양파와 버섯을 넣는다.' FROM recipes WHERE name = '소고기 버섯 덮밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 2, '간장을 넣고 국물이 자작해질 때까지 졸인다.' FROM recipes WHERE name = '소고기 버섯 덮밥' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 3, '밥 위에 올려 완성한다.' FROM recipes WHERE name = '소고기 버섯 덮밥' AND source = 'LOCAL_FALLBACK';

-- DINNER · 연어 스테이크
INSERT INTO recipes (user_id, name, description, serving_size, cook_time_min, calories, protein_g, carbs_g, fat_g, nutrition_estimated, source, meal_type, created_at, updated_at)
VALUES (NULL, '연어 스테이크', '버터에 구운 연어와 아스파라거스', 1, 20, 450.0, 32.0, 8.0, 31.0, TRUE, 'LOCAL_FALLBACK', 'DINNER', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '연어', 150, 'g' FROM recipes WHERE name = '연어 스테이크' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '아스파라거스', 80, 'g' FROM recipes WHERE name = '연어 스테이크' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '버터', 10, 'g' FROM recipes WHERE name = '연어 스테이크' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '레몬즙', 10, 'ml' FROM recipes WHERE name = '연어 스테이크' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 0, '연어의 물기를 키친타월로 닦는다.' FROM recipes WHERE name = '연어 스테이크' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 1, '팬에 버터를 녹이고 연어를 앞뒤로 4분씩 굽는다.' FROM recipes WHERE name = '연어 스테이크' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 2, '같은 팬에 아스파라거스를 3분 굽는다.' FROM recipes WHERE name = '연어 스테이크' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 3, '접시에 담고 레몬즙을 뿌려 완성한다.' FROM recipes WHERE name = '연어 스테이크' AND source = 'LOCAL_FALLBACK';

-- DINNER · 두부 된장찌개
INSERT INTO recipes (user_id, name, description, serving_size, cook_time_min, calories, protein_g, carbs_g, fat_g, nutrition_estimated, source, meal_type, created_at, updated_at)
VALUES (NULL, '두부 된장찌개', '두부와 채소를 넣은 된장찌개', 1, 25, 280.0, 18.0, 25.0, 11.0, TRUE, 'LOCAL_FALLBACK', 'DINNER', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '두부', 150, 'g' FROM recipes WHERE name = '두부 된장찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '애호박', 100, 'g' FROM recipes WHERE name = '두부 된장찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '감자', 100, 'g' FROM recipes WHERE name = '두부 된장찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '양파', 50, 'g' FROM recipes WHERE name = '두부 된장찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '된장', 30, 'g' FROM recipes WHERE name = '두부 된장찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 0, '감자, 애호박, 양파, 두부를 한입 크기로 썬다.' FROM recipes WHERE name = '두부 된장찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 1, '냄비에 물 400ml와 된장을 풀어 끓인다.' FROM recipes WHERE name = '두부 된장찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 2, '감자를 먼저 넣고 5분 끓인 뒤 애호박과 양파를 넣는다.' FROM recipes WHERE name = '두부 된장찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 3, '두부를 넣고 5분 더 끓여 완성한다.' FROM recipes WHERE name = '두부 된장찌개' AND source = 'LOCAL_FALLBACK';

-- DINNER · 돼지고기 김치찌개
INSERT INTO recipes (user_id, name, description, serving_size, cook_time_min, calories, protein_g, carbs_g, fat_g, nutrition_estimated, source, meal_type, created_at, updated_at)
VALUES (NULL, '돼지고기 김치찌개', '돼지고기와 김치로 끓인 찌개', 1, 25, 420.0, 26.0, 15.0, 28.0, TRUE, 'LOCAL_FALLBACK', 'DINNER', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '돼지고기', 100, 'g' FROM recipes WHERE name = '돼지고기 김치찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '김치', 150, 'g' FROM recipes WHERE name = '돼지고기 김치찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '두부', 100, 'g' FROM recipes WHERE name = '돼지고기 김치찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, required_qty, unit) SELECT id, '대파', 20, 'g' FROM recipes WHERE name = '돼지고기 김치찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 0, '돼지고기와 김치를 한입 크기로 썬다.' FROM recipes WHERE name = '돼지고기 김치찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 1, '냄비에 돼지고기를 볶다가 김치를 넣고 3분 더 볶는다.' FROM recipes WHERE name = '돼지고기 김치찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 2, '물 400ml를 붓고 10분 끓인다.' FROM recipes WHERE name = '돼지고기 김치찌개' AND source = 'LOCAL_FALLBACK';
INSERT INTO recipe_steps (recipe_id, step_order, description) SELECT id, 3, '두부와 대파를 넣고 5분 더 끓여 완성한다.' FROM recipes WHERE name = '돼지고기 김치찌개' AND source = 'LOCAL_FALLBACK';

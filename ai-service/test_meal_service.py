import copy
import json
import unittest
from datetime import date
from unittest.mock import patch
from app import create_app, generate_meals
from errors import ServiceError
from meal_recommendation import SYSTEM_PROMPT, RESPONSE_SCHEMA


def request_body(types=None):
    return {'planDate': '2026-10-23', 'mealTypes': types or ['BREAKFAST', 'LUNCH', 'DINNER'],
        'servings': 2, 'goal': 'LOSE', 'cookTimeMin': 20, 'mealBudget': 8000,
        'allergies': ['땅콩'], 'excludedIngredients': ['새우'], 'keptMeals': [], 'recentMeals': ['어제 메뉴'],
        'inventory': [{'ingredientName': '두부', 'quantity': 300, 'unit': 'g', 'expiryDate': '2026-10-23', 'expirationStatus': 'IMMINENT'}]}


def response_body(types=None):
    return [{'mealType': kind, 'recipeName': kind + ' 두부 요리', 'description': '보유 재료 활용',
        'servingSize': 2, 'cookTimeMin': 15, 'calories': '600', 'proteinG': '40.1', 'carbsG': '50', 'fatG': '20',
        'ingredients': [{'name': '두부', 'quantity': '300.125', 'unit': 'g'}],
        'steps': ['두부를 준비하고 충분히 익힙니다.'], 'reason': '소비기한 임박 재료 활용'}
        for kind in types or ['BREAKFAST', 'LUNCH', 'DINNER']]


class MealServiceTest(unittest.TestCase):
    def setUp(self):
        self.body = request_body()
        self.result = response_body()
        self.received = []

        def generator(body, key, model):
            self.received.append(body)
            return json.dumps(self.result, ensure_ascii=False)

        self.app = create_app({'TESTING': True, 'GEMINI_API_KEY': '', 'MEAL_GENERATOR': generator,
                               'TODAY': lambda: date(2026, 10, 22)})
        self.client = self.app.test_client()

    def post(self):
        return self.client.post('/ai/meal-plans', json=self.body)

    def test_three_meals_and_profile_inventory_forwarded(self):
        response = self.post()
        self.assertEqual(response.status_code, 200)
        self.assertEqual([row['mealType'] for row in response.json], self.body['mealTypes'])
        self.assertEqual(response.json[0]['ingredients'][0]['quantity'], '300.125')
        self.assertEqual(self.received[0]['goal'], 'LOSE')
        self.assertEqual(self.received[0]['mealBudget'], 8000)
        self.assertEqual(self.received[0]['inventory'][0]['expirationStatus'], 'IMMINENT')
        self.assertIn('영양값은 AI 추정치', SYSTEM_PROMPT)

    def test_single_meal_regeneration(self):
        self.body['mealTypes'] = ['LUNCH']
        self.result = response_body(['LUNCH'])
        self.assertEqual(self.post().json[0]['mealType'], 'LUNCH')

    def test_two_requested_meals_keep_confirmed_meal(self):
        self.body['mealTypes'] = ['BREAKFAST', 'DINNER']
        self.body['keptMeals'] = ['확정 점심']
        self.result = response_body(['DINNER', 'BREAKFAST'])
        self.assertEqual([row['mealType'] for row in self.post().json], self.body['mealTypes'])

    def test_empty_inventory_and_optional_profile_supported(self):
        self.body.update(inventory=[], goal=None, cookTimeMin=None, mealBudget=None)
        self.assertEqual(self.post().status_code, 200)

    def test_expiry_before_planned_date_removed_without_unit_conversion(self):
        self.body['inventory'][0].update(expiryDate='2026-10-22', expirationStatus='TODAY')
        self.body['inventory'].append(dict(self.body['inventory'][0], ingredientName='양파', quantity=4, unit='개', expiryDate=None, expirationStatus='UNKNOWN'))
        self.assertEqual(self.post().status_code, 200)
        self.assertEqual(self.received[0]['inventory'], [dict(self.body['inventory'][1], quantity='4')])

    def test_missing_fields_and_private_identity_rejected(self):
        for field in ('planDate', 'mealTypes', 'servings', 'inventory'):
            with self.subTest(field=field):
                self.body = request_body()
                del self.body[field]
                self.assertEqual(self.post().status_code, 400)
        self.body = dict(request_body(), userId=7)
        self.assertEqual(self.post().status_code, 400)
        self.assertEqual(self.received, [])

    def test_duplicate_and_unknown_requested_meals_rejected(self):
        for types in ([], ['LUNCH', 'LUNCH'], ['SNACK']):
            self.body['mealTypes'] = types
            self.assertEqual(self.post().status_code, 400)

    def test_bad_date_servings_and_stock_precision_rejected(self):
        for field, value in (('planDate', '2026-02-30'), ('servings', 0), ('servings', True), ('servings', 11)):
            self.body = dict(request_body(), **{field: value})
            self.assertEqual(self.post().status_code, 400)
        self.body = request_body()
        self.body['inventory'][0]['quantity'] = '0.0001'
        self.assertEqual(self.post().status_code, 400)

    def test_missing_duplicate_or_unrequested_response_meals_rejected(self):
        for result in (response_body()[:2], [response_body()[0]] * 3, [dict(row, mealType='SNACK') for row in response_body()]):
            self.result = result
            self.assertEqual(self.post().status_code, 502)

    def test_restricted_ingredient_rejected(self):
        for name in ('땅콩 소스', '새우살'):
            self.result[0]['ingredients'][0]['name'] = name
            self.assertEqual(self.post().json['code'], 'AI_004')

    def test_kept_and_duplicate_names_rejected(self):
        self.body['keptMeals'] = [self.result[0]['recipeName']]
        self.assertEqual(self.post().status_code, 502)
        self.body['keptMeals'] = []
        self.result[1]['recipeName'] = self.result[0]['recipeName']
        self.assertEqual(self.post().status_code, 502)

    def test_invalid_quantity_nutrition_steps_and_time_rejected(self):
        original = response_body()
        for field, value in (('calories', '-1'), ('proteinG', 'NaN'), ('proteinG', '1.23'),
                             ('calories', '10000000'), ('steps', []), ('cookTimeMin', 21), ('servingSize', 1)):
            self.result = copy.deepcopy(original)
            self.result[0][field] = value
            self.assertEqual(self.post().status_code, 502)
        for value in ('0', '0.0001', '100001'):
            self.result = copy.deepcopy(original)
            self.result[0]['ingredients'][0]['quantity'] = value
            self.assertEqual(self.post().status_code, 502)

    def test_malformed_json_response_and_empty_result(self):
        for raw in ('not json', '{}', '[]', 'null'):
            self.app.config['MEAL_GENERATOR'] = lambda *args: raw
            self.assertEqual(self.post().status_code, 502)

    def test_timeout_uses_existing_error_contract(self):
        def timeout(*args):
            raise ServiceError(504, 'AI_005', 'AI 추천 응답 시간이 초과되었습니다. 다시 시도해 주세요.')
        self.app.config['MEAL_GENERATOR'] = timeout
        response = self.post()
        self.assertEqual(response.status_code, 504)
        self.assertEqual(response.json['code'], 'AI_005')

    def test_daily_generator_reuses_sdk_with_distinct_schema(self):
        with patch('app.generate', return_value='[]') as generate:
            self.assertEqual(generate_meals(self.body, '', 'model'), '[]')
            self.assertEqual(generate.call_args.kwargs['system_prompt'], SYSTEM_PROMPT)
            self.assertEqual(generate.call_args.kwargs['response_schema'], RESPONSE_SCHEMA)

    def test_content_type_and_invalid_json(self):
        self.assertEqual(self.client.post('/ai/meal-plans', data='{}').status_code, 415)
        self.assertEqual(self.client.post('/ai/meal-plans', data='{', content_type='application/json').status_code, 400)


if __name__ == '__main__':
    unittest.main()

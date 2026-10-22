import copy
import json
import unittest
from datetime import date
from unittest.mock import patch, MagicMock
from httpx import ReadTimeout
from app import create_app
from gemini_client import generate
from errors import ServiceError
from recommendation import validate_response
from validation import validate_request

TODAY = date(2026, 10, 22)
BODY = {'ingredients': [{'name': '달걀', 'quantity': 4, 'unit': '개', 'expirationDate': '2026-10-25'},
                         {'name': '양파', 'quantity': '0.3', 'unit': 'kg'}],
        'selectedIngredients': ['달걀'], 'maxCookingMinutes': 15, 'recommendationCount': 1}
RESPONSE = {'recipes': [{'title': '달걀 양파 볶음', 'description': '간단한 볶음 요리', 'cookingMinutes': 10,
                        'servings': 1, 'ingredients': [{'name': '달걀', 'quantity': '2', 'unit': '개'},
                                                     {'name': '양파', 'quantity': '50', 'unit': 'g'}],
                        'steps': ['양파를 썰어 주세요.', '달걀과 함께 충분히 익혀 주세요.'], 'reason': '보유 재료 활용'}]}


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.calls = []
        def fake(request, key, model):
            self.calls.append(request)
            return json.dumps(RESPONSE, ensure_ascii=False)
        self.app = create_app({'TESTING': True, 'GEMINI_API_KEY': '', 'GENERATOR': fake, 'TODAY': lambda: TODAY})
        self.client = self.app.test_client()

    def send(self, body):
        return self.client.post('/ai/quick-recipes', data=json.dumps(body, ensure_ascii=False), content_type='application/json')

    def test_health_without_gemini(self):
        self.assertEqual(self.client.get('/health').json, {'status': 'ok', 'service': 'mealfit-ai'})
        self.assertFalse(self.calls)

    def test_success_and_exact_unit_conversion(self):
        response = self.send(BODY)
        self.assertEqual(response.status_code, 200)
        onion = response.json['recipes'][0]['ingredients'][1]
        self.assertEqual(onion['inventory']['quantity'], '300')
        self.assertEqual(onion['inventory']['unit'], 'g')
        self.assertEqual(response.json['source'], 'AI_GENERATED')

    def test_invalid_json(self):
        self.assertEqual(self.client.post('/ai/quick-recipes', data='{', content_type='application/json').status_code, 400)

    def test_wrong_content_type(self):
        self.assertEqual(self.client.post('/ai/quick-recipes', data='{}').status_code, 415)

    def test_invalid_input_cases(self):
        for field, value in [('ingredients', []), ('selectedIngredients', []), ('selectedIngredients', ['없는 재료']),
                             ('recommendationCount', 6), ('recommendationCount', True), ('maxCookingMinutes', 16), ('maxCookingMinutes', 0)]:
            with self.subTest(field=field, value=value):
                body = copy.deepcopy(BODY); body[field] = value
                self.assertEqual(self.send(body).status_code, 400)
        self.assertFalse(self.calls)

    def test_invalid_ingredient_cases(self):
        for field, value in [('name', ''), ('quantity', 0), ('quantity', -1), ('quantity', True), ('quantity', '0.0001'),
                             ('quantity', '1000000000'), ('unit', ''), ('unit', 'x' * 21), ('expirationDate', '2026-02-30')]:
            with self.subTest(field=field, value=value):
                body = copy.deepcopy(BODY); body['ingredients'][0][field] = value
                self.assertEqual(self.send(body).status_code, 400)

    def test_decimal_number_precision(self):
        raw = json.dumps(BODY).replace('"quantity": 4', '"quantity": 0.125')
        response = self.client.post('/ai/quick-recipes', data=raw, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.calls[0]['ingredients'][0]['quantity'], '0.125')

    def test_expired_excluded_and_today_included(self):
        body = copy.deepcopy(BODY); body['ingredients'][0]['expirationDate'] = '2026-10-21'
        self.assertEqual(self.send(body).status_code, 400)
        body['selectedIngredients'] = ['양파']; self.send(body)
        self.assertEqual([item['name'] for item in self.calls[-1]['ingredients']], ['양파'])
        body['ingredients'][0]['expirationDate'] = '2026-10-22'; self.send(body)
        self.assertEqual(len(self.calls[-1]['ingredients']), 2)

    def test_count_and_time_and_steps_and_quantity_validated(self):
        for edit in [lambda x: x.update(recipes=[]), lambda x: x['recipes'][0].update(cookingMinutes=16),
                     lambda x: x['recipes'][0].update(steps=[]), lambda x: x['recipes'][0]['ingredients'][0].update(quantity='0'),
                     lambda x: x['recipes'][0].update(servings=True)]:
            response = copy.deepcopy(RESPONSE); edit(response)
            self.app.config['GENERATOR'] = lambda *_: json.dumps(response)
            self.assertEqual(self.send(BODY).status_code, 502)

    def test_missing_ingredient_and_unit_mismatch(self):
        response = copy.deepcopy(RESPONSE)
        response['recipes'][0]['ingredients'][0]['unit'] = 'g'
        response['recipes'][0]['ingredients'].append({'name': '치즈', 'quantity': '1', 'unit': '장'})
        result = validate_response(json.dumps(response), validate_request(BODY, TODAY))
        items = result['recipes'][0]['ingredients']
        self.assertEqual(items[0]['inventory']['status'], 'UNIT_MISMATCH')
        self.assertIsNone(items[0]['inventory']['shortageQuantity'])
        self.assertEqual(items[2]['inventory']['status'], 'NONE')

    def test_allergy_and_exclusions(self):
        for field in ['allergies', 'excludedIngredients']:
            body = copy.deepcopy(BODY); body[field] = ['달걀']
            self.assertEqual(self.send(body).status_code, 502)

    def test_invalid_ai_json(self):
        self.app.config['GENERATOR'] = lambda *_: '비밀 예외 내용'
        response = self.send(BODY)
        self.assertEqual(response.status_code, 502)
        self.assertNotIn('비밀', response.get_data(as_text=True))

    def test_error_format_does_not_leak(self):
        def fail(*_):
            raise RuntimeError('secret-value')
        self.app.config['GENERATOR'] = fail
        response = self.send(BODY)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(set(response.json), {'status', 'code', 'message', 'errors', 'timestamp'})
        self.assertNotIn('secret-value', response.get_data(as_text=True))

    def test_missing_key(self):
        self.app.config['GENERATOR'] = generate
        response = self.send(BODY)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json['code'], 'AI_002')

    @patch('gemini_client.genai.Client')
    def test_sdk_structured_output_and_timeout_config(self, client):
        context = MagicMock(); client.return_value.__enter__.return_value = context
        context.models.generate_content.return_value.text = json.dumps(RESPONSE)
        generate(validate_request(BODY, TODAY), 'test-only', 'gemini-3.8-flash')
        self.assertEqual(client.call_args.kwargs['http_options'].timeout, 18000)
        self.assertEqual(client.call_args.kwargs['http_options'].retry_options.attempts, 1)
        config = context.models.generate_content.call_args.kwargs['config']
        self.assertEqual(config.response_mime_type, 'application/json')
        self.assertIn('recipes', config.response_json_schema['properties'])

    @patch('gemini_client.genai.Client', side_effect=ReadTimeout('secret-url'))
    def test_timeout_is_safe(self, _client):
        self.app.config['GEMINI_API_KEY'] = 'test-only'; self.app.config['GENERATOR'] = generate
        response = self.send(BODY)
        self.assertEqual(response.status_code, 504)
        self.assertNotIn('secret-url', response.get_data(as_text=True))

    @patch('gemini_client.genai.Client', side_effect=RuntimeError('secret-url'))
    def test_upstream_failure(self, _client):
        self.app.config['GEMINI_API_KEY'] = 'test-only'; self.app.config['GENERATOR'] = generate
        self.assertEqual(self.send(BODY).status_code, 502)

    def test_unknown_fields_and_routes(self):
        body = copy.deepcopy(BODY); body['email'] = 'not-forwarded@example.test'
        self.assertEqual(self.send(body).status_code, 400)
        self.assertEqual(self.client.get('/missing').status_code, 404)
        self.assertEqual(self.client.get('/ai/quick-recipes').status_code, 405)

    def test_expired_selection_not_forwarded(self):
        body = copy.deepcopy(BODY)
        body['selectedIngredients'] = ['달걀', '양파']
        body['ingredients'][0]['expirationDate'] = '2026-10-21'
        value = validate_request(body, TODAY)
        self.assertEqual(value['selectedIngredients'], ['양파'])

    def test_volume_conversion_and_exact_decimal_sum(self):
        from recommendation import compare
        inventory = [{'name': '우유', 'quantity': '0.1', 'unit': 'L'}, {'name': '우유', 'quantity': '0.2', 'unit': 'ml'}]
        result = compare({'name': '우유', 'quantity': '100.2', 'unit': 'ml'}, inventory)
        self.assertEqual(result['quantity'], '100.2')
        self.assertEqual(result['status'], 'SUFFICIENT')

    def test_size_limit(self):
        self.app.config['MAX_CONTENT_LENGTH'] = 10
        self.assertEqual(self.send(BODY).status_code, 413)

    @patch('gemini_client.genai.Client')
    def test_gemini_api_errors(self, client):
        from google.genai.errors import APIError
        self.app.config.update(GEMINI_API_KEY='test-only', GENERATOR=generate)
        for code, status in [(429, 502), (403, 502), (504, 504)]:
            client.side_effect = APIError(code, {'error': {'message': 'secret-detail', 'status': 'UNAVAILABLE'}})
            response = self.send(BODY)
            self.assertEqual(response.status_code, status)
            self.assertNotIn('secret-detail', response.get_data(as_text=True))

    def test_default_model_uses_verified_lightweight_model(self):
        import os
        with patch.dict(os.environ, {'GEMINI_MODEL': 'gemini-3.5-flash-lite'}):
            self.assertEqual(create_app().config['GEMINI_MODEL'], 'gemini-3.5-flash-lite')

    @patch('gemini_client.genai.Client', side_effect=ReadTimeout('secret-key-and-url'))
    def test_failure_logs_only_safe_diagnostics(self, _client):
        with self.assertLogs('gemini_client', level='WARNING') as captured:
            with self.assertRaises(ServiceError):
                generate({}, 'private-api-key', 'gemini-3.5-flash-lite')
        output = ' '.join(captured.output)
        self.assertIn('ReadTimeout', output)
        self.assertIn('elapsed_ms=', output)
        self.assertNotIn('private-api-key', output)
        self.assertNotIn('secret-key-and-url', output)


if __name__ == '__main__':
    unittest.main()

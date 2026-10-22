import copy
import json
import unittest
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from app import create_app
from errors import ServiceError
from test_service import BODY, RESPONSE, TODAY
from test_meal_service import request_body, response_body


class IntegrationBoundaryTests(unittest.TestCase):
    def test_concurrent_daily_and_quick_requests_keep_separate_contracts(self):
        barrier = Barrier(2)

        def daily(body, key, model):
            self.assertIn('mealTypes', body)
            self.assertNotIn('selectedIngredients', body)
            barrier.wait(timeout=5)
            return json.dumps(response_body())

        def quick(body, key, model):
            self.assertEqual(body['selectedIngredients'], ['달걀'])
            self.assertNotIn('mealTypes', body)
            barrier.wait(timeout=5)
            return json.dumps(RESPONSE)

        app = create_app({'TESTING': True, 'MEAL_GENERATOR': daily, 'GENERATOR': quick, 'TODAY': lambda: TODAY})

        def post(path, body):
            with app.test_client() as client:
                response = client.post(path, json=body)
                return response.status_code, response.json

        with ThreadPoolExecutor(max_workers=2) as pool:
            day = pool.submit(post, '/ai/meal-plans', request_body())
            short = pool.submit(post, '/ai/quick-recipes', copy.deepcopy(BODY))
            day_status, day_body = day.result(timeout=10)
            quick_status, quick_body = short.result(timeout=10)
        self.assertEqual((day_status, quick_status), (200, 200))
        self.assertEqual(len(day_body), 3)
        self.assertEqual(quick_body['source'], 'AI_GENERATED')
        self.assertEqual(len(quick_body['recipes']), 1)

    def test_daily_timeout_then_retry_recovers_without_mutating_request(self):
        body = request_body()
        original = copy.deepcopy(body)
        calls = 0

        def generator(*args):
            nonlocal calls
            calls += 1
            if calls == 1:
                raise ServiceError(504, 'AI_005', '시간 초과')
            return json.dumps(response_body())

        app = create_app({'TESTING': True, 'MEAL_GENERATOR': generator, 'TODAY': lambda: TODAY})
        with app.test_client() as client:
            self.assertEqual(client.post('/ai/meal-plans', json=body).json['code'], 'AI_005')
            self.assertEqual(client.get('/health').status_code, 200)
            self.assertEqual(client.post('/ai/meal-plans', json=body).status_code, 200)
        self.assertEqual(body, original)

    def test_unexpected_quick_failure_does_not_leak_or_break_daily_route(self):
        def broken(*args):
            raise RuntimeError('private-key-and-internal-address')

        app = create_app({'TESTING': True, 'GENERATOR': broken,
            'MEAL_GENERATOR': lambda *args: json.dumps(response_body()), 'TODAY': lambda: TODAY})
        with app.test_client() as client:
            response = client.post('/ai/quick-recipes', json=copy.deepcopy(BODY))
            self.assertEqual(response.status_code, 500)
            self.assertNotIn('private-key', response.get_data(as_text=True))
            self.assertEqual(client.post('/ai/meal-plans', json=request_body()).status_code, 200)

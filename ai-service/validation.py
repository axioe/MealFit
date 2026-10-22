import re
from datetime import date
from decimal import Decimal, InvalidOperation
from errors import ServiceError


def invalid(message, field):
    raise ServiceError(400, 'AI_001', message, field)


def text(value, field, limit):
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > limit or any(ord(c) < 32 for c in value):
        invalid(f'{field} 값을 확인해 주세요.', field)
    return value.strip()


def quantity(value, field):
    if isinstance(value, bool) or not isinstance(value, (str, int, Decimal)) or not re.fullmatch(r'\d+(?:\.\d{1,3})?', str(value)):
        invalid('수량은 정수 9자리·소수 3자리 이내로 입력해 주세요.', field)
    try:
        result = Decimal(value)
    except InvalidOperation:
        invalid('수량을 확인해 주세요.', field)
    if not 0 < result <= Decimal('999999999.999'):
        invalid('수량은 0보다 크고 999999999.999 이하여야 합니다.', field)
    return result


def decimal_text(value):
    return format(value, 'f').rstrip('0').rstrip('.') if '.' in format(value, 'f') else format(value, 'f')


def names(value, field):
    if not isinstance(value, list) or len(value) > 100:
        invalid('재료 목록 형식을 확인해 주세요.', field)
    return list(dict.fromkeys(text(item, field, 100) for item in value))


def validate_request(body, today):
    allowed = {'ingredients', 'selectedIngredients', 'maxCookingMinutes', 'recommendationCount', 'userGoal', 'allergies', 'excludedIngredients'}
    if not isinstance(body, dict) or set(body) - allowed:
        invalid('요청 필드를 확인해 주세요.', 'body')
    ingredients = body.get('ingredients')
    if not isinstance(ingredients, list) or not 1 <= len(ingredients) <= 100:
        invalid('재료를 1개 이상 100개 이하로 입력해 주세요.', 'ingredients')
    result = []
    for item in ingredients:
        if not isinstance(item, dict) or set(item) - {'name', 'quantity', 'unit', 'expirationDate'}:
            invalid('재료 정보 형식을 확인해 주세요.', 'ingredients')
        name = text(item.get('name'), 'name', 100)
        unit = text(item.get('unit'), 'unit', 20)
        amount = quantity(item.get('quantity'), 'quantity')
        expiry = item.get('expirationDate')
        if expiry is not None:
            try:
                if not isinstance(expiry, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', expiry):
                    raise ValueError()
                date.fromisoformat(expiry)
            except ValueError:
                invalid('소비기한은 YYYY-MM-DD 형식으로 입력해 주세요.', 'expirationDate')
        result.append({'name': name, 'quantity': decimal_text(amount), 'unit': unit, 'expirationDate': expiry})
    selected = names(body.get('selectedIngredients', []), 'selectedIngredients')
    if not selected or set(selected) - {item['name'] for item in result}:
        invalid('보유 재료 중 사용할 재료를 선택해 주세요.', 'selectedIngredients')
    minutes, count = body.get('maxCookingMinutes', 15), body.get('recommendationCount', 3)
    if type(minutes) is not int or not 1 <= minutes <= 15:
        invalid('최대 조리 시간은 1~15분으로 입력해 주세요.', 'maxCookingMinutes')
    if type(count) is not int or not 1 <= count <= 5:
        invalid('추천 개수는 1~5개로 입력해 주세요.', 'recommendationCount')
    usable = [item for item in result if item['expirationDate'] is None or item['expirationDate'] >= today.isoformat()]
    if not any(item['name'] in selected for item in usable):
        invalid('선택한 재료가 모두 기한 경과 상태입니다.', 'selectedIngredients')
    selected = [name for name in selected if any(item['name'] == name for item in usable)]
    goal = body.get('userGoal')
    return {'ingredients': usable, 'selectedIngredients': selected, 'maxCookingMinutes': minutes, 'recommendationCount': count,
            'userGoal': None if goal is None else text(goal, 'userGoal', 100),
            'allergies': names(body.get('allergies', []), 'allergies'),
            'excludedIngredients': names(body.get('excludedIngredients', []), 'excludedIngredients'), 'asOfDate': today.isoformat()}

import json
import logging
import time
from google import genai
from google.genai import types
from google.genai.errors import APIError
from httpx import TimeoutException
from errors import ServiceError
from recommendation import RESPONSE_SCHEMA, SYSTEM_PROMPT


logger = logging.getLogger(__name__)

def record_failure(error, started):
    # 키·요청 본문·예외 원문은 기록하지 않는다.
    logger.warning('Gemini 호출 실패: exception=%s status=%s elapsed_ms=%d',
                   type(error).__name__, getattr(error, 'code', None), int((time.monotonic() - started) * 1000))

def generate(request, api_key, model, *, system_prompt=SYSTEM_PROMPT, response_schema=RESPONSE_SCHEMA):
    if not api_key:
        raise ServiceError(503, 'AI_002', 'AI 서비스의 GEMINI_API_KEY 설정이 필요합니다.')
    started = time.monotonic()
    try:
        with genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=18000, retry_options=types.HttpRetryOptions(attempts=1))) as client:
            response = client.models.generate_content(model=model, contents=json.dumps(request, ensure_ascii=False),
                config=types.GenerateContentConfig(system_instruction=system_prompt, response_mime_type='application/json', response_json_schema=response_schema))
            return response.text
    except TimeoutException as error:
        record_failure(error, started)
        raise ServiceError(504, 'AI_005', 'AI 추천 응답 시간이 초과되었습니다. 다시 시도해 주세요.') from None
    except APIError as error:
        record_failure(error, started)
        if error.code in (408, 504):
            raise ServiceError(504, 'AI_005', 'AI 추천 응답 시간이 초과되었습니다. 다시 시도해 주세요.') from None
        raise ServiceError(502, 'AI_003', 'AI 추천 서비스 호출에 실패했습니다. 잠시 후 다시 시도해 주세요.') from None
    except Exception as error:
        record_failure(error, started)
        raise ServiceError(502, 'AI_003', 'AI 추천 서비스 호출에 실패했습니다. 잠시 후 다시 시도해 주세요.') from None

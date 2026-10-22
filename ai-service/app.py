import json
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from werkzeug.exceptions import HTTPException
from errors import ServiceError
from validation import validate_request
from recommendation import validate_response
from gemini_client import generate


def create_app(config=None):
    load_dotenv(Path(__file__).with_name('.env'), override=False)
    app = Flask(__name__)
    app.json.ensure_ascii = False
    app.config.update(MAX_CONTENT_LENGTH=1024 * 1024, GEMINI_API_KEY=os.getenv('GEMINI_API_KEY', ''),
                      GEMINI_MODEL=os.getenv('GEMINI_MODEL', 'gemini-3.5-flash-lite'), GENERATOR=generate,
                      TODAY=lambda: datetime.now(timezone(timedelta(hours=9))).date())
    app.config.update(config or {})

    @app.get('/health')
    def health():
        return jsonify(status='ok', service='mealfit-ai')

    @app.post('/ai/quick-recipes')
    def recommend():
        if not request.is_json:
            raise ServiceError(415, 'AI_001', 'Content-Type을 application/json으로 설정해 주세요.')
        try:
            body = json.loads(request.get_data(), parse_float=Decimal, parse_constant=lambda _: None)
        except (ValueError, UnicodeError):
            raise ServiceError(400, 'AI_001', '올바른 JSON 요청을 입력해 주세요.') from None
        validated = validate_request(body, app.config['TODAY']())
        raw = app.config['GENERATOR'](validated, app.config['GEMINI_API_KEY'], app.config['GEMINI_MODEL'])
        return jsonify(validate_response(raw, validated))

    def error_body(status, code, message, field=None):
        return jsonify(status=status, code=code, message=message,
                       errors=[] if field is None else [{'field': field, 'message': message}],
                       timestamp=datetime.now(timezone(timedelta(hours=9))).isoformat()), status

    @app.errorhandler(ServiceError)
    def service_error(error):
        return error_body(error.status, error.code, error.message, error.field)

    @app.errorhandler(HTTPException)
    def http_error(error):
        return error_body(error.code, 'AI_001', '요청 경로·메서드·본문 크기를 확인해 주세요.')

    @app.errorhandler(Exception)
    def unexpected_error(_error):
        return error_body(500, 'AI_006', 'AI 서비스 처리 중 오류가 발생했습니다.')

    return app


def get_port():
    try:
        port = int(os.getenv('PORT', '8000'))
        if not 1 <= port <= 65535:
            raise ValueError()
        return port
    except ValueError:
        raise ValueError('PORT는 1~65535 사이의 정수로 설정해 주세요.') from None


if __name__ == '__main__':
    app = create_app()
    app.run(host='127.0.0.1', port=get_port(), debug=False)

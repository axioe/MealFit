package com.mealfit.global.exception;

import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.method.ParameterErrors;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * 모든 예외를 ErrorResponse 한 가지 형식으로 내려준다.
 * Spring MVC 기본 예외(필수 파라미터 누락, 메서드 불일치 등)도 500이 아니라 원래 상태 코드로 응답한다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException e) {
        ErrorCode code = e.getErrorCode();
        return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code, e.getMessage()));
    }

    /** @RequestBody @Valid 검증 실패 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        List<ErrorResponse.FieldError> errors = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ErrorResponse.FieldError(fe.getField(), fe.getDefaultMessage()))
                .toList();
        return invalidInput(errors);
    }

    /** @RequestParam / @PathVariable 에 붙인 @Positive, @Min 등 검증 실패 */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleMethodValidation(HandlerMethodValidationException e) {
        List<ErrorResponse.FieldError> errors = e.getParameterValidationResults().stream()
                .flatMap(result -> {
                    if (result instanceof ParameterErrors parameterErrors) {
                        return parameterErrors.getFieldErrors().stream()
                                .map(fe -> new ErrorResponse.FieldError(fe.getField(), fe.getDefaultMessage()));
                    }
                    String name = result.getMethodParameter().getParameterName();
                    return result.getResolvableErrors().stream()
                            .map(error -> new ErrorResponse.FieldError(name, error.getDefaultMessage()));
                })
                .toList();
        return invalidInput(errors);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParameter(MissingServletRequestParameterException e) {
        return invalidInput(List.of(new ErrorResponse.FieldError(e.getParameterName(), "필수 입력값입니다.")));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return invalidInput(List.of(new ErrorResponse.FieldError(e.getName(), "형식이 올바르지 않습니다.")));
    }

    /** JSON 문법 오류, enum에 없는 값 등 요청 본문을 읽을 수 없는 경우 */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException e) {
        return invalidInput(List.of());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        ErrorCode code = ErrorCode.METHOD_NOT_ALLOWED;
        return ResponseEntity.status(code.getStatus()).headers(e.getHeaders()).body(ErrorResponse.of(code));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException e) {
        ErrorCode code = ErrorCode.UNSUPPORTED_MEDIA_TYPE;
        return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException e) {
        ErrorCode code = ErrorCode.NOT_FOUND;
        return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception e) {
        // 위에서 따로 처리하지 않은 Spring MVC 예외(헤더 누락 등)도 4xx면 500으로 내리지 않는다
        if (e instanceof org.springframework.web.ErrorResponse springError
                && springError.getStatusCode().is4xxClientError()) {
            log.warn("Client error: {}", e.getMessage());
            ErrorCode code = toErrorCode(springError.getStatusCode());
            return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code));
        }
        log.error("Unhandled exception", e);
        ErrorCode code = ErrorCode.INTERNAL_ERROR;
        return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code));
    }

    private ResponseEntity<ErrorResponse> invalidInput(List<ErrorResponse.FieldError> errors) {
        ErrorCode code = ErrorCode.INVALID_INPUT;
        return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code, code.getMessage(), errors));
    }

    private ErrorCode toErrorCode(HttpStatusCode status) {
        return switch (status.value()) {
            case 401 -> ErrorCode.UNAUTHORIZED;
            case 403 -> ErrorCode.FORBIDDEN;
            case 404 -> ErrorCode.NOT_FOUND;
            case 405 -> ErrorCode.METHOD_NOT_ALLOWED;
            case 415 -> ErrorCode.UNSUPPORTED_MEDIA_TYPE;
            default -> ErrorCode.INVALID_INPUT;
        };
    }
}

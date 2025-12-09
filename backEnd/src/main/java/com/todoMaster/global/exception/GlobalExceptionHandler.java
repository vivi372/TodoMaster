package com.todoMaster.global.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    /** ✔ CustomException */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<Map<String, Object>> handleCustomException(CustomException ex) {

        ErrorCode code = ex.getErrorCode();

        Map<String, Object> body = new HashMap<>();
        body.put("status", code.getStatus().value());
        body.put("errorCode", code.name());
        body.put("message", code.getMessage());

        return ResponseEntity.status(code.getStatus()).body(body);
    }

    /** ✔ @Valid DTO Validation 실패 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {

        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("입력 값이 올바르지 않습니다.");

        Map<String, Object> body = new HashMap<>();
        body.put("status", 400);
        body.put("errorCode", ErrorCode.INVALID_INPUT_VALUE.name());
        body.put("message", message);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /** ✔ @Validated - Service/Controller 레벨 단일 파라미터 Validation 실패 */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {

        Map<String, Object> body = new HashMap<>();
        body.put("status", 400);
        body.put("errorCode", ErrorCode.INVALID_INPUT_VALUE.name());
        body.put("message", ex.getMessage());

        return ResponseEntity.badRequest().body(body);
    }

    /** ✔ 서버 내부 오류 */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {

        Map<String, Object> body = new HashMap<>();
        body.put("status", 500);
        body.put("errorCode", ErrorCode.INTERNAL_SERVER_ERROR.name());
        body.put("message", "서버 오류가 발생했습니다.");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
package com.todoMaster.global.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.todoMaster.global.dto.ApiResponse;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    /** ✔ CustomException */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<?>> handleCustomException(CustomException ex) {

        ErrorCode code = ex.getErrorCode();

        return ResponseEntity
        		.status(code.getStatus())
        		.body(ApiResponse.fail(code));
    }

    /** ✔ @Valid DTO Validation 실패 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationException(MethodArgumentNotValidException ex) {

        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("입력 값이 올바르지 않습니다.");

        return ResponseEntity
        		.status(HttpStatus.BAD_REQUEST)
        		.body(ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE, message));
    }

    /** ✔ @Validated - Service/Controller 레벨 단일 파라미터 Validation 실패 */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleConstraintViolation(ConstraintViolationException ex) {

        return ResponseEntity
        		.status(HttpStatus.BAD_REQUEST)
        		.body(ApiResponse.fail(
                        ErrorCode.INVALID_INPUT_VALUE,
                        ex.getMessage()
                ));
    }

    /** ✔ 서버 내부 오류 */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleException(Exception ex) {        

        return ResponseEntity
        		.status(HttpStatus.INTERNAL_SERVER_ERROR)
        		.body(ApiResponse.fail(
                        ErrorCode.INTERNAL_SERVER_ERROR,
                        "서버 오류가 발생했습니다."
                ));
    }
}
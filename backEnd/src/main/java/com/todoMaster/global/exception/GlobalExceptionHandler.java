package com.todoMaster.global.exception;

import com.todoMaster.global.dto.ApiResponse;
import com.todoMaster.todo.exception.TodoNotFoundException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;


@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    /** ✔ CustomException */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<?>> handleCustomException(CustomException ex) {

        ErrorCode code = ex.getErrorCode();
        
        log.warn("CustomException: {} | HttpStatus: {} | Message: {}", code.name(), code.getStatus(), code.getMessage());

        return ResponseEntity
        		.status(code.getStatus())
        		.body(ApiResponse.fail(code));
    }

    /** ✔ Todo not found */
    @ExceptionHandler(TodoNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleTodoNotFoundException(TodoNotFoundException ex) {
        log.warn("TodoNotFoundException: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.fail(ErrorCode.TODO_NOT_FOUND, ex.getMessage()));
    }   

    /** ✔ @Valid DTO Validation 실패 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationException(MethodArgumentNotValidException ex) {

        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("입력 값이 올바르지 않습니다.");
        
        log.warn("ValidationException: {}", message);

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
    	
    	log.error("Internal Server Error occurred!", ex);

        return ResponseEntity
        		.status(HttpStatus.INTERNAL_SERVER_ERROR)
        		.body(ApiResponse.fail(
                        ErrorCode.INTERNAL_SERVER_ERROR,
                        "서버 오류가 발생했습니다."
                ));
    }
}
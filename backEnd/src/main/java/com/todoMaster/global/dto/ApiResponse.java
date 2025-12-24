package com.todoMaster.global.dto;

import com.todoMaster.global.exception.ErrorCode;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 모든 API 응답의 표준 형식을 정의하는 제네릭(Generic) 클래스입니다.
 * HTTP 상태 코드와 무관하게 응답의 성공/실패 여부, 메시지, 실제 데이터를 담습니다.
 *
 * @param <T> 응답 본문에 포함될 데이터의 타입 (예: UserDto, List<ItemDto> 등)
 */
@Getter
@AllArgsConstructor
public class ApiResponse<T> {
    
    // 응답의 성공 여부를 나타냅니다. (true: 성공, false: 실패/오류)
    private boolean success;
    
    // 응답과 관련된 메시지 (예: "회원가입 성공", "유효하지 않은 요청입니다.")
    private String message;
    
    // 실제 응답 본문 데이터. 성공 시 반환될 객체입니다.
    private T data;
    
    // 실패 시 에러 상세 정보(코드, 상태, 메시지)
    private ErrorDetail error;

    // --- 정적 팩토리 메서드 (Static Factory Methods) ---

    /**
     * 데이터 없이 성공 응답을 생성합니다.
     * @param message 응답 메시지
     * @param <T> 데이터 타입 (이 경우 null이므로 어떤 타입이든 가능)
     * @return 성공 ApiResponse 객체
     */
    public static <T> ApiResponse<T> success(String message) {
        // success=true, message, data=null 로 설정
        return new ApiResponse<>(true, message, null, null);
    }

    /**
     * 데이터를 포함하여 성공 응답을 생성합니다.
     * @param message 응답 메시지
     * @param data 응답에 포함될 실제 데이터 객체
     * @param <T> 데이터 타입
     * @return 성공 ApiResponse 객체
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        // success=true, message, data 로 설정
        return new ApiResponse<>(true, message, data, null);
    }

    /**
     * 실패 응답을 생성합니다.
     * @param message 응답 메시지 (오류 내용 설명)
     * @param <T> 데이터 타입 (실패 시 데이터는 null)
     * @return 실패 ApiResponse 객체
     */
    public static <T> ApiResponse<T> fail(String message) {
        // success=false, message, data=null 로 설정
        return new ApiResponse<>(false, message, null, null);
    }
    
    // ---------------------------------------
    // ✔ 실패 응답 (ErrorCode 포함)
    // ---------------------------------------
    public static <T> ApiResponse<T> fail(ErrorCode code) {
        return new ApiResponse<>(
                false,
                code.getMessage(),
                null,
                new ErrorDetail(
                		code.name(), 
                		code.getStatus().value(), 
                		code.getMessage(),
                		code.getDescription(),
                		code.isSilent(),
                		code.getType().getValue(),
                		code.getDisplayType().getValue(),
                		code.getAction().getValue()
                	)
        );
    }
    
    /** 실패 + 커스텀 메시지 */
    public static <T> ApiResponse<T> fail(ErrorCode code, String customMessage) {
        return new ApiResponse<>(
                false,
                customMessage,
                null,
                new ErrorDetail(
                		code.name(), 
                		code.getStatus().value(), 
                		customMessage,
                		"",
                		code.isSilent(),
                		code.getType().getValue(),
                		code.getDisplayType().getValue(),
                		code.getAction().getValue()
                	)
        );
    }
    
    // ---------------------------------------
    // ✔ 에러 상세 클래스
    // ---------------------------------------
    @Getter
    @AllArgsConstructor
    public static class ErrorDetail {
        private String code;   // 예: USER_NOT_FOUND
        private int status;    // 예: 404
        private String message; // 상세 오류 메시지
        private String description; // 상세 오류 메시지
        private boolean silent; // 상세 오류 메시지
        private String type; // 상세 오류 메시지
        private String displayType; // 상세 오류 메시지
        private String action; // 상세 오류 메시지
    }    
    
    
}

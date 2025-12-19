package com.todoMaster.global.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public enum ErrorCode {
	
	// ====================================================================================
    // 🟢 공통 (COMMON)
    // ====================================================================================

    // 토스트 (Toast) 필요 (message로 충분)
    INVALID_INPUT_VALUE(
        HttpStatus.BAD_REQUEST, 
        "입력 값이 올바르지 않습니다.", 
        "" // description 비워둠
    ),
    
    // 모달 (Modal) 필요 (치명적 오류 및 조치 필요)
    INTERNAL_SERVER_ERROR(
        HttpStatus.INTERNAL_SERVER_ERROR, 
        "서버 오류가 발생했습니다.", 
        "서비스 이용에 불편을 드려 죄송합니다. 잠시 후 다시 시도하거나, 문제가 지속되면 고객센터에 문의해 주세요."
    ),

    // ====================================================================================
    // 🔐 인증/인가 (AUTH/ACCESS)
    // ====================================================================================
    
    // 토스트 (Toast) 또는 Silent 처리 (재로그인 로직으로 자동 처리)
    INVALID_TOKEN(
        HttpStatus.UNAUTHORIZED, 
        "유효하지 않은 토큰입니다.", 
        ""
    ),
    EXPIRED_TOKEN(
        HttpStatus.UNAUTHORIZED, 
        "토큰이 만료되었습니다.", 
        "" // Silent 처리 후 재로그인 유도 예정
    ),
    
    // 모달 (Modal) 필요 (로그인 페이지 이동 등 강제 조치 필요)
    UNAUTHORIZED_USER(
        HttpStatus.UNAUTHORIZED, 
        "로그인이 필요합니다.", 
        "이 페이지에 접근하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?"
    ),
    
    // 토스트 또는 Silent 처리 (재로그인 로직으로 자동 처리)
    TOKEN_NOT_FOUND(
        HttpStatus.UNAUTHORIZED, 
        "토큰이 전송되지 않았습니다.", 
        ""
    ),
    REFRESH_TOKEN_NOT_FOUND(
        HttpStatus.UNAUTHORIZED, 
        "리프레시 토큰이 존재하지 않습니다.", 
        ""
    ),
    REFRESH_TOKEN_MISMATCH(
        HttpStatus.UNAUTHORIZED, 
        "리프레시 토큰이 일치하지 않습니다.", 
        ""
    ),

    // ====================================================================================
    // 👤 회원 (MEMBER)
    // ====================================================================================
    
    // 토스트 (Toast) 필요 (즉시 피드백)
    PASSWORD_NOT_MATCH(
        HttpStatus.BAD_REQUEST, 
        "비밀번호가 일치하지 않습니다.", 
        ""
    ),
    EMAIL_DUPLICATION(
        HttpStatus.BAD_REQUEST, 
        "이미 사용 중인 이메일입니다.", 
        ""
    ),
    NICKNAME_DUPLICATION(
        HttpStatus.BAD_REQUEST, 
        "이미 사용 중인 닉네임입니다.", 
        ""
    ),
    
    // 토스트 (Toast) 필요 (즉시 피드백)
    USER_NOT_FOUND(
        HttpStatus.NOT_FOUND, 
        "사용자를 찾을 수 없습니다.", 
        ""
    ),
    INVALID_PASSWORD(
        HttpStatus.BAD_REQUEST, 
        "비밀번호가 올바르지 않습니다.", 
        ""
    ),
    SAME_PASSWORD_NOT_ALLOWED(
        HttpStatus.BAD_REQUEST, 
        "기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.", 
        ""
    ),
    
    // 모달 (Modal) 필요 (데이터 지속성 및 안정성 관련 치명적 오류)
    UPDATE_FAILED(
        HttpStatus.INTERNAL_SERVER_ERROR, 
        "업데이트에 실패했습니다.", 
        "요청하신 데이터 업데이트 과정에서 오류가 발생했습니다. 잠시 후 다시 시도하거나, 변경 사항을 확인해 주세요."
    );


    private final HttpStatus status;
    private final String message;
    private final String description;

    ErrorCode(HttpStatus status, String message, String description) {
        this.status = status;
        this.message = message;
        this.description = description;
    }
}

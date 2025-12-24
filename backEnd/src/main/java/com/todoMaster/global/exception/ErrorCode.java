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
        "", // description 비워둠
        false, // silent: false
        ErrorType.WARNING, // type: 'warning'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE
    ),
    
    // 모달 (Modal) 필요 (치명적 오류 및 조치 필요)
    INTERNAL_SERVER_ERROR(
        HttpStatus.INTERNAL_SERVER_ERROR, 
        "서버 오류가 발생했습니다.", 
        "서비스 이용에 불편을 드려 죄송합니다. 잠시 후 다시 시도해 주세요.",
        false, // silent: false
        ErrorType.ERROR, // type: 'error'
        ErrorDisplayType.ALERT_MODAL, // displayType: 'modal', ModalType: 'alert'
        ErrorAction.NONE        // action: NONE (새로고침은 description으로 유도)
    ),
    
    // 공통 - FILE_MOVE_FAILED (silent: true, 표시 안 함)
    FILE_MOVE_FAILED(
    		HttpStatus.INTERNAL_SERVER_ERROR, 
    		"파일 처리 중 오류가 발생했습니다.",
    		"",
    		true, // silent: true
    		ErrorType.ERROR, // type: 'error'
    		ErrorDisplayType.TOAST, // displayType: 'toast'
    		ErrorAction.NONE    		
    	),
    
    // S3 / 인프라
    PRESIGNED_URL_GENERATION_FAILED(
        HttpStatus.INTERNAL_SERVER_ERROR, 
        "이미지 업로드에 실패했습니다",
        "서버 통신 문제로 인해 파일을 업로드할 수 있는 주소를 생성하지 못했습니다. 잠시 후 다시 시도해주시거나, 문제가 지속될 경우 서비스 지원팀에 문의해 주세요.",
        false, // silent: false
        ErrorType.ERROR, // type: 'error'
        ErrorDisplayType.ALERT_MODAL, // displayType: 'modal', ModalType: 'alert'
        ErrorAction.NONE
    ),

    // 이메일 발송 오류 추가
    EMAIL_SENDING_FAILURE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "이메일 발송에 실패했습니다.",
        "메일 서버 문제일 수 있습니다. 잠시 후 다시 시도하거나, 고객센터에 문의해 주세요.",
        false, // silent: false
        ErrorType.ERROR, // type: 'error'
        ErrorDisplayType.ALERT_MODAL, // displayType: 'modal', ModalType: 'alert'
        ErrorAction.NONE
    ),
    
    // ====================================================================================
    // 🔐 인증/인가 (AUTH/ACCESS)
    // ====================================================================================
    
    // 토큰 관련 에러: Silent 처리
    INVALID_TOKEN(
        HttpStatus.UNAUTHORIZED, 
        "유효하지 않은 토큰입니다.", 
        "",
        true, // silent: true
        ErrorType.ERROR, // type: 'error'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE // 재로그인 처리는 프론트엔드 로직에서 처리한다고 가정
    ),
    EXPIRED_TOKEN(
        HttpStatus.UNAUTHORIZED, 
        "토큰이 만료되었습니다.", 
        "", // Silent 처리 후 재로그인 유도 예정
        true, // silent: true
        ErrorType.ERROR, // type: 'error'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE // 재로그인 처리는 프론트엔드 로직에서 처리한다고 가정
    ),
    
    // 모달 (Modal) 필요 (로그인 페이지 이동 등 강제 조치 필요)
    UNAUTHORIZED_USER(
        HttpStatus.UNAUTHORIZED, 
        "로그인이 필요합니다.", 
        "이 페이지에 접근하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?",
        false, // silent: false
        ErrorType.WARNING, // type: 'warning'
        ErrorDisplayType.CONFIRM_MODAL, // displayType: 'modal', ModalType: 'confirm'
        ErrorAction.REDIRECT_TO_LOGIN // action: 'REDIRECT_TO_LOGIN'
    ),
    
    // 토큰 또는 Silent 처리
    TOKEN_NOT_FOUND(
        HttpStatus.UNAUTHORIZED, 
        "토큰이 전송되지 않았습니다.", 
        "",
        true, // silent: true
        ErrorType.ERROR, // type: 'error'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE
    ),
    REFRESH_TOKEN_NOT_FOUND(
        HttpStatus.UNAUTHORIZED, 
        "리프레시 토큰이 존재하지 않습니다.", 
        "",
        true, // silent: true
        ErrorType.ERROR, // type: 'error'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE
    ),
    REFRESH_TOKEN_MISMATCH(
        HttpStatus.UNAUTHORIZED, 
        "리프레시 토큰이 일치하지 않습니다.", 
        "",
        true, // silent: true
        ErrorType.ERROR, // type: 'error'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE
    ),
    AUTHORIZATION_HEADER_MISSING(
        HttpStatus.UNAUTHORIZED, 
        "인증 정보(Authorization Header)가 누락되었습니다.", 
        "", // description 비워둠
        false, // silent: false (로그아웃 실패 사실은 알려줘야 함)
        ErrorType.WARNING, // type: 'warning'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE
    ),
    ACCOUNT_VERIFICATION_FAILED(
        HttpStatus.FORBIDDEN, // 403 Forbidden: 접근 권한(인증)이 유효하지 않아 거부됨
        "계정 활성화에 실패했습니다.", 
        "인증 토큰이 유효하지 않거나 만료되었습니다. 인증 메일을 재전송하여 다시 시도해 주세요.",
        false, // silent: false
        ErrorType.ERROR, // 토큰 오류는 시스템/보안 문제로 간주
        ErrorDisplayType.ALERT_MODAL, // 명확한 고지 및 해결책 제시를 위해 Alert 모달 사용
        ErrorAction.NONE
    ),

    // ====================================================================================
    // 👤 회원 (MEMBER)
    // ====================================================================================
    
    // 토스트 (Toast) 필요 (즉시 피드백)
    PASSWORD_NOT_MATCH(
        HttpStatus.BAD_REQUEST, 
        "비밀번호가 일치하지 않습니다.", 
        "",
        false, // silent: false
        ErrorType.WARNING, // type: 'warning'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE
    ),
    EMAIL_DUPLICATION(
        HttpStatus.BAD_REQUEST, 
        "이미 사용 중인 이메일입니다.", 
        "",
        false, // silent: false
        ErrorType.WARNING, // type: 'warning'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE
    ),
    NICKNAME_DUPLICATION(
        HttpStatus.BAD_REQUEST, 
        "이미 사용 중인 닉네임입니다.", 
        "",
        false, // silent: false
        ErrorType.WARNING, // type: 'warning'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE
    ),
    VERIFICATION_ACCOUNT_MISSING(
        HttpStatus.INTERNAL_SERVER_ERROR, 
        "인증할 계정을 찾을 수 없습니다.", 
        "인증 토큰의 정보와 일치하는 계정을 찾을 수 없습니다. 이미 계정이 삭제되었거나, 시스템 오류가 발생했을 수 있습니다. 문제가 지속될 경우 고객센터로 문의해 주세요.",
        false, // silent: false
        ErrorType.ERROR, // type: 'error' (시스템/데이터 불일치로 간주)
        ErrorDisplayType.ALERT_MODAL, // 사용자에게 명확하고 확실하게 고지
        ErrorAction.NONE
    ),
    
    // 토스트 (Toast) 필요 (즉시 피드백)
    USER_NOT_FOUND(
        HttpStatus.NOT_FOUND, 
        "사용자를 찾을 수 없습니다.", 
        "",
        false, // silent: false
        ErrorType.WARNING, // type: 'warning'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE
    ),
    INVALID_PASSWORD(
        HttpStatus.BAD_REQUEST, 
        "비밀번호가 올바르지 않습니다.", 
        "",
        false, // silent: false
        ErrorType.WARNING, // type: 'warning'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE
    ),
    SAME_PASSWORD_NOT_ALLOWED(
        HttpStatus.BAD_REQUEST, 
        "기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.", 
        "",
        false, // silent: false
        ErrorType.WARNING, // type: 'warning'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE
    ),
    
    // 모달 (Modal) 필요 (데이터 지속성 및 안정성 관련 치명적 오류)
    UPDATE_FAILED(
        HttpStatus.INTERNAL_SERVER_ERROR, 
        "업데이트에 실패했습니다.", 
        "요청하신 데이터 업데이트 과정에서 오류가 발생했습니다. 잠시 후 다시 시도하거나, 변경 사항을 확인해 주세요.",
        false, // silent: false
        ErrorType.ERROR, // type: 'error'
        ErrorDisplayType.CONFIRM_MODAL, // displayType: 'modal', ModalType: 'confirm'
        ErrorAction.REDIRECT_TO_LOGIN // action: 'REDIRECT_TO_LOGIN'
    );


    private final HttpStatus status;
    private final String message; // 출력 메시지 or 모달 제목
    private final String description; // 모달 내용
    private final boolean silent; // 출력 여부
    private final ErrorType type; // 로그 타입
    private final ErrorDisplayType displayType; // 디스플레이 타입
    private final ErrorAction action; // 클릭 액션

    ErrorCode(
    		HttpStatus status, 
    		String message, 
    		String description, 
    		boolean silent,
    		ErrorType type,
    		ErrorDisplayType displayType, 
    		ErrorAction action
    ) {
        this.status = status;
        this.message = message;
        this.description = description;
        this.silent = silent;
        this.type = type;
        this.displayType = displayType;
        this.action = action;
    }
}

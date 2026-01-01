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
    TOKEN_AUTHENTICATION_FAILED(
	    HttpStatus.FORBIDDEN, // 403 Forbidden: 접근 권한이 유효하지 않아 거부됨
	    "링크가 유효하지 않습니다.",
	    "링크 정보가 유효하지 않거나 만료되었습니다. 메일을 재전송하여 다시 시도해 주세요.",
	    false, 
	    ErrorType.ERROR,
	    ErrorDisplayType.ALERT_MODAL, 
	    ErrorAction.REDIRECT_TO_HOME
	),
    

    // ====================================================================================
    // 👤 회원 (MEMBER)
    // ====================================================================================
    
    LOGIN_FAILED(
	    HttpStatus.BAD_REQUEST, // 400 Bad Request
	    "아이디 또는 비밀번호를 다시 확인해주세요.", 
	    "",
	    false, 
	    ErrorType.WARNING, 
	    ErrorDisplayType.TOAST,
	    ErrorAction.NONE
	),
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
    // 이메일 변경시
    SAME_EMAIL_AS_CURRENT(
	    HttpStatus.BAD_REQUEST, // 400 Bad Request
	    "새로운 이메일 주소가 현재 이메일 주소와 동일합니다.", 
	    "",
	    false, // silent: true (경고이므로 TOAST 표시)
	    ErrorType.WARNING, 
	    ErrorDisplayType.TOAST, // 토스트 팝업으로 간결하게 표시
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
    TARGET_USER_NOT_FOUND(
	    HttpStatus.NOT_FOUND, // 404 Not Found (INTERNAL_SERVER_ERROR 대신 404가 더 정확)
	    "사용자 정보를 찾을 수 없습니다.",
	    "제공된 정보와 일치하는 사용자 계정을 찾을 수 없습니다. 이미 계정이 삭제되었거나, 시스템 오류가 발생했을 수 있습니다.",
	    false, 
	    ErrorType.ERROR, 
	    ErrorDisplayType.ALERT_MODAL, 
	    ErrorAction.REDIRECT_TO_HOME
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
    USER_NOT_FOUND_FOR_RESET(
        // 🔴 중요: 이 코드는 GlobalExceptionHandler에서 잡지 않고, 
        // 서비스 레이어의 비밀번호 찾기 로직에서만 잡아서 처리해야 합니다.
        // 최종 응답은 보안을 위해 HTTP 200 OK로 나갑니다.
        
        HttpStatus.NOT_FOUND, 
        "비밀번호 재설정을 위한 계정을 찾을 수 없습니다.", 
        "", // description 비워둠
        true, // silent: true (보안상의 이유로 사용자에게 직접 토스트/모달을 띄우지 않습니다.)
        ErrorType.WARNING, // type: 'warning' (시스템 오류가 아닌, 사용자 입력 부재)
        ErrorDisplayType.TOAST, // silent=true 이므로 실질적으로 의미 없음
        ErrorAction.NONE
    ),
    // 로그인 시
    INVALID_PASSWORD(
        HttpStatus.BAD_REQUEST, 
        "비밀번호가 올바르지 않습니다.", 
        "",
        false, // silent: false
        ErrorType.WARNING, // type: 'warning'
        ErrorDisplayType.TOAST,
        ErrorAction.NONE
    ),
    // 회원 정보 수정시
    PASSWORD_AUTHENTICATION_FAILED(
	    HttpStatus.BAD_REQUEST, // 401 Unauthorized (인증 실패) 또는 BAD_REQUEST (400)도 가능
	    "현재 비밀번호가 올바르지 않습니다.", 
	    "",
	    false, 
	    ErrorType.WARNING, 
	    ErrorDisplayType.TOAST, 
	    ErrorAction.NONE
	),
    SAME_PASSWORD_NOT_ALLOWED(
		HttpStatus.BAD_REQUEST, 
	    "새 비밀번호는 기존 비밀번호와 달라야 합니다.", 
	    "", 
	    false, 
	    ErrorType.WARNING, 
	    ErrorDisplayType.ALERT_MODAL, // 중요 정보이므로 모달을 권장
	    ErrorAction.NONE
    ),      
    
    // 모달 (Modal) 필요 (데이터 지속성 및 안정성 관련 치명적 오류)
    UPDATE_FAILED(
        HttpStatus.INTERNAL_SERVER_ERROR, 
        "업데이트에 실패했습니다.", 
        "요청하신 데이터 업데이트 과정에서 오류가 발생했습니다. 잠시 후 다시 시도하거나, 변경 사항을 확인해 주세요.",
        false, // silent: false
        ErrorType.ERROR, // type: 'error'
        ErrorDisplayType.ALERT_MODAL, // displayType: 'modal', ModalType: 'confirm'
        ErrorAction.RELOAD_PAGE // action: 'REDIRECT_TO_LOGIN'
    ),
	
	// 비밀번호 찾기 시 카카오 소셜 계정 에러 정의
	SOCIAL_KAKAO_USER_CANNOT_RESET_PASSWORD(
	    HttpStatus.BAD_REQUEST, 
	    "이 계정은 카카오 계정입니다. 카카오 로그인 버튼을 이용해 주세요.", 
	    "", 
	    false, 
	    ErrorType.WARNING, 
	    ErrorDisplayType.TOAST, 
	    ErrorAction.NONE 
	),

	// 비밀번호 찾기 시 구글 소셜 계정 에러 정의
	SOCIAL_GOOGLE_USER_CANNOT_RESET_PASSWORD(
	    HttpStatus.BAD_REQUEST, 
	    "이 계정은 구글 계정입니다. 구글 로그인 버튼을 이용해 주세요.", 
	    "", 
	    false, 
	    ErrorType.WARNING, 
	    ErrorDisplayType.TOAST, 
	    ErrorAction.NONE 
	),
	
	// Redis에 인증 코드가 없거나 만료되었을 때 발생하는 에러 정의
    // ErrorType: WARNING, ErrorDisplayType: TOAST, ErrorAction: NONE 적용
    VERIFICATION_CODE_EXPIRED(
        HttpStatus.BAD_REQUEST, 
        "인증 코드가 만료되었거나 유효하지 않습니다. 코드를 재전송해 주세요.", 
        "", 
        false, 
        ErrorType.WARNING, 
        ErrorDisplayType.TOAST, 
        ErrorAction.NONE
    ),

	// 인증 코드 재전송 1분당 3회 제한
	VERIFICATION_CODE_RESEND_LIMIT(
		HttpStatus.BAD_REQUEST,
		"인증 코드 재전송은 1분당 3회로 제한됩니다.",
		"",
		false,
		ErrorType.WARNING,
		ErrorDisplayType.TOAST,
		ErrorAction.NONE
	),

	// 인증 코드 불일치
	VERIFICATION_CODE_MISMATCH(
		HttpStatus.BAD_REQUEST,
		"인증 코드가 일치하지 않습니다.",
		"",
		false,
		ErrorType.WARNING,
		ErrorDisplayType.TOAST,
		ErrorAction.NONE
	),

	// 인증 실패 횟수 5회 초과
	VERIFICATION_CODE_FAILURE_LIMIT(
		HttpStatus.BAD_REQUEST,
		"인증 코드 5회 오류. 보안을 위해 재전송을 통해 새로운 코드를 받아주세요.",
		"",
		false,
		ErrorType.ERROR,
		ErrorDisplayType.ALERT_MODAL,
		ErrorAction.NONE
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

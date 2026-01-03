package com.todoMaster.user.vo;

public enum ProfileImageStatus {
	NONE,      // 프로필 이미지가 디폴트로 사용될때
	READY,    // 프로필 이미지가 활성화되어 정상적으로 사용 중
	TEMP,     // 프로필 이지미가 임시 등록 상태
    FAILED,     // 이미지 업로드 또는 처리 중 오류가 발생하여 비정상 상태 (경고 필요)
    CONFIRM,   // 이미지 오류 관련 경고 확인 후 상태
    
}

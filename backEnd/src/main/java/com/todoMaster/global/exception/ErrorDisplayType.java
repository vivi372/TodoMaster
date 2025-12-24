package com.todoMaster.global.exception;

import lombok.Getter;

@Getter
public enum ErrorDisplayType {
	/** 클라이언트에서 토스트 메시지로 출력 */
    TOAST("toast"),
    
    /** 클라이언트에서 alert 모달 창으로 출력 */
    ALERT_MODAL("alertModal"),
    
    /** 클라이언트에서 confirm 모달 창으로 출력 */
    CONFIRM_MODAL("confirmModal");
	
	private final String value;
	
	ErrorDisplayType(String value) {
		this.value = value;
	}
}

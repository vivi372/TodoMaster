package com.todoMaster.global.exception;

import lombok.Getter;

@Getter
public enum ErrorAction {
	NONE("NONE"),
	/** 로그인 창으로 리다이렉션 */
	REDIRECT_TO_LOGIN("REDIRECT_TO_LOGIN"),
	
	/** 현재 페이지 새로고침 */
	RELOAD_PAGE("RELOAD_PAGE"),
	
	/** 로그아웃 처리 후 로그인 페이지로 이동 */
	LOGOUT_AND_REDIRECT("LOGOUT_AND_REDIRECT"),
	
	/** 홈 페이지로 리다이렉션 */
	REDIRECT_TO_HOME("REDIRECT_TO_HOME");
	
	private final String value;
	
	ErrorAction(String value) {
		this.value = value;
	}
}

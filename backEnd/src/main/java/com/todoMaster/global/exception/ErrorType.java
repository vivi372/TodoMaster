package com.todoMaster.global.exception;

import lombok.Getter;

@Getter
public enum ErrorType {
	ERROR("error"),
	WARNING("warning"),
	INFO("info");
	
	private final String value;
	
	ErrorType(String value) {
		this.value = value;
	}
}

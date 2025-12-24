package com.todoMaster.common.dto.request;

import lombok.Getter;

@Getter
public class PresignRequest {
	 // "temp/profile" 또는 "user/profile"	
    private String directory;

    // "image/png", "image/jpeg"	
    private String contentType;
}

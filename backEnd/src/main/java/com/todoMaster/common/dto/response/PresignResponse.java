package com.todoMaster.common.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PresignResponse {
	private String uploadUrl;   // Presigned URL
    private String objectKey;   // S3 Object Key (DB 저장용)
}

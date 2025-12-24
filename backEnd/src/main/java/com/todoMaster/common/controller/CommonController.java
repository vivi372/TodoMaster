package com.todoMaster.common.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.todoMaster.common.dto.request.PresignRequest;
import com.todoMaster.common.dto.response.PresignResponse;
import com.todoMaster.common.service.S3Service;
import com.todoMaster.global.dto.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/common")
@RequiredArgsConstructor
public class CommonController {
	
	private final S3Service s3Service;

	@PostMapping("/files/presign")
    public ResponseEntity<?> getPresignedUrl(@RequestBody PresignRequest request) {

        var result = s3Service.generatePresignedUrl(
                request.getDirectory(),
                request.getContentType()
        );
        
        ApiResponse<PresignResponse> response = ApiResponse.success(
        		"PresignedUrl 발급 성공"
        		, new PresignResponse(result.url(), result.objectKey())
        );

        return ResponseEntity.ok(response);
    }
}

package com.todoMaster.common.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.todoMaster.common.service.CommonService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/common")
@RequiredArgsConstructor
public class CommonController {
	
	private final CommonService commonService;

    @PostMapping("/upload-profile")
    public ResponseEntity<?> uploadProfile(
            @RequestPart("file") MultipartFile file
    ) {
        String url = commonService.uploadProfileImage(file);
        return ResponseEntity.ok().body(url);
    }
}

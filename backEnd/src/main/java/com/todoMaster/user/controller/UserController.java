package com.todoMaster.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.todoMaster.auth.dto.response.LoginResponse;
import com.todoMaster.auth.util.JwtProvider;
import com.todoMaster.common.service.S3Service;
import com.todoMaster.global.dto.ApiResponse;
import com.todoMaster.user.dto.request.ChangePasswordRequest;
import com.todoMaster.user.dto.request.UserUpdateRequest;
import com.todoMaster.user.dto.response.UserProfileResponse;
import com.todoMaster.user.dto.response.UserSummaryProfileResponse;
import com.todoMaster.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtProvider jwtProvider;
    private final S3Service s3Service;

    /**
     * 회원 정보 수정
     */
    @PutMapping("/me")
    public ResponseEntity<?> updateMyInfo(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody UserUpdateRequest request) {

        // Access Token에서 userId 추출
        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtProvider.getUserId(token);

        userService.updateUser(userId, request);

        return ResponseEntity.ok(ApiResponse.success("회원 정보가 수정되었습니다."));
    }
    
    @PatchMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        
        return ResponseEntity.ok(ApiResponse.success("비밀번호가 변경되었습니다."));
    }
    
    @GetMapping("/me/summary")
    public ResponseEntity<?> getSummaryMyInfo() {
    	
    	// db에서 프로필 정보 조회
    	UserSummaryProfileResponse profile = userService.getSummaryMyInfo();
    	
    	// 프로필 이미지의 저장위치가 S3일 경우 Presigned URL 생성
    	if(profile.getProfileImg().startsWith("S3:")) {
    		// 1. S3 안에 오브젝트 키와 맞추기 위해 S3: 제거
    		String objectKey = s3Service.removeS3Prefix(profile.getProfileImg());
    		
    		// 2. 오브젝트 키를 통해 presignedUrl 생성
    		String presignedUrl = s3Service.generateGetUrl(objectKey);
    		
    		// 3. 생성된 presignedUrl를 UserSummaryProfileResponse에 저장
    		profile.setProfileImg(presignedUrl);
    	}
    	
    	
		ApiResponse<UserSummaryProfileResponse> response = ApiResponse.success(
			"회원 요약 정보 가져오기 성공"
			, profile
		);
    	
        return ResponseEntity.ok(response);
    }   

    @GetMapping("/me")
    public ResponseEntity<?> getMyInfo() {
    	
    	 ApiResponse<UserProfileResponse> response = ApiResponse.success(
         		"회원 정보 가져오기 성공"
         		, userService.getMyInfo()
         );
    	
        return ResponseEntity.ok(response);
    }   
    
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount() {     

        userService.deleteUser();

        return ResponseEntity.ok(ApiResponse.success("회원 탈퇴 완료"));
    }
}

package com.todoMaster.user.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.todoMaster.auth.service.VerificationService;
import com.todoMaster.common.service.S3Service;
import com.todoMaster.global.dto.ApiResponse;
import com.todoMaster.user.dto.request.ChangePasswordRequest;
import com.todoMaster.user.dto.request.EmailChangeExecuteRequest;
import com.todoMaster.user.dto.request.EmailChangeRequestForKakaoUser;
import com.todoMaster.user.dto.request.UserUpdateRequest;
import com.todoMaster.user.dto.request.authenticateForEmailChangeRequest;
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
    private final VerificationService verificationService;
    private final S3Service s3Service;
    
    // ====================================================================================
    // 🟢  profile edit
    // ====================================================================================

    /**
     * 회원 정보 수정
     */
    @PutMapping("/me")
    public ResponseEntity<?> updateMyInfo(
            @Valid @RequestBody UserUpdateRequest request) {        

        userService.updateUser(request);

        return ResponseEntity.ok(ApiResponse.success("회원 정보가 수정되었습니다."));
    }    
    
    // ====================================================================================
    // 🟢  profile email change
    // ====================================================================================

    /**
     * 이메일 변경을 위해 이메일로 인증 코드 전송
     * 비밀번호 검증(1단계) -> 이메일로 인증 코드 전송(2단계)
     * @param req 
     */
    @PostMapping("/me/change/email/verification/request")
    public ResponseEntity<?> requestNewEmailVerificationCode(
    		@RequestBody @Valid authenticateForEmailChangeRequest req) {
    	// 1. 비밀번호 / 이메일 검증
    	userService.newEmailVerifi(req);
    	// 2. 이메일에 인증 코드 전송
    	verificationService.requestEmailChangeVerification(req.getEmail());
    	
    	return ResponseEntity.ok(ApiResponse.success("인증을 위한 인증코드가 전송되었습니다."));
    }
    
    /**
     * [카카오 사용자용] 이메일 변경을 위해 인증 코드 전송
     * @param req 새 이메일 주소를 포함하는 요청 DTO
     */
    @PostMapping("/me/change/email/verification/request/kakao")
    public ResponseEntity<?> requestEmailChangeForKakaoUser(
            @RequestBody @Valid EmailChangeRequestForKakaoUser req) {        

        // 1. 새 이메일 유효성 검증 (비밀번호 검증 생략)
        userService.newEmailVerifiForKakaoUser(req.getNewEmail());

        // 2. 이메일에 인증 코드 전송
        verificationService.requestEmailChangeVerification(req.getNewEmail());
        
        return ResponseEntity.ok(ApiResponse.success("인증을 위한 인증코드가 전송되었습니다."));
    }
    
    
    @PostMapping("/me/change/email/execute")
    public ResponseEntity<?> executeEmailChange(
            @RequestBody @Valid EmailChangeExecuteRequest req) {
        
        // 1. VerificationService를 통해 인증 코드 검증
        boolean isVerified = verificationService.verifyVerificationCode(req.getNewEmail(), req.getVerificationCode());

        // 2. 검증 성공 시 UserService를 통해 이메일 변경
        if (isVerified) {
            userService.updateUserEmail(req.getNewEmail());
        }
        
        return ResponseEntity.ok(ApiResponse.success("이메일이 성공적으로 변경되었습니다."));
    }
  

	/**
	 * 인증 코드 재전송
	 */
	@PostMapping("/me/change/email/verification/resend")
	public ResponseEntity<?> resendVerificationCode(
			@RequestBody Map<String, String> request) {
		String email = request.get("email");
		verificationService.resendVerificationCode(email);
		return ResponseEntity.ok(ApiResponse.success("인증 코드가 재전송되었습니다."));
	}
    
    
    // ====================================================================================
    // 🟢  password change
    // ====================================================================================

    /**
     * 사용자 비밀번호를 변경합니다.
     * @param request 비밀번호 변경 요청 데이터 (현재, 새, 새 확인)
     * @return 성공 메시지
     */
    @PatchMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        userService.changePassword(request);
        
        return ResponseEntity.ok(ApiResponse.success("비밀번호가 변경되었습니다."));
    }
    
    // ====================================================================================
    // 🟢  profile show
    // ====================================================================================

    
    @GetMapping("/me/summary")
    public ResponseEntity<?> getSummaryMyInfo() {
    	
    	// db에서 프로필 정보 조회
    	UserSummaryProfileResponse profile = userService.getSummaryMyInfo();
    	
    	// 프로필 이미지의 저장위치가 S3일 경우 Presigned URL 생성
    	if(profile.getProfileImg() != null && profile.getProfileImg().startsWith("S3:")) {
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
    
    // 이미지 경고 확인 여부 변경
    @PostMapping("/acknowledge-image-warning")
    public ResponseEntity<?> acknowledgeImageWarning() {
    	
    	userService.acknowledgeImageWarning();    	
    	
        return ResponseEntity.ok(ApiResponse.success("이미지 경고 확인 여부 수정 완료"));
    }   

    @GetMapping("/me")
    public ResponseEntity<?> getMyInfo() {
    	// db에서 프로필 정보 조회
    	UserProfileResponse profile = userService.getMyInfo();
    	
    	// 프로필 이미지의 저장위치가 S3일 경우 Presigned URL 생성
    	if(profile.getProfileImg() != null && profile.getProfileImg().startsWith("S3:")) {
    		// 1. S3 안에 오브젝트 키와 맞추기 위해 S3: 제거
    		String objectKey = s3Service.removeS3Prefix(profile.getProfileImg());
    		
    		// 2. 오브젝트 키를 통해 presignedUrl 생성
    		String presignedUrl = s3Service.generateGetUrl(objectKey);
    		
    		// 3. 생성된 presignedUrl를 UserSummaryProfileResponse에 저장
    		profile.setProfileImg(presignedUrl);
    	}
    	
    	ApiResponse<UserProfileResponse> response = ApiResponse.success(
         	"회원 정보 가져오기 성공"
         	, profile
        );
    	
        return ResponseEntity.ok(response);
    }   
    
    // ====================================================================================
    // 🟢  delete user
    // ====================================================================================

    
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount() {     

        userService.deleteUser();

        return ResponseEntity.ok(ApiResponse.success("회원 탈퇴 완료"));
    }
}
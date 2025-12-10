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

import com.todoMaster.auth.dto.LoginResponse;
import com.todoMaster.auth.util.JwtProvider;
import com.todoMaster.global.dto.ApiResponse;
import com.todoMaster.user.dto.ChangePasswordRequest;
import com.todoMaster.user.dto.UserProfileResponse;
import com.todoMaster.user.dto.UserUpdateRequest;
import com.todoMaster.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtProvider jwtProvider;

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

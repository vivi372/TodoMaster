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

import com.todoMaster.auth.util.JwtProvider;
import com.todoMaster.user.dto.ChangePasswordRequest;
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

        return ResponseEntity.ok("회원 정보가 수정되었습니다.");
    }
    
    @PatchMapping("/password")
    public void changePassword(@RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyInfo() {
        return ResponseEntity.ok(userService.getMyInfo());
    }   
    
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount() {     

        userService.deleteUser();

        return ResponseEntity.ok().body("회원 탈퇴 완료");
    }
}

package com.todoMaster.user.dto.response;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 유저 프로필 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    // 로그인 이메일
    private String email;
    // 사용자 닉네임
    private String nickname;
    // 프로필 이미지 URL
    private String profileImg;
    // 프로필 이미지 상태
    private String profileImageStatus;
    // 가입일
    private LocalDate createdAt;
    // GOOGLE / KAKAO / NAVER
    private String provider;
    // 등록한 todo 수
    private Long totalTodos;
    // 완료된 todo 수
    private Long completedTodos;
    // todo 카테고리 수
    private int categories;
}

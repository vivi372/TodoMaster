package com.todoMaster.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 유저 요약 프로필 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryProfileResponse {	
    // 사용자 이름
    private String nickname;    
    // 프로필 이미지 URL
    private String profileImg;    
}

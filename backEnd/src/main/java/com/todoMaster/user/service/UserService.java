package com.todoMaster.user.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.user.dto.ChangePasswordRequest;
import com.todoMaster.user.dto.UserProfileResponse;
import com.todoMaster.user.dto.UserUpdateRequest;
import com.todoMaster.user.mapper.UserMapper;
import com.todoMaster.user.vo.UserInfoVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
	
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;
	
	@Transactional
    public void updateUser(Long userId, UserUpdateRequest request) {

        int result = userMapper.updateUserInfo(userId, request);

        if (result == 0) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }
    }
	
	 /**
     * 현재 로그인한 사용자의 비밀번호를 변경한다.
     * - SecurityContext의 Authentication.principal에 userId를 넣어두었다는 전제.
     */
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        Long userId = getCurrentUserId();

        // 1) 사용자 조회
        UserInfoVO user = userMapper.findById(userId);
        if (user == null) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }

        // 2) 현재 비밀번호 검증
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD);
        }

        // 3) 새 비밀번호가 기존과 동일한지 검사
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.SAME_PASSWORD_NOT_ALLOWED);
        }

        // 4) 새 비밀번호 암호화 및 업데이트
        String encoded = passwordEncoder.encode(request.getNewPassword());
        int updated = userMapper.updatePassword(userId, encoded);
        if (updated == 0) {
            throw new CustomException(ErrorCode.UPDATE_FAILED);
        }
    }
    
    @Transactional(readOnly = true)
    public UserProfileResponse getMyInfo() {
        Long userId = getCurrentUserId();

        UserInfoVO user = userMapper.findById(userId);

        if (user == null) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }

        return UserProfileResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profileImg(user.getProfileImg())
                .provider(user.getProvider())
                .build();
    }

    /**
     * SecurityContext에서 현재 인증된 사용자 ID를 꺼낸다.
     * - JwtAuthenticationFilter에서 principal을 userId로 넣어두었으면 그대로 Long으로 캐스팅 가능.
     * - 프로젝트에 따라 principal 타입이 다르면 이 부분을 조정해야 한다.
     */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED_USER);
        }

        Object principal = auth.getPrincipal();

        // principal을 Long으로 직접 담아뒀을 경우
        if (principal instanceof Long) {
            return (Long) principal;
        }

        // principal이 String(userId)로 들어있을 경우
        if (principal instanceof String) {
            try {
                return Long.valueOf((String) principal);
            } catch (NumberFormatException e) {
                throw new CustomException(ErrorCode.INVALID_TOKEN);
            }
        }

        // principal이 다른 타입(UserDetails 등)이면 예시대로 처리하거나 확장 필요
        throw new CustomException(ErrorCode.INVALID_TOKEN);
    }
}


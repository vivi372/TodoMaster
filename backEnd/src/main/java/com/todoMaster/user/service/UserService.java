package com.todoMaster.user.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.global.s3.S3Uploader;
import com.todoMaster.user.dto.request.ChangePasswordRequest;
import com.todoMaster.user.dto.request.UserUpdateRequest;
import com.todoMaster.user.dto.response.UserProfileResponse;
import com.todoMaster.user.dto.response.UserSummaryProfileResponse;
import com.todoMaster.user.mapper.UserMapper;
import com.todoMaster.user.vo.UserInfoVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
	
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;
	private final S3Uploader s3Uploader;
	
	@Transactional
    public void updateUser(Long userId, UserUpdateRequest request) {
		
		UserInfoVO oldUser = userMapper.findById(userId);
		if (oldUser == null) {
	        throw new CustomException(ErrorCode.USER_NOT_FOUND);
	    }
		
		String newImgUrl = request.getProfileImg();  // 프론트에서 전달한 새 URL

		try {
	        int result = userMapper.updateUserInfo(userId, request);

	        if (result == 0) {
	            throw new CustomException(ErrorCode.USER_NOT_FOUND);
	        }

	        // 기존 이미지 삭제 조건
	        if (newImgUrl != null
	                && oldUser.getProfileImg() != null
	                && !oldUser.getProfileImg().equals(newImgUrl)) {

	            s3Uploader.delete(oldUser.getProfileImg());
	        }

	    } catch (Exception e) {
	        // 🔥 DB 수정 실패 → 새로 업로드된 이미지 삭제 (롤백)
	        if (newImgUrl != null
	                && (oldUser.getProfileImg() == null || !oldUser.getProfileImg().equals(newImgUrl))) {

	            try {
	                s3Uploader.delete(newImgUrl);
	            } catch (Exception s3e) {
	                System.err.println("이미지 롤백 삭제 실패: " + s3e.getMessage());
	            }
	        }

	        throw e;
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
    public UserSummaryProfileResponse getSummaryMyInfo() {
        Long userId = getCurrentUserId();

        UserInfoVO user = userMapper.findById(userId);

        if (user == null) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }

        return UserSummaryProfileResponse.builder()
                .nickname(user.getNickname())
                .profileImg(user.getProfileImg())
                .build();
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
     * 회원 삭제
     * @param userId 삭제할 회원 아이디
     */
    @Transactional
    public void deleteUser() {
    	
    	Long userId = getCurrentUserId();

        UserInfoVO user = userMapper.findById(userId);

        if (user == null) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }

        String profileImg = user.getProfileImg();

        try {
            // 1) 유저 데이터 삭제
            int result = userMapper.deleteUser(userId);

            if (result == 0) {
                throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
            }

            // 2) 기존 프로필 이미지가 있다면 S3에서 삭제
            if (profileImg != null) {
                s3Uploader.delete(profileImg);
            }

        } catch (Exception e) {
            // 🔥 실패하면 S3 이미 삭제되었을 수도 있으므로
            // 여기서는 S3 롤백은 하지 않음(삭제는 롤백 불가능), DB만 롤백됨.
            throw e;
        }
    }

    /**
     * SecurityContext에서 현재 인증된 사용자 ID를 꺼낸다.
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


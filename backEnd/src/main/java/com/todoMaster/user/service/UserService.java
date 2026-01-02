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
import com.todoMaster.user.dto.request.authenticateForEmailChangeRequest;
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
	
	// ====================================================================================
    // 🟢  profile edit
    // ====================================================================================
	
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
	
    // ====================================================================================
    // 🟢  profile email change
    // ====================================================================================

	/** 이메일 변경 요청값 검증 */
	public void newEmailVerifi(authenticateForEmailChangeRequest req) {
		Long userId = getCurrentUserId();
		
		// 1. 사용자 조회
        UserInfoVO user = userMapper.findById(userId);
        if (user == null) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }

        // 2. 현재 비밀번호 검증
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.PASSWORD_AUTHENTICATION_FAILED);
        }
        
        // 3. 기존 이메일과 동일한지 검증
        if(user.getEmail().equals(req.getEmail())) {
        	throw new CustomException(ErrorCode.SAME_EMAIL_AS_CURRENT);
        }
        
        // 4. 사용중인 이메일인지 검증        
        if(userMapper.selectUser(req.getEmail()) != null) {
        	throw new CustomException(ErrorCode.EMAIL_DUPLICATION);
        }
        
	}	

	/** 카카오 사용자의 이메일 변경 요청값 검증 */
	public void newEmailVerifiForKakaoUser(String newEmail) {
		// 1. 사용자 조회
		Long userId = getCurrentUserId();
		UserInfoVO user = userMapper.findById(userId);
		if (user == null) {
			throw new CustomException(ErrorCode.USER_NOT_FOUND);
		}

		// 2. 기존 이메일과 동일한지 검증
		if(user.getEmail() != null && user.getEmail().equals(newEmail)) {
			throw new CustomException(ErrorCode.SAME_EMAIL_AS_CURRENT);
		}
		
		// 3. 사용중인 이메일인지 검증        
		if(userMapper.selectUser(newEmail) != null) {
			throw new CustomException(ErrorCode.EMAIL_DUPLICATION);
		}
	}
	
	/** 이메일 변경 */
	@Transactional
	public void updateUserEmail(String newEmail) {
		Long userId = getCurrentUserId();
		int updated = userMapper.updateEmail(userId, newEmail);
		if (updated == 0) {
			throw new CustomException(ErrorCode.UPDATE_FAILED);
		}
	}
	
    // ====================================================================================
    // 🟢  password change
    // ====================================================================================
	
	/**
     * 현재 로그인한 사용자의 비밀번호를 변경합니다.
     *
     * @param request 비밀번호 변경 요청 DTO (현재 비밀번호, 새 비밀번호, 새 비밀번호 확인)
     * @throws CustomException 여러 검증 단계에서 실패 시 발생
     */
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        // 1. **인증 및 식별**: SecurityContext에서 현재 인증된 사용자의 ID를 가져옵니다.
        // 이 로직은 getCurrentUserId() 메서드에 캡슐화되어 있으며, 토큰이 없거나 유효하지 않으면 CustomException을 발생시킵니다.
        Long userId = getCurrentUserId();

        // 2. **사용자 조회**: DB에서 사용자 정보를 조회합니다.
        UserInfoVO user = userMapper.findById(userId);
        if (user == null) {
            // 방어 로직: 정상적인 토큰으로 사용자를 찾을 수 없는 경우. 토큰 탈취 후 계정이 삭제된 경우를 대비합니다.
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }

        // 3. **Provider 체크**: 소셜 로그인 사용자인지 확인합니다.
        // 'standard' 사용자가 아닌 경우, 비밀번호 변경 기능 사용을 차단합니다.
        if (user.getProvider() != null) {
            throw new CustomException(ErrorCode.USER_PROVIDER_MISMATCH);
        }

        // 4. **현재 비밀번호 검증**: 입력된 현재 비밀번호가 DB에 저장된 해시값과 일치하는지 확인합니다.
        // passwordEncoder.matches()는 평문과 해시를 안전하게 비교합니다.
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.PASSWORD_AUTHENTICATION_FAILED);
        }

        // 5. **새 비밀번호와 기존 비밀번호 동일 여부 체크**: 보안을 위해 현재 비밀번호와 동일한 비밀번호로 변경하는 것을 방지합니다.
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.SAME_PASSWORD_NOT_ALLOWED);
        }

        // 6. **비밀번호 변경 및 저장**: 모든 검증을 통과한 후, 새 비밀번호를 암호화하여 DB에 저장합니다.
        // BCryptPasswordEncoder를 사용하여 강력한 해시를 생성합니다.
        String encodedNewPassword = passwordEncoder.encode(request.getNewPassword());
        int updatedRows = userMapper.updatePassword(userId, encodedNewPassword);

        // 7. **업데이트 결과 확인**: 업데이트가 실제로 이루어졌는지 확인합니다.
        // 영향 받은 행이 0개일 경우, 프로세스 중 문제가 발생했음을 의미합니다. (예: DB 연결 문제)
        if (updatedRows == 0) {
            throw new CustomException(ErrorCode.UPDATE_FAILED);
        }
    }
    
    // ====================================================================================
    // 🟢  profile show
    // ====================================================================================
 
    @Transactional(readOnly = true)
    public UserSummaryProfileResponse getSummaryMyInfo() {
        Long userId = getCurrentUserId();

        UserInfoVO user = userMapper.findById(userId);

        if (user == null) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }
        
        boolean isImageWarningShown = false;
        
        // 이미지 오류 경고 여부 확인
        // 프로필 이미지 상태가 FAILED 경우에만 경고 출력(최초 1회만)
        if(user.getProfileImageStatus().equals("FAILED")) {
        	isImageWarningShown = true;
        }
        
        return UserSummaryProfileResponse.builder()
                .nickname(user.getNickname())
                .profileImg(user.getProfileImg())
                .isImageWarningShown(isImageWarningShown)
                .build();
    }
    
    @Transactional
    public void acknowledgeImageWarning() {
    	// 1. userId 가져오기
        Long userId = getCurrentUserId();    
        // 2. profileImageStatus를 CONFIRM(오류 확인 상태)로 설정
        String profileImageStatus = "CONFIRM";
        // 3. DB 수정
        int updated = userMapper.updateProfileImageStatus(userId, profileImageStatus);
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
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profileImg(user.getProfileImg())
                .profileImageStatus(user.getProfileImageStatus())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .totalTodos(0L) // after) totalTodos / completedTodos / categories는 투두 구현전이라서 하드코딩
                .completedTodos(0L)
                .categories(0)
                .build();
    }
    
    // ====================================================================================
    // 🟢  delete user
    // ====================================================================================

    
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


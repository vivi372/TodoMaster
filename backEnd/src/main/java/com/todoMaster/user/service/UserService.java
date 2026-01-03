package com.todoMaster.user.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.common.service.S3Service; // S3Uploader 대신 common.service.S3Service 사용
import com.todoMaster.user.dto.request.ChangePasswordRequest;
import com.todoMaster.user.dto.request.UserUpdateRequest;
import com.todoMaster.user.dto.request.authenticateForEmailChangeRequest;
import com.todoMaster.user.dto.response.UserProfileResponse;
import com.todoMaster.user.dto.response.UserSummaryProfileResponse;
import com.todoMaster.user.mapper.UserMapper;
import com.todoMaster.user.vo.UserInfoVO;
import com.todoMaster.user.vo.ProfileImageStatus; // ProfileImageStatus 임포트

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // 로그 사용을 위해 임포트

@Service
@RequiredArgsConstructor
@Slf4j // 로그 사용
public class UserService {
	
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;
	private final S3Service s3Service; // S3Service 주입
	
	// ====================================================================================
    // 🟢  profile edit
    // ====================================================================================
	
	@Transactional
    public void updateUser(UserUpdateRequest request) {
		// 1. 사용자 조회 (DB에서 현재 사용자 정보 및 기존 프로필 이미지 확보)
		Long userId = getCurrentUserId();
		UserInfoVO oldUser = userMapper.findById(userId);
		if (oldUser == null) {
	        throw new CustomException(ErrorCode.USER_NOT_FOUND); // 사용자를 찾을 수 없습니다.
	    }
		
		// 2. 요청 데이터 검증 및 업데이트		
		String newProfileImgKey = request.getProfileImg();  // 프론트에서 전달한 새 프로필 이미지 S3 Object Key (with "S3:" prefix)
		String oldProfileImgKey = oldUser.getProfileImg();  // DB에 저장된 기존 프로필 이미지 S3 Object Key (with "S3:" prefix)
        
		String finalProfileImgKeyForDb = oldProfileImgKey; // DB에 최종 저장될 프로필 이미지 키 (S3: 포함)
		ProfileImageStatus profileImageStatus = oldUser.getProfileImageStatus(); // DB에 최종 저장될 프로필 이미지 상태
		
		boolean isImageChanged = false; // 이미지 변경 여부 플래그
		
		// 3. 프로필 이미지 변경 여부 판단 및 처리
		// 요청 profileImg ≠ 기존 profileImg 인 경우만 처리
		if ((newProfileImgKey == null && oldProfileImgKey != null) || // 새 이미지가 없고 기존 이미지는 있는 경우 (삭제)
		    (newProfileImgKey != null && !newProfileImgKey.equals(oldProfileImgKey))) { // 새 이미지가 있고 기존 이미지와 다른 경우 (변경)
		    
			isImageChanged = true;
			
            // 3-1. 기존 이미지 삭제 (조건부)
            // 기존 이미지가 있고, 기본 이미지가 아니며(DB 값이 null 아닐 경우), 새 이미지와 다를 경우 S3 삭제
            if (oldProfileImgKey != null && profileImageStatus != ProfileImageStatus.NONE) { // ProfileImageStatus가 NONE 아닐 경우로 판단
                try {
                    s3Service.delete(s3Service.removeS3Prefix(oldProfileImgKey));
                    log.info("Old profile image deleted from S3: {}", oldProfileImgKey);
                } catch (Exception e) {
                    log.warn("Failed to delete old profile image from S3: {}. Error: {}", oldProfileImgKey, e.getMessage());
                    // 삭제 실패 시 로그만 남기고 에러는 throw 하지 않음 
                }
            }

            // 3-2. 새 이미지 처리 분기
            if (newProfileImgKey != null) { // 새 이미지가 있는 경우
                String cleanedNewProfileImgKey = s3Service.removeS3Prefix(newProfileImgKey); // "S3:" 접두사 제거
                
                // Case A. profileImg가 tmp 경로일 때 (S3:temp/profile/...)
                if (cleanedNewProfileImgKey.startsWith("temp/profile/")) {
                    String targetKey = "user/" + oldUser.getUserId() + "/profile.png"; // 영구 경로 생성
                    try {
                        s3Service.move(cleanedNewProfileImgKey, targetKey); // S3Service move 사용
                        finalProfileImgKeyForDb = "S3:" + targetKey; // DB에는 **정식 profile 경로 URL** 저장 (S3: 접두사 다시 추가)
                        profileImageStatus = ProfileImageStatus.READY; // 이미지 상태를 READY로 변경
                        log.info("Profile image moved from {} to {}", cleanedNewProfileImgKey, targetKey);
                    } catch (CustomException e) {
                        // 파일 이동 실패는 사용자에게 알림 (FILE_MOVE_FAILED)
                        throw e;
                    } catch (Exception e) {
                        log.error("Failed to move profile image from {} to {}. Error: {}", cleanedNewProfileImgKey, targetKey, e.getMessage());
                        throw new CustomException(ErrorCode.FILE_MOVE_FAILED);
                    }
                } 
                // Case B. profileImg가 기존 profile 경로일 때 (S3:user/...) - 이 경우는 newProfileImgKey == oldProfileImgKey 와 중복
                // 혹은 이미 영구 경로에 있는 이미지를 다시 설정하는 경우. 이 때는 별도의 S3 처리 스킵.
                else if (cleanedNewProfileImgKey.startsWith("user/")) {
                    finalProfileImgKeyForDb = newProfileImgKey; // DB에 저장될 키는 그대로
                    profileImageStatus = ProfileImageStatus.READY;
                } else {
                    // 알 수 없는 경로이거나 유효하지 않은 S3 CDN URL (profile_edit.md의 검증 항목)
                    log.warn("Invalid profile image S3 key provided: {}", newProfileImgKey);
                    throw new CustomException(ErrorCode.INVALID_INPUT_VALUE); // 유효하지 않은 입력값입니다.
                }
            } else { // 새 이미지가 없는 경우 (프로필 이미지 삭제 요청)
                finalProfileImgKeyForDb = null; // DB에 null 저장
                profileImageStatus = ProfileImageStatus.NONE; // 이미지 상태를 DEFAULT로 변경
            }
		}
		
		// 4. DB 업데이트 시도
		try {
	        int result = userMapper.updateUserNickname(userId, request.getNickname()); // 닉네임 업데이트

	        if (result == 0) {
	            throw new CustomException(ErrorCode.UPDATE_FAILED); // 회원 정보 수정에 실패했습니다.
	        }
	        
	        // 이미지 변경이 있었을 경우에만 이미지 관련 DB 업데이트
	        if (isImageChanged) {
	        	int imgUpdateResult = userMapper.updateProfileImage(userId, finalProfileImgKeyForDb, profileImageStatus);
	        	if (imgUpdateResult == 0) {
		            throw new CustomException(ErrorCode.UPDATE_FAILED); // 프로필 이미지 수정에 실패했습니다.
		        }
	        }
	        
	    } catch (CustomException e) {
	        throw e; // 이미 CustomException으로 처리된 에러는 그대로 다시 던짐
	    } catch (Exception e) {
	        // 그 외 예외 발생 시 (DB 오류 등)
	        log.error("User profile update failed for userId: {}. Error: {}", userId, e.getMessage());
	        throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR); // 내부 서버 오류가 발생했습니다.
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
        if(user.getProfileImageStatus() == ProfileImageStatus.FAILED) {
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
        ProfileImageStatus profileImageStatus = ProfileImageStatus.CONFIRM;
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
                .profileImageStatus(user.getProfileImageStatus().name())
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
                s3Service.delete(s3Service.removeS3Prefix(profileImg)); // s3Uploader -> s3Service
            }

        } catch (Exception e) {
            // 🔥 실패하면 S3 이미 삭제되었을 수도 있으므로
            // 여기서는 S3 롤백은 하지 않음(삭제는 롤백 불가능), DB만 롤백됨.
            log.warn("Failed to delete S3 image during user deletion for userId: {}. Image: {}. Error: {}", userId, profileImg, e.getMessage());
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


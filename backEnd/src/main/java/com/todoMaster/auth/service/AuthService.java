package com.todoMaster.auth.service;

import com.todoMaster.auth.dto.response.LoginResponse;
import com.todoMaster.auth.dto.response.SocialLoginResponse;
import com.todoMaster.auth.dto.SocialUserInfo;
import com.todoMaster.auth.dto.request.LoginRequest;
import com.todoMaster.auth.dto.request.UserSignupRequest;
import com.todoMaster.auth.util.JwtProvider;
import com.todoMaster.auth.util.TokenHashUtil;
import com.todoMaster.common.service.S3Service;
import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.user.mapper.UserMapper;
import com.todoMaster.user.vo.ProfileImageStatus;
import com.todoMaster.user.vo.UserInfoVO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 인증 관련 비즈니스 로직 담당
 * - 로그인 (Access/Refresh 발급, DB에 refresh 저장)
 * - 리프레시 토큰으로 재발급
 * - 로그아웃 (DB refresh 삭제)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {


    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final TokenHashUtil tokenHashUtil;
    private final SocialOAuthProcessor socialOAuthProcessor;
    private final S3Service s3Service;
    private final VerificationService verificationService;
    
    @Transactional
    public void signup(UserSignupRequest req) {

        if (userMapper.countByEmail(req.getEmail()) > 0) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATION);
        }                  
        UserInfoVO vo = new UserInfoVO();
        vo.setEmail(req.getEmail());
        vo.setPassword(passwordEncoder.encode(req.getPassword()));
        vo.setNickname(req.getNickname());
        // 소셜 계정의 이미지 경로와 구분을 위해 S3: 추가
        vo.setIsVerified("UNVERIFIED"); // 이메일 인증 전에는 UNVERIFIED으로 저장
        
        if(vo.getProfileImg() != null) {
        	vo.setProfileImg("S3:"+req.getProfileImg());
        	vo.setProfileImageStatus(ProfileImageStatus.TEMP);
        } else {
        	vo.setProfileImageStatus(ProfileImageStatus.NONE);
        }

        int result = userMapper.insertUser(vo);

        if (result == 0) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
        
        // 사용자의 이메일로 인증 이메일 보내기
        verificationService.createVerificationTokenAndSendEmail(
        		vo.getEmail(),
        		vo.getUserId(),
        		vo.getNickname()
        	);       

    }
    
    // 인증 메일 재전송 서비스 메서드
    public void rseend(String email) {
    	// 1. 이메일을 통해 계정 정보 가져오기
    	UserInfoVO user = userMapper.selectUser(email);
    	if (user == null) throw new CustomException(ErrorCode.USER_NOT_FOUND);
    	
    	// 2. 사용자의 이메일로 인증 이메일 보내기
    	// 사용자의 이메일로 인증 이메일 보내기
        verificationService.createVerificationTokenAndSendEmail(
        		user.getEmail(),
        		user.getUserId(),
        		user.getNickname()
        	);

    }
    
    // 계정 활성화 서비스 메서드
    @Transactional
    public void accountActivation(UserInfoVO tokenUser) {   	
    	
    	// 1. 이메일 / userId DB에 존재하는지 조회
    	UserInfoVO storeUser = userMapper.selectUnverifiedUser(tokenUser.getUserId(),tokenUser.getEmail());
    	if (storeUser == null) throw new CustomException(ErrorCode.TARGET_USER_NOT_FOUND); 
    	
    	// 2. 검증 후 계정 활성화
    	userMapper.accountActivation(tokenUser.getUserId());
    	
        // temp 경로의 있던 이미지 경로 이동
        try {
        	if (storeUser.getProfileImg() != null) {
        		String newProfileImage = "S3:user/" + storeUser.getUserId() + "/profile.png";
                s3Service.move(
                		storeUser.getProfileImg(), // S3에는 키에 S3:가 없으므로 제거
                		newProfileImage);
                // 경로 이동 성공시 db READY로 업데이트
                // 소셜 계정의 이미지 경로와 구분을 위해 S3: 추가
                userMapper.updateProfileImage(storeUser.getUserId(),"S3:"+newProfileImage, ProfileImageStatus.READY);    
            }
        } catch (CustomException e) {      
        	// 경로 이동 실패시 db FAILED로 업데이트
            log.warn("Profile image move failed. userId={}",storeUser.getUserId(), e);
            userMapper.updateProfileImage(storeUser.getUserId(),storeUser.getProfileImg(), ProfileImageStatus.FAILED);
        }

    }

    /**
     * 로그인 처리
     * @return "access::refresh" 문자열 반환 — 컨트롤러에서 분리하여 처리
     */
    public LoginResponse login(LoginRequest req) {
        // 이메일로 사용자 조회
        UserInfoVO user = userMapper.selectVerifiedUser(req.getEmail());
        if (user == null) throw new CustomException(ErrorCode.LOGIN_FAILED);

        // 비밀번호 검증
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.LOGIN_FAILED);
        }

        // 액세스 토큰 생성
        String access = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());
        String refresh;

        // rememberMe에 따라 다른 유효기간의 리프레시 토큰 발급
        if (req.isRememberMe()) {
            refresh = jwtProvider.createLongRefreshToken(String.valueOf(user.getUserId()));
        } else {
            refresh = jwtProvider.createShortRefreshToken(String.valueOf(user.getUserId()));
        }

        // 1. 솔트 생성
        String salt = tokenHashUtil.generateSalt();
        // 2. 토큰 해싱
        String hashedToken = tokenHashUtil.hashToken(refresh, salt);
        // 3. DB에 저장
        int updated = userMapper.updateRefreshToken(user.getUserId(), hashedToken, salt);

        if (updated == 0) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }

        // 컨트롤러에서 refresh token은 쿠키로, access token은 body로 내려주도록 위임
        return new LoginResponse(access + "::" + refresh, "standard");
    }
    
    @Transactional
    public SocialLoginResponse socialLogin(String provider, String code) {

        // 1) provider로부터 사용자 정보 가져오기
        SocialUserInfo userInfo = socialOAuthProcessor.getUserFromProvider(provider, code);

        // 2) 이미 가입했는지 체크
        UserInfoVO existing = userMapper.findByProvider(provider, userInfo.getProviderId());

        Long userId;

        if (existing == null) {
            // ------- 새 사용자 자동가입  -------
            UserInfoVO vo = new UserInfoVO();
            vo.setEmail(userInfo.getEmail());
            vo.setNickname(userInfo.getNickname());
            vo.setProvider(provider);
            vo.setProviderId(userInfo.getProviderId());
            vo.setProfileImg(userInfo.getProfileImage());
            vo.setIsVerified("VERIFIED"); // 소셜 유저는 이메일 인증이 필요없으므로 VERIFIED 저장
            if(vo.getProfileImg() != null) {
            	vo.setProfileImageStatus(ProfileImageStatus.READY);
            } else {
            	vo.setProfileImageStatus(ProfileImageStatus.NONE);
            }

            int result = userMapper.insertUser(vo);
            userId = vo.getUserId();
            
            if (result == 0) {                
                throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
            }
            
        } else {
            userId = existing.getUserId();
        }

        // 3) Access / Refresh Token 생성
        String access = jwtProvider.createAccessToken(userId,userInfo.getEmail());
        String refresh = jwtProvider.createLongRefreshToken(String.valueOf(userId));

        // DB에 RefreshToken 등록
        // 1. 솔트 생성
        String salt = tokenHashUtil.generateSalt();
        
        // 2. 토큰 해싱
        String hashedToken = tokenHashUtil.hashToken(refresh, salt);
        
        // 3. DB에 저장
        userMapper.updateRefreshToken(userId, hashedToken, salt);

        return new SocialLoginResponse(access + "::" + refresh, provider);
    }


    /**
     * refresh 토큰으로 access 재발급 및 refresh 회전
     */
    public LoginResponse refresh(String refreshToken) {
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }
        Long userId = jwtProvider.getUserId(refreshToken);
        UserInfoVO user = userMapper.findById(userId);
        if (user == null) throw new CustomException(ErrorCode.USER_NOT_FOUND);
        

        String storedToken = user.getRefreshToken();
        String storedSalt = user.getSalt();
        
        if (storedToken == null) {
        	throw new CustomException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }
        
        if (storedToken == null || !tokenHashUtil.verifyToken(refreshToken, storedSalt, storedToken)) {
            throw new  CustomException(ErrorCode.REFRESH_TOKEN_MISMATCH);
        }

        // 토큰 재발급 (회전)
        String newAccess = jwtProvider.createAccessToken(userId, user.getEmail());
        String newRefresh = jwtProvider.rotateRefreshToken(refreshToken,String.valueOf(user.getUserId()));
        
        // 1. 솔트 생성
        String salt = tokenHashUtil.generateSalt();
        
        // 2. 토큰 해싱
        String hashedToken = tokenHashUtil.hashToken(newRefresh, salt);

        // DB 갱신
        int result = userMapper.updateRefreshToken(userId, hashedToken, salt);
        
        if (result == 0) {                
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
        
        String provider = user.getProvider() == null ? "standard" : user.getProvider();
        return new LoginResponse(newAccess + "::" + newRefresh, provider);
    }

    /**
     * 로그아웃: DB 저장된 refresh 토큰 삭제
     */
    public void logout(Long userId) {
    	int result = userMapper.updateRefreshToken(userId, null, null);
    	
    	if (result == 0) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 인증 메일 재전송 서비스 메서드
    public void passwordForgot(String email) {
    	// 1. 이메일을 통해 계정 정보 가져오기
    	UserInfoVO user = userMapper.selectVerifiedUser(email);
    	if (user == null) {
    		log.error("비밀번호 재설정을 위한 계정을 찾을 수 없습니다.");
    		return;
    	} // 보안을 위해 예외는 안 던지고 로그만 찍기
    	
    	// 소셜 유저일경우 비밀번호 찾기 차단
    	String provider = user.getProvider();
    	if (provider != null) {
    		log.info(provider+"");
    		if(provider.equals("google")) throw new CustomException(ErrorCode.SOCIAL_GOOGLE_USER_CANNOT_RESET_PASSWORD);
    		if(provider.equals("kakao")) throw new CustomException(ErrorCode.SOCIAL_KAKAO_USER_CANNOT_RESET_PASSWORD);
    	}
    	
    	log.info(user+"");
    	
    	// 2. 사용자의 이메일로 인증 이메일 보내기
    	// 사용자의 이메일로 인증 이메일 보내기
        verificationService.createResetTokenAndSendEmail(
        		user.getEmail(),
        		user.getUserId(),
        		user.getNickname()
        	);

    }
    
    // 비밀번호 리셋 토큰 검증
    public void validateResetToken(UserInfoVO tokenUser) {   	
    	
    	// 이메일 / userId DB에 존재하는지 조회
    	UserInfoVO storeUser = userMapper.selectVerifiedUser(tokenUser.getEmail());
    	if (storeUser == null || storeUser.getUserId() != tokenUser.getUserId()) {
    		throw new CustomException(ErrorCode.TARGET_USER_NOT_FOUND);	
    	}
    }
    
    /**
     * 비밀번호 재설정
     * @param user
     */
    public void passwordReset(UserInfoVO user, String newRawPassword) {

    	// validateResetToken에서 DB에서 토큰 검증해서 여기서는 검증 x
    	
    	
    	// 기존 비밀번호와 동일한지 검증
    	user = userMapper.selectVerifiedUser(user.getEmail());
    	
    	log.info(user.toString());
    	
        if (passwordEncoder.matches(newRawPassword, user.getPassword())) {
            // 에러 발생: 새로운 비밀번호가 필요함을 알림
            throw new CustomException(ErrorCode.SAME_PASSWORD_NOT_ALLOWED); 
        }
        
        // DB에 저장을 위해 비밀번호 인코딩
        String encodePassword = passwordEncoder.encode(newRawPassword);
       
        // 임시 비밀번호 DB에 저장
        userMapper.updatePassword(user.getUserId(), encodePassword);
        
    }
    

    /**
     * Access token에서 userId 얻는 유틸(컨트롤러에서 직접 쓰기 편리하도록)
     */
    public Long getUserIdFromAccessToken(String accessToken) {
        if (!jwtProvider.validateToken(accessToken)) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }
        return jwtProvider.getUserId(accessToken);
    }
}

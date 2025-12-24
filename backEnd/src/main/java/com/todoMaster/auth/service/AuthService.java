package com.todoMaster.auth.service;

import com.todoMaster.auth.dto.SocialUserInfo;
import com.todoMaster.auth.dto.request.LoginRequest;
import com.todoMaster.auth.dto.request.UserSignupRequest;
import com.todoMaster.auth.util.JwtProvider;
import com.todoMaster.auth.util.TokenHashUtil;
import com.todoMaster.common.service.S3Service;
import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.user.mapper.UserMapper;
import com.todoMaster.user.vo.UserInfoVO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

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
        vo.setProfileImg(req.getProfileImg());
        vo.setIsVerified("UNVERIFIED"); // 이메일 인증 전에는 UNVERIFIED으로 저장
        
        if(vo.getProfileImg() != null) {
        	vo.setProfileImageStatus("TEMP");
        } else {
        	vo.setProfileImageStatus("NONE");
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
        
        // temp 경로의 있던 이미지 경로 이동
        try {
        	if (req.getProfileImg() != null) {
        		String newProfileImage = "user/" + vo.getUserId() + "/profile.png";
                s3Service.move(
                		req.getProfileImg(),
                		newProfileImage);
                // 경로 이동 성공시 db READY로 업데이트
                userMapper.updateProfileImage(vo.getUserId(),newProfileImage,"READY");    
            }
        } catch (CustomException e) {      
        	// 경로 이동 실패시 db FAILED로 업데이트
            log.warn("Profile image move failed. userId={}",vo.getUserId(), e);
            userMapper.updateProfileImage(vo.getUserId(),vo.getProfileImg(),"FAILED");
        }
        

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
    public void accountActivation(String token) {
    	// 1. 토큰 검증
    	UserInfoVO tokenUser = verificationService.extractClaimsFromToken(token);
    	// 새로운 에러 필요
    	
    	// 2. 이메일 / userId DB에 존재하는지 조회
    	UserInfoVO storeUser = userMapper.selectUnverifiedUser(tokenUser.getUserId(),tokenUser.getEmail());
    	if (storeUser == null) throw new CustomException(ErrorCode.USER_NOT_FOUND); // 새로운 에러 필요
    	
    	// 3. 검증 후 계정 활성화
    	userMapper.accountActivation(tokenUser.getUserId());

    }
    
    // -------- 소셜 회원가입 --------
    @Transactional
    public Long socialSignup(String provider, String code) {

        SocialUserInfo socialUser = socialOAuthProcessor.getUserFromProvider(provider, code);

        if (userMapper.countByEmail(socialUser.getEmail()) > 0) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATION);
        }

        UserInfoVO vo = new UserInfoVO();
        vo.setEmail(socialUser.getEmail());
        vo.setNickname(socialUser.getNickname());
        vo.setProvider(socialUser.getProvider());
        vo.setProviderId(socialUser.getProviderId());
        vo.setProfileImg(socialUser.getProfileImage());
        if(vo.getProfileImg() != null) {
        	vo.setProfileImageStatus("READY");
        } else {
        	vo.setProfileImageStatus("NONE");
        }

        int result = userMapper.insertUser(vo);

        if (result == 0) {            
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }        

        return vo.getUserId();
    }

    /**
     * 로그인 처리
     * @return "access::refresh" 문자열 반환 — 컨트롤러에서 분리하여 처리
     */
    public String login(LoginRequest req) {
        // 이메일로 사용자 조회
        UserInfoVO user = userMapper.selectUserForLogin(req.getEmail());
        if (user == null) throw new CustomException(ErrorCode.USER_NOT_FOUND);

        // 비밀번호 검증
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD);
        }

        // 액세스/리프레시 토큰 생성
        String access = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());
        String refresh = jwtProvider.createRefreshToken(user.getUserId());

        int updated;
        
        // rememberMe에 따라 DB에 refresh 저장 (또는 항상 저장해도 됨)
        if (req.isRememberMe()) {
        	// 1. 솔트 생성
            String salt = tokenHashUtil.generateSalt();
            
            // 2. 토큰 해싱
            String hashedToken = tokenHashUtil.hashToken(refresh, salt);
        	
            updated = userMapper.updateRefreshToken(user.getUserId(), hashedToken, salt);
        } else {
            // 로그인 유지 원치 않으면 DB에 저장하지 않음(혹은 null 저장)
        	updated = userMapper.updateRefreshToken(user.getUserId(), null, null);
        }
        
        if (updated == 0) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }

        return access + "::" + refresh;
    }
    
    @Transactional
    public String socialLogin(String provider, String code) {

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
            	vo.setProfileImageStatus("READY");
            } else {
            	vo.setProfileImageStatus("NONE");
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
        String refresh = jwtProvider.createRefreshToken(userId);

        // DB에 RefreshToken 등록
        // 1. 솔트 생성
        String salt = tokenHashUtil.generateSalt();
        
        // 2. 토큰 해싱
        String hashedToken = tokenHashUtil.hashToken(refresh, salt);
        
        // 3. DB에 저장
        userMapper.updateRefreshToken(userId, hashedToken, salt);

        // return은 기존 login()처럼  
        // "access::refresh" 형식 유지해서 컨트롤러에서 쿠키 처리 동일하게 하도록 한다.
        return access + "::" + refresh;
    }


    /**
     * refresh 토큰으로 access 재발급 및 refresh 회전
     */
    public String refresh(String refreshToken) {
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
        String newRefresh = jwtProvider.createRefreshToken(userId);
        
        // 1. 솔트 생성
        String salt = tokenHashUtil.generateSalt();
        
        // 2. 토큰 해싱
        String hashedToken = tokenHashUtil.hashToken(newRefresh, salt);

        // DB 갱신
        userMapper.updateRefreshToken(userId, hashedToken, salt);

        return newAccess + "::" + newRefresh;
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
    
    /**
     * 비밀번호 초기화
     * @param email
     * @return 임시 비밀번호
     */
    public String resetPassword(String email) {

        UserInfoVO user = userMapper.selectUserForLogin(email);
        if (user == null)
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        
        // UUID를 통해서 임시 비밀번호 생성
        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        
        // DB에 저장을 위해 비밀번호 인코딩
        String encodePassword = passwordEncoder.encode(tempPassword);
       
        // 임시 비밀번호 DB에 저장
        userMapper.updatePassword(user.getUserId(), encodePassword);

        return tempPassword;
    }
    
    /**
     * 
     * @param userId
     * @param rawPassword
     */
    public void checkPassword(Long userId, String rawPassword) {

        UserInfoVO user = userMapper.findById(userId);

        if (user == null) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }

        // BCrypt 기반 비교
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new CustomException(ErrorCode.PASSWORD_NOT_MATCH);
        }
    }  
    

    /**
     * Access token에서 userId 얻는 유틸(컨트롤러에서 직접 쓰기 편리하도록)
     */
    public Long getUserIdFromAccessToken(String accessToken) {
        if (!jwtProvider.validateToken(accessToken)) {
            throw new IllegalArgumentException("유효하지 않은 액세스 토큰입니다.");
        }
        return jwtProvider.getUserId(accessToken);
    }
}

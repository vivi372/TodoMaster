package com.todoMaster.auth.service;

import com.todoMaster.auth.dto.SocialUserInfo;
import com.todoMaster.auth.dto.request.LoginRequest;
import com.todoMaster.auth.dto.request.UserSignupRequest;
import com.todoMaster.auth.util.JwtProvider;
import com.todoMaster.auth.util.TokenHashUtil;
import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.global.s3.S3Uploader;
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
    private final S3Uploader s3Uploader;
    private final SocialOAuthProcessor socialOAuthProcessor;
    
    public void signup(UserSignupRequest req) {

        if (userMapper.countByEmail(req.getEmail()) > 0) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATION);
        }        

        try {            
            UserInfoVO vo = new UserInfoVO();
            vo.setEmail(req.getEmail());
            vo.setPassword(passwordEncoder.encode(req.getPassword()));
            vo.setNickname(req.getNickname());
            vo.setProfileImg(req.getProfileImg());

            int result = userMapper.insertUser(vo);

            if (result == 0) {
                throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
            }

        } catch (Exception e) {

            // 🔥 여기서 S3 이미지 삭제
            if (req.getProfileImg() != null) {
                try {
                    s3Uploader.delete(req.getProfileImg());
                } catch (Exception s3e) {
                    // 로그만 남기고 흐름은 막지 않음
                    System.err.println("S3 이미지 삭제 실패: " + s3e.getMessage());
                }
            }

            throw e; // 원래 예외 다시 던짐
        }
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
        UserInfoVO user = userMapper.findByEmail(req.getEmail());
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
        userMapper.updateRefreshToken(userId, refresh, salt);

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

        UserInfoVO user = userMapper.findByEmail(email);
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

package com.todoMaster.user.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.todoMaster.user.dto.UserUpdateRequest;
import com.todoMaster.user.vo.UserInfoVO;

@Mapper
public interface UserMapper {
	
	// 이메일 중복 체크
    int countByEmail(String email);

    // 회원가입
    int insertUser(UserInfoVO vo);

    // 이메일로 유저 조회 (로그인)
    UserInfoVO findByEmail(String email);
    
    // id로 유저 조회
    UserInfoVO findById(Long userId);
    
    // 리프레쉬 토큰 수정
    int updateRefreshToken(
    		@Param("userId") Long userId, 
    		@Param("token") String token, 
    		@Param("salt") String salt
    );
    
    // 회원정보 수정
    int updateUserInfo(Long userId, UserUpdateRequest request);
    
    // 비밀번호 변경
    int updatePassword(@Param("userId") Long userId, @Param("password") String password);
}

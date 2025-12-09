package com.todoMaster.user.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.user.dto.UserUpdateRequest;
import com.todoMaster.user.mapper.UserMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
	
	private final UserMapper userMapper;
	
	@Transactional
    public void updateUser(Long userId, UserUpdateRequest request) {

        int result = userMapper.updateUserInfo(userId, request);

        if (result == 0) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }
    }
}

package com.todoMaster.todo.exception;

/**
 * 요청한 Todo를 찾을 수 없을 때 발생하는 예외
 */
public class TodoNotFoundException extends RuntimeException {
    public TodoNotFoundException(Long id) {
        super("ID가 " + id + "인 Todo를 찾을 수 없습니다.");
    }
}

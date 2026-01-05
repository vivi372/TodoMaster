package com.todoMaster.todo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.List;

/**
 * 페이징 처리된 Todo 목록의 조회 결과를 클라이언트에 반환하기 위한 DTO 입니다.
 * 페이지 정보(총 페이지 수, 현재 페이지 등)와 현재 페이지의 Todo 목록을 포함합니다.
 */
@Getter
@AllArgsConstructor
public class PagedTodoResponseDto {

    /**
     * 전체 페이지 수
     */
    private int totalPages;

    /**
     * 현재 페이지 번호 (0부터 시작)
     */
    private int currentPage;

    /**
     * 전체 Todo 항목의 수
     */
    private long totalElements;

    /**
     * 현재 페이지에 포함된 Todo 항목의 목록
     */
    private List<TodoResponseDto> todos;
}

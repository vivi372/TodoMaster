package com.todoMaster.todo.service;

import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.todo.dto.TodoCreateRequestDto;
import com.todoMaster.todo.dto.TodoResponseDto;
import com.todoMaster.todo.dto.TodoUpdateRequestDto;
import com.todoMaster.todo.exception.TodoNotFoundException;
import com.todoMaster.todo.mapper.TodoMapper;
import com.todoMaster.todo.vo.TodoVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Todo 항목(To-do item)의 비즈니스 로직을 처리하는 서비스 클래스입니다.
 * 데이터베이스 상호작용, 트랜잭션 관리, 인가(Authorization) 확인 등의 핵심 로직을 담당합니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TodoService {

    private final TodoMapper todoMapper;

    /**
     * 새로운 Todo 항목을 생성합니다.
     * 생성 시에는 `completed` 상태가 항상 `false`로 설정됩니다.
     *
     * @param requestDto Todo 생성에 필요한 데이터(제목, 설명, 마감일)
     * @param userId     현재 요청을 보낸 사용자의 ID
     * @return 생성된 Todo 항목의 정보를 담은 DTO
     */
    @Transactional
    public TodoResponseDto createTodo(TodoCreateRequestDto requestDto, Long userId) {
        TodoVO newTodo = TodoVO.builder()
                .userId(userId)
                .title(requestDto.getTitle())
                .memo(requestDto.getMemo())
                .dueDate(requestDto.getDueDate())
                // DB 스키마 변경에 따라, isCompleted의 기본값을 boolean false 대신 문자열 'N'으로 설정합니다.
                .isCompleted("N") 
                .build();

        todoMapper.insertTodo(newTodo);
        // insert 후 TodoVO에 ID가 설정되므로, 이를 DTO로 변환하여 반환합니다.
        return TodoResponseDto.from(newTodo);
    }

    /**
     * 특정 ID의 Todo 항목을 조회합니다.
     * 조회 전에 해당 Todo가 사용자의 소유인지 확인하는 인가(Authorization) 절차를 거칩니다.
     *
     * @param todoId 조회할 Todo의 고유 ID
     * @param userId 현재 요청을 보낸 사용자의 ID
     * @return 조회된 Todo 항목의 정보를 담은 DTO
     * @throws TodoNotFoundException   해당 ID의 Todo를 찾을 수 없는 경우
     * @throws TodoAccessDeniedException 해당 Todo에 대한 접근 권한이 없는 경우
     */
    @Transactional(readOnly = true)
    public TodoResponseDto getTodoById(Long todoId, Long userId) {
        TodoVO todo = getTodoAndCheckOwnership(todoId, userId);
        return TodoResponseDto.from(todo);
    }

    /**
     * 특정 사용자가 생성한 모든 Todo 항목 목록을 조회합니다.
     *
     * @param userId 현재 요청을 보낸 사용자의 ID
     * @return 해당 사용자의 모든 Todo 목록 (List of DTOs)
     */
    @Transactional(readOnly = true)
    public List<TodoResponseDto> getTodosByUser(Long userId) {
        List<TodoVO> todos = todoMapper.findTodosByUserId(userId);
        log.info(todos.toString());
        return todos.stream()
                .map(TodoResponseDto::from)
                .collect(Collectors.toList());
    }

    /**
     * 특정 Todo 항목의 정보를 수정합니다.
     * 수정 전에 해당 Todo가 사용자의 소유인지 확인하는 인가(Authorization) 절차를 거칩니다.
     * 요청 DTO에 포함된 필드 값만 선택적으로 업데이트합니다.
     *
     * @param todoId     수정할 Todo의 고유 ID
     * @param requestDto 수정할 데이터 (제목, 설명, 완료 여부, 마감일)
     * @param userId     현재 요청을 보낸 사용자의 ID
     * @return 수정이 완료된 Todo 항목의 정보를 담은 DTO
     * @throws TodoNotFoundException   해당 ID의 Todo를 찾을 수 없는 경우
     * @throws TodoAccessDeniedException 해당 Todo에 대한 접근 권한이 없는 경우
     */
    @Transactional
    public TodoResponseDto updateTodo(Long todoId, TodoUpdateRequestDto requestDto, Long userId) {
        // 1. Todo 조회 및 소유권 확인
        TodoVO todo = getTodoAndCheckOwnership(todoId, userId);

        // 2. DTO의 필드가 null이 아닌 경우에만 값을 변경하여 선택적 업데이트(Patch)를 구현합니다.
        if (requestDto.getTitle() != null) {
            todo.setTitle(requestDto.getTitle());
        }
        if (requestDto.getMemo() != null) {
            todo.setMemo(requestDto.getMemo());
        }
        // isCompleted 필드는 이제 'Y' 또는 'N' 문자열을 받습니다.
        if (requestDto.getIsCompleted() != null) {
            todo.setIsCompleted(requestDto.getIsCompleted());
        }
        if (requestDto.getDueDate() != null) {
            todo.setDueDate(requestDto.getDueDate());
        }

        // 3. 데이터베이스에 수정된 내용을 반영합니다.
        todoMapper.updateTodo(todo);

        // 4. 수정된 최신 정보를 다시 조회하여 클라이언트에게 반환합니다.
        TodoVO updatedTodo = todoMapper.findTodoById(todoId);
        return TodoResponseDto.from(updatedTodo);
    }

    /**
     * 특정 Todo 항목을 삭제합니다.
     * 삭제 전에 해당 Todo가 사용자의 소유인지 확인하는 인가(Authorization) 절차를 거칩니다.
     *
     * @param todoId 삭제할 Todo의 고유 ID
     * @param userId 현재 요청을 보낸 사용자의 ID
     * @throws TodoNotFoundException   해당 ID의 Todo를 찾을 수 없는 경우
     * @throws TodoAccessDeniedException 해당 Todo에 대한 접근 권한이 없는 경우
     */
    @Transactional
    public void deleteTodo(Long todoId, Long userId) {
        getTodoAndCheckOwnership(todoId, userId);
        todoMapper.deleteTodo(todoId);
    }

    /**
     * Todo를 데이터베이스에서 조회하고, 현재 인증된 사용자가 해당 Todo의 소유주인지 확인하는 내부 헬퍼 메서드입니다.
     *
     * @param todoId 확인할 Todo의 ID
     * @param userId 현재 인증된 사용자의 ID
     * @return 조회 및 소유권 확인이 완료된 TodoVO 객체
     * @throws TodoNotFoundException   요청된 ID에 해당하는 Todo가 데이터베이스에 존재하지 않을 경우
     * @throws TodoAccessDeniedException 조회된 Todo의 소유주 ID와 현재 사용자의 ID가 일치하지 않을 경우
     */
    private TodoVO getTodoAndCheckOwnership(Long todoId, Long userId) {
        TodoVO todo = todoMapper.findTodoById(todoId);

        if (todo == null) {
            throw new TodoNotFoundException(todoId);
        }
        // DB에서 가져온 todo의 userId와 현재 토큰의 userId를 비교합니다.
        if (!todo.getUserId().equals(userId)) {
            throw new CustomException(ErrorCode.TODO_ACCESS_DENIED);
        }
        return todo;
    }

    /**
     * Spring Security의 SecurityContextHolder에서 현재 인증된 사용자의 고유 ID (userId)를 추출합니다.
     * 이 메서드는 컨트롤러에서 서비스 메서드를 호출하기 전에 사용자 ID를 얻기 위해 사용됩니다.
     *
     * @return 현재 인증된 사용자의 Long 타입 ID
     * @throws IllegalStateException 사용자가 인증되지 않았거나 (토큰이 없거나 유효하지 않음),
     *                               SecurityContext에 인증 정보가 제대로 설정되지 않은 경우 발생합니다.
     */
    public Long getAuthenticatedUserId() {
        // SecurityContextHolder에서 현재 스레드의 SecurityContext를 가져옵니다.
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // 인증 객체가 존재하고, 인증된 상태인지 확인합니다.
        // `JwtAuthenticationFilter`에서 인증 성공 시 `userId` (Long 타입)를 principal로 설정했으므로, 이를 캐스팅하여 사용합니다.
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() == null || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalStateException("인증된 사용자를 찾을 수 없습니다. Security Context에 인증 정보가 없습니다.");
        }
        return (Long) authentication.getPrincipal();
    }
}

package com.todoMaster.todo.controller;

import com.todoMaster.global.dto.ApiResponse;
import com.todoMaster.todo.dto.TodoCreateRequestDto;
import com.todoMaster.todo.dto.TodoResponseDto;
import com.todoMaster.todo.dto.TodoUpdateRequestDto;
import com.todoMaster.todo.service.TodoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Todo 항목(To-do item)의 CRUD 관련 API 요청을 처리하는 REST 컨트롤러입니다.
 * '/api/todos' 엔드포인트에 대한 요청을 처리합니다.
 */
@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    /**
     * 새로운 Todo 항목을 생성합니다.
     * @param requestDto 클라이언트로부터 받은 Todo 생성 데이터 (제목, 설명, 마감일 등)
     * @return 생성된 Todo 정보와 성공 메시지를 담은 ResponseEntity
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TodoResponseDto>> createTodo(
            @Valid @RequestBody TodoCreateRequestDto requestDto
    ) {
        // 현재 인증된 사용자의 ID를 서비스 레이어에서 가져옵니다.
        Long userId = todoService.getAuthenticatedUserId();
        // Todo 생성 서비스 호출 시 requestDto에 포함된 priority 값을 함께 전달합니다.
        TodoResponseDto responseDto = todoService.createTodo(requestDto, userId);
        // 생성 성공 시, HTTP 201 Created 상태와 함께 응답을 반환합니다.
        return new ResponseEntity<>(ApiResponse.success("Todo가 성공적으로 생성되었습니다.", responseDto), HttpStatus.CREATED);
    }

    /**
     * 지정된 ID의 Todo 항목을 조회합니다.
     * @param todoId 조회할 Todo의 고유 ID
     * @return 조회된 Todo 정보와 성공 메시지를 담은 ResponseEntity
     */
    @GetMapping("/{todoId}")
    public ResponseEntity<ApiResponse<TodoResponseDto>> getTodoById(
            @PathVariable Long todoId
    ) {
        Long userId = todoService.getAuthenticatedUserId();
        TodoResponseDto responseDto = todoService.getTodoById(todoId, userId);
        return ResponseEntity.ok(ApiResponse.success("Todo 조회가 완료되었습니다.", responseDto));
    }

    /**
     * 현재 인증된 사용자의 모든 Todo 목록을 조회합니다.
     * @return 사용자의 모든 Todo 목록과 성공 메시지를 담은 ResponseEntity
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TodoResponseDto>>> getMyTodos() {
        Long userId = todoService.getAuthenticatedUserId();
        List<TodoResponseDto> responseDtos = todoService.getTodosByUser(userId);
        return ResponseEntity.ok(ApiResponse.success("나의 Todo 목록 조회가 완료되었습니다.", responseDtos));
    }

    /**
     * 지정된 ID의 Todo 항목을 수정합니다.
     * @param todoId 수정할 Todo의 고유 ID
     * @param requestDto 클라이언트로부터 받은 Todo 수정 데이터
     * @return 수정된 Todo 정보와 성공 메시지를 담은 ResponseEntity
     */
    @PatchMapping("/{todoId}")
    public ResponseEntity<ApiResponse<TodoResponseDto>> updateTodo(
            @PathVariable Long todoId,
            @Valid @RequestBody TodoUpdateRequestDto requestDto
    ) {
        Long userId = todoService.getAuthenticatedUserId();
        // Todo 수정 서비스 호출 시 requestDto에 포함된 priority 값을 함께 전달합니다.
        TodoResponseDto responseDto = todoService.updateTodo(todoId, requestDto, userId);
        return ResponseEntity.ok(ApiResponse.success("Todo가 성공적으로 수정되었습니다.", responseDto));
    }

    /**
     * 지정된 ID의 Todo 항목을 삭제합니다.
     * @param todoId 삭제할 Todo의 고유 ID
     * @return 작업 성공 메시지를 담은 ResponseEntity (데이터는 없음)
     */
    @DeleteMapping("/{todoId}")
    public ResponseEntity<ApiResponse<Void>> deleteTodo(
            @PathVariable Long todoId
    ) {
        Long userId = todoService.getAuthenticatedUserId();
        todoService.deleteTodo(todoId, userId);
        return ResponseEntity.ok(ApiResponse.success("Todo가 성공적으로 삭제되었습니다."));
    }
}

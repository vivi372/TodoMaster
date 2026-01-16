package com.todoMaster.todo.service;

import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.repeat.dto.RepeatRuleCreateRequest;
import com.todoMaster.repeat.service.RepeatService;
import com.todoMaster.repeat.vo.RepeatVO;
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
    private final RepeatService repeatService;

    /**
     * 새로운 Todo 항목을 생성합니다.
     * DTO에 반복 규칙이 포함된 경우, 일반 Todo 생성 후 반복 규칙에 따른 추가 Todo들을 생성합니다.
     *
     * @param requestDto Todo 생성에 필요한 데이터(제목, 설명, 마감일, 반복 규칙 등)
     * @param userId     현재 요청을 보낸 사용자의 ID
     * @return 생성된 원본 Todo 항목의 정보를 담은 DTO
     */
    @Transactional
    public TodoResponseDto createTodo(TodoCreateRequestDto requestDto, Long userId) {
        // 1. 기본적인 TodoVO 객체 생성
        TodoVO newTodo = TodoVO.builder()
                .userId(userId)
                .title(requestDto.getTitle())
                .memo(requestDto.getMemo())
                .dueDate(requestDto.getDueDate())
                .isCompleted("N") // 생성 시 항상 '미완료'
                .priority(requestDto.getPriority())
                .build();

        // 2. 원본 Todo를 데이터베이스에 삽입
        todoMapper.insertTodo(newTodo);
        // insert가 성공하면 newTodo 객체에 PK(todoId)가 채워짐

        // 3. 반복 규칙 처리
        RepeatRuleCreateRequest repeatRuleDto = requestDto.getRepeatRule();
        if (repeatRuleDto != null) {
            // 3-1. 반복 규칙 DTO를 VO로 변환
            RepeatVO repeatVO = RepeatVO.builder()
                    .type(repeatRuleDto.getType())
                    .intervalValue(repeatRuleDto.getIntervalValue())
                    .weekDays(repeatRuleDto.getWeekDays())
                    .endDate(repeatRuleDto.getEndDate())
                    .build();

            // 3-2. RepeatService를 호출하여 반복 규칙 생성 및 반복 Todo들 생성
            // 이 메서드는 내부적으로 트랜잭션 전파를 통해 아래 로직들과 하나의 트랜잭션으로 묶임
            repeatService.createTodoWithRepeatRule(repeatVO, newTodo);
        }

        // 4. 생성된 원본 Todo 정보를 DTO로 변환하여 반환
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
     * @throws CustomException 해당 Todo에 대한 접근 권한이 없는 경우
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
     * 반복 규칙이 포함된 경우, 규칙 변경을 RepeatService에 위임하여 처리합니다.
     *
     * @param todoId     수정할 Todo의 고유 ID
     * @param requestDto 수정할 데이터 (제목, 메모, 반복 규칙 등)
     * @param userId     현재 요청을 보낸 사용자의 ID
     * @return 수정이 완료된 Todo 항목의 정보를 담은 DTO
     * @throws TodoNotFoundException   해당 ID의 Todo를 찾을 수 없는 경우
     * @throws CustomException 해당 Todo에 대한 접근 권한이 없는 경우
     */
    @Transactional
    public TodoResponseDto updateTodo(Long todoId, TodoUpdateRequestDto requestDto, Long userId) {
        // 1. Todo 조회 및 소유권 확인
        TodoVO todo = getTodoAndCheckOwnership(todoId, userId);

        // ==========================================================================================
        // [수정된 로직] 마감일 삭제 및 '이후 모든 일정' 선택 시, 후속 Todo들을 삭제하고 반복을 중단하는 로직
        // ==========================================================================================
        if (requestDto.getDueDate() == null && "AFTER_THIS".equalsIgnoreCase(requestDto.getChangeType()) && todo.getRepeatRuleId() != null) {
            /*
             * 비즈니스 규칙 상세:
             * 사용자가 반복되는 일정의 특정 항목에 대해 마감일을 '없음'으로 설정하고 '이후 모든 일정에 적용' 옵션을 선택했습니다.
             * 시스템은 이를 '해당 시점 이후로 더 이상 반복을 원하지 않는다'는 명시적 의도로 해석합니다.
             *
             * 처리 순서:
             * 1. 현재 Todo의 원본 마감일(dueDate)을 기준으로, 미래의 모든 미완료 반복 Todo들을 데이터베이스에서 삭제합니다.
             * 2. 기존 반복 규칙(RepeatRule)의 종료일(endDate)을 현재 Todo의 원본 마감일 하루 전으로 설정하여 규칙을 비활성화합니다.
             * 3. 제목, 메모 등 마감일 외의 다른 정보들을 먼저 DB에 업데이트합니다. (이때 마감일은 변경되지 않음)
             * 4. 별도의 전용 쿼리를 호출하여 현재 Todo 항목의 마감일(dueDate)만 명시적으로 NULL로 변경합니다.
             * 5. 이 모든 과정은 하나의 트랜잭션으로 처리되어 데이터 정합성을 보장합니다.
             */
            log.info("반복 Todo의 후속 일정 삭제 및 반복 중단 (마감일 null 처리): todoId={}, repeatRuleId={}", todoId, todo.getRepeatRuleId());

            // 1. 현재 Todo의 마감일 이후에 예정된 미완료 Todo들 삭제
            todoMapper.deleteTodosAfterDate(todo.getRepeatRuleId(), todo.getDueDate());

            // 2. 기존 반복 규칙의 효력 중단
            repeatService.terminateRepeatRule(todo.getRepeatRuleId(), todo.getDueDate());

            // 3. dueDate를 제외한 다른 내용들(제목, 메모 등)을 먼저 업데이트
            applyTodoContentChanges(todo, requestDto);
            todoMapper.updateTodo(todo); // Mapper의 <if> 조건 덕분에 dueDate는 이때 업데이트되지 않음

            // 4. 현재 Todo의 마감일을 명시적으로 null로 설정
            todoMapper.setDueDateToNull(todoId);

            // 5. 모든 변경이 적용된 최신 Todo 정보를 조회하여 반환
            TodoVO updatedTodo = todoMapper.findTodoById(todoId);
            return TodoResponseDto.from(updatedTodo);
        }

        // 2. 반복 규칙 변경 처리 (내용 변경보다 우선 처리)
        RepeatRuleCreateRequest repeatRuleDto = requestDto.getRepeatRule();
        if (repeatRuleDto != null) {
            RepeatVO newRepeatVO = RepeatVO.builder()
                .type(repeatRuleDto.getType())
                .intervalValue(repeatRuleDto.getIntervalValue())
                .weekDays(repeatRuleDto.getWeekDays())
                .endDate(repeatRuleDto.getEndDate())
                .build();

            if (todo.getRepeatRuleId() != null) {
                // 2-1. 기존에 반복되던 Todo의 규칙을 변경
                log.info("기존 반복 Todo 규칙 변경: todoId={}, changeType={}", todoId, requestDto.getChangeType());
                repeatService.updateRepeatRule(todo.getRepeatRuleId(), requestDto.getChangeType(), newRepeatVO, todoId);
            } else {
                // 2-2. 일반 Todo를 반복 Todo로 변경
                log.info("일반 Todo를 반복 Todo로 변경: todoId={}", todoId);
                // 내용 변경을 먼저 저장한 후, 이를 기반으로 반복 규칙 생성
                applyTodoContentChanges(todo, requestDto);
                todoMapper.updateTodo(todo);
                repeatService.createTodoWithRepeatRule(newRepeatVO, todo);
                
                // createTodoWithRepeatRule에서 모든 작업을 처리했으므로, 최신 정보를 조회하여 반환
                TodoVO updatedTodo = todoMapper.findTodoById(todoId);
                return TodoResponseDto.from(updatedTodo);
            }
        }

        // 3. Todo 내용 변경 적용 (반복 규칙 변경과 별개로 항상 적용)
        applyTodoContentChanges(todo, requestDto);
        todoMapper.updateTodo(todo);

        // 4. 수정된 최신 정보를 다시 조회하여 클라이언트에게 반환
        TodoVO updatedTodo = todoMapper.findTodoById(todoId);
        return TodoResponseDto.from(updatedTodo);
    }

    /**
     * TodoUpdateRequestDto의 내용(제목, 메모 등)을 TodoVO 객체에 적용하는 헬퍼 메서드.
     * @param todo       값을 적용할 대상 TodoVO
     * @param requestDto 변경 내용이 담긴 DTO
     */
    private void applyTodoContentChanges(TodoVO todo, TodoUpdateRequestDto requestDto) {
        // NOT NULL 필드: null이 아닌 경우에만 업데이트
        if (requestDto.getTitle() != null) {
            todo.setTitle(requestDto.getTitle());
        }
        if (requestDto.getIsCompleted() != null) {
            todo.setIsCompleted(requestDto.getIsCompleted());
        }

        // NULL 허용 필드: requestDto에 해당 필드가 포함되어 있으면 null을 포함하여 업데이트
        // (requestDto에서 값이 제공되지 않으면(null) TodoVO에도 null이 설정되도록 함)
        // DTO에서 명시적으로 null을 전달하는 경우 DB에 null이 반영될 수 있도록 함.
        todo.setMemo(requestDto.getMemo());
        todo.setPriority(requestDto.getPriority());
        // 현재 카테고리 관련 기능이 없어 null 처리
        todo.setCategoryId(null);
        todo.setDueDate(requestDto.getDueDate());
        // repeatRuleId는 updateRepeatRule에서 별도로 처리되거나,
        // 일반 updateTodo 경로에서는 사실상 변경되지 않으므로 여기서는 명시적 null 처리 제외
        // todo.setRepeatRuleId(requestDto.getRepeatRuleId()); 
        // todo.setCompletedAt(requestDto.getCompletedAt());
    }

    /**
     * 특정 Todo 항목을 삭제합니다.
     * 반복 Todo의 경우, 삭제 범위(deleteScope)에 따라 분기 처리됩니다.
     *
     * @param todoId      삭제할 Todo의 고유 ID
     * @param userId      현재 요청을 보낸 사용자의 ID
     * @param deleteScope 삭제 범위 ("FUTURE": 이후 일정 모두 삭제, null 또는 다른 값: 단일 항목만 삭제)
     * @throws TodoNotFoundException   해당 ID의 Todo를 찾을 수 없는 경우
     * @throws CustomException 해당 Todo에 대한 접근 권한이 없는 경우
     */
    @Transactional
    public void deleteTodo(Long todoId, Long userId, String deleteScope) {
        // 1. Todo 조회 및 소유권 확인
        TodoVO todo = getTodoAndCheckOwnership(todoId, userId);

        // 2. 반복 Todo의 "이후 일정 삭제" 처리
        if ("FUTURE".equalsIgnoreCase(deleteScope) && todo.getRepeatRuleId() != null) {
            log.info("반복 Todo의 이후 일정 삭제: todoId={}", todoId);
            repeatService.deleteRepeatTodosAfter(todoId);
        } else {
            // 3. 단일 Todo 삭제 (일반 Todo 또는 반복 시리즈 중 하나만 삭제)
            log.info("단일 Todo 삭제: todoId={}", todoId);
            todoMapper.deleteTodo(todoId);
        }
    }

    /**
     * Todo를 데이터베이스에서 조회하고, 현재 인증된 사용자가 해당 Todo의 소유주인지 확인하는 내부 헬퍼 메서드입니다.
     *
     * @param todoId 확인할 Todo의 ID
     * @param userId 현재 인증된 사용자의 ID
     * @return 조회 및 소유권 확인이 완료된 TodoVO 객체
     * @throws TodoNotFoundException   요청된 ID에 해당하는 Todo가 데이터베이스에 존재하지 않을 경우
     * @throws CustomException 조회된 Todo의 소유주 ID와 현재 사용자의 ID가 일치하지 않을 경우
     */
    public TodoVO getTodoAndCheckOwnership(Long todoId, Long userId) {
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

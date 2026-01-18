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

import java.time.LocalDate;
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
        final LocalDate originalDueDate = todo.getDueDate();

        RepeatRuleCreateRequest repeatRuleDto = requestDto.getRepeatRule();

        // ==========================================================================================
        // [수정된 시리즈 분리 로직] '이 할 일만 수정' 시, 현재 Todo를 보존하며 새 시리즈를 생성합니다.
        // ==========================================================================================
        /*
         * 비즈니스 규칙 상세:
         * 사용자가 '이 할 일만 수정'을 선택하며 반복 규칙도 변경했을 때, 현재 항목을 기존 시리즈에서 안전하게 분리하고
         * 이를 기점으로 새로운 시리즈를 시작합니다.
         *
         * 수정된 처리 순서:
         * 1. [핵심] 현재 Todo를 삭제로부터 보호하기 위해, DB에서 `repeat_rule_id`를 `null`로 만들어 잠시 '일반 Todo'로 만듭니다.
         * 2. 기존 반복 시리즈의 미래 일정들을 삭제하고, 규칙의 효력을 중단시킵니다.
         * 3. '일반 Todo'가 된 현재 항목에 새로운 내용(제목, 마감일 등)을 적용합니다.
         * 4. `RepeatService`를 호출하여, 이 Todo를 기반으로 새로운 반복 규칙과 미래 일정들을 생성합니다.
         *    이 과정에서 Todo의 `repeat_rule_id`는 새로 생성된 규칙의 ID로 다시 채워집니다.
         */
        if (requestDto.getChangeType() == null && repeatRuleDto != null) {
            log.info("반복 시리즈 분리(Splitting) 시작: todoId={}", todoId);

            Long oldRepeatRuleId = todo.getRepeatRuleId();
            LocalDate oldDueDate = todo.getDueDate();

            // 1. 현재 Todo를 보호하기 위해 반복 시리즈에서 잠시 분리 (repeat_rule_id를 null로 설정)
            if (oldRepeatRuleId != null) {
                log.info("현재 Todo를 보호하기 위해 임시로 반복 연결 해제: todoId={}", todoId);
                todo.setRepeatRuleId(null);
                todoMapper.updateTodo(todo);
            }

            // 2. 이제 안전하게 기존 시리즈의 미래를 정리한다.
            if (oldRepeatRuleId != null) {
                // 2-1. 기존 반복 규칙은 현재 Todo의 '원본' 마감일 이전에 종료시킨다.
                repeatService.terminateRepeatRule(oldRepeatRuleId, oldDueDate);

                // 2-2. 기존 규칙으로 생성되었던 미래의 모든 미완료 Todo들을 삭제한다.
                //      (현재 Todo는 `repeat_rule_id`가 null이므로 이 삭제 작업에 포함되지 않음)
                log.info("기존 시리즈의 미래 Todo 삭제: oldRepeatRuleId={}, 기준일={}", oldRepeatRuleId, oldDueDate);
                // `deleteTodosAfterDate`는 기준일(oldDueDate)을 포함하여 삭제하므로, 위에서 분리하지 않으면 현재 Todo도 삭제됨.
                todoMapper.deleteTodosAfterDate(oldRepeatRuleId, oldDueDate);
            }

            // 3. 요청된 새로운 내용으로 현재 Todo의 컨텐츠(제목, 메모, 새 마감일 등)를 업데이트한다.
            applyTodoContentChanges(todo, requestDto);
            // 이 시점의 todo 객체는 id는 있지만 repeatRuleId는 null이다.

            // 4. 요청된 새로운 반복 규칙으로 새 시리즈를 생성한다.
            //    createTodoWithRepeatRule은 내부적으로 새 RepeatRule을 만들고,
            //    전달된 Todo에 ruleId를 연결하며(UPDATE), 미래의 Todo들을 생성(INSERT)해야 한다.
            RepeatVO newRepeatVO = RepeatVO.builder()
                    .type(repeatRuleDto.getType())
                    .intervalValue(repeatRuleDto.getIntervalValue())
                    .weekDays(repeatRuleDto.getWeekDays())
                    .endDate(repeatRuleDto.getEndDate())
                    .build();
            repeatService.createTodoWithRepeatRule(newRepeatVO, todo);
            
            // 5. 모든 변경이 적용된 최신 정보를 조회하여 반환
            TodoVO updatedTodo = todoMapper.findTodoById(todoId);
            return TodoResponseDto.from(updatedTodo);
        }

        // [문제 해결] 마감일 null과 AFTER_THIS를 포함한 반복 규칙 변경 요청 시
        // 기준 투두의 repeatRuleId가 올바르게 갱신되지 않는 문제 수정.
        // repeatRuleDto가 존재하는 경우를 먼저 처리하여, 새로운 반복 규칙 생성을 우선시한다.
        // 즉, 마감일이 null이더라도 repeatRuleDto가 있으면 새로운 반복 규칙으로 이관되어야 한다.
        else if (repeatRuleDto != null) {
            // 마감일 포함 Todo의 변경 내용을 먼저 적용하고 DB에 반영한다.
            // 이렇게 함으로써 repeatService.updateRepeatRule이 호출될 때
            // todo 객체가 최신 상태(예: null DueDate)를 유지하게 한다.
            applyTodoContentChanges(todo, requestDto);
            todoMapper.updateTodo(todo);

            RepeatVO newRepeatVO = RepeatVO.builder()
                .type(repeatRuleDto.getType())
                .intervalValue(repeatRuleDto.getIntervalValue())
                .weekDays(repeatRuleDto.getWeekDays())
                .endDate(repeatRuleDto.getEndDate())
                .build();

            if (todo.getRepeatRuleId() != null) {
                // 기존에 반복되던 Todo의 규칙을 변경
                log.info("기존 반복 Todo 규칙 변경: todoId={}, changeType={}", todoId, requestDto.getChangeType());
                repeatService.updateRepeatRule(todo.getRepeatRuleId(), requestDto.getChangeType(), newRepeatVO, todoId, originalDueDate);

                // updateRepeatRule 호출 후, DB에서 최신 상태의 Todo를 다시 조회하여 현재 'todo' 객체를 갱신합니다.
                // 이렇게 하지 않으면, 현재 스코프의 'todo' 객체는 예전 repeatRuleId를 가지고 있어,
                // 마지막 updateTodo 호출 시 RuleId를 예전 값으로 되돌리는 문제가 발생할 수 있습니다.
                todo = getTodoAndCheckOwnership(todoId, userId);
            } else {
                // 일반 Todo를 반복 Todo로 변경
                log.info("일반 Todo를 반복 Todo로 변경: todoId={}", todoId);
                // 내용 변경을 먼저 저장한 후, 이를 기반으로 반복 규칙 생성 (이미 위에서 저장됨)
                repeatService.createTodoWithRepeatRule(newRepeatVO, todo);
                
                // createTodoWithRepeatRule에서 모든 작업을 처리했으므로, 최신 정보를 조회하여 반환
                TodoVO updatedTodo = todoMapper.findTodoById(todoId);
                return TodoResponseDto.from(updatedTodo);
            }
            // 모든 변경이 적용된 최신 정보를 조회하여 반환
            TodoVO updatedTodo = todoMapper.findTodoById(todoId);
            return TodoResponseDto.from(updatedTodo);
        }
        
        // ==========================================================================================
        // 마감일 삭제 및 '이후 모든 일정' 선택 시, 후속 Todo들을 삭제하고 반복을 중단하는 로직
        // ==========================================================================================
        else if (requestDto.getDueDate() == null && "AFTER_THIS".equalsIgnoreCase(requestDto.getChangeType()) && todo.getRepeatRuleId() != null) {
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

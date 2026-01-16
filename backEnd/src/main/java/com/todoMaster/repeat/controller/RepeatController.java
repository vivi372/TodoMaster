    package com.todoMaster.repeat.controller;

import com.todoMaster.repeat.dto.RepeatRuleCreateRequest;
import com.todoMaster.repeat.service.RepeatService;
import com.todoMaster.repeat.vo.RepeatVO;
import com.todoMaster.todo.service.TodoService;
import com.todoMaster.todo.vo.TodoVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Todo 반복 기능과 관련된 API 요청을 처리하는 컨트롤러입니다.
 */
@RestController
@RequestMapping("/api/repeat")
@RequiredArgsConstructor
public class RepeatController {

    private final RepeatService repeatService;
    private final TodoService todoService;

    /**
     * 특정 Todo에 대한 새로운 반복 규칙을 생성합니다.
     * 이 API가 호출되면, 해당 Todo는 반복의 '원본'이 되며,
     * 요청된 규칙에 따라 향후의 반복 일정이 자동으로 생성됩니다.
     *
     * @param todoId  반복 규칙을 적용할 Todo의 고유 ID (Path Variable)
     * @param request 반복 규칙의 상세 정보를 담은 DTO (Request Body)
     * @return 성공 시 HTTP 200 OK 응답
     */
    @PostMapping("/todos/{todoId}")
    public ResponseEntity<Void> createRepeatRule(
            @PathVariable Long todoId,
            @RequestBody RepeatRuleCreateRequest request) {

        // 1. TodoService를 사용하여 요청된 Todo를 조회하고, 현재 사용자가 해당 Todo의 소유자인지 확인합니다.
        TodoVO todo = todoService.getTodoAndCheckOwnership(todoId, todoService.getAuthenticatedUserId());

        // 2. 요청 DTO를 비즈니스 로직에서 사용할 VO로 변환합니다.
        RepeatVO repeatVO = new RepeatVO();
        repeatVO.setType(request.getType());
        repeatVO.setIntervalValue(request.getIntervalValue());
        repeatVO.setWeekDays(request.getWeekDays());
        repeatVO.setEndDate(request.getEndDate());

        // 3. RepeatService를 호출하여 반복 규칙 생성 및 향후 일정 생성 로직을 수행합니다.
        repeatService.createTodoWithRepeatRule(repeatVO, todo);
        return ResponseEntity.ok().build();
    }
}

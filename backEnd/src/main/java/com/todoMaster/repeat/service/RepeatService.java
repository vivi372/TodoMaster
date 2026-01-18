package com.todoMaster.repeat.service;

import com.todoMaster.global.exception.CustomException;
import com.todoMaster.global.exception.ErrorCode;
import com.todoMaster.repeat.mapper.RepeatMapper;
import com.todoMaster.repeat.vo.RepeatVO;
import com.todoMaster.todo.mapper.TodoMapper;
import com.todoMaster.todo.vo.TodoVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 반복 규칙과 관련된 비즈니스 로직을 처리하는 서비스 클래스입니다.
 * 반복 규칙(RepeatRule) 생성, 반복 Todo 생성, 반복 Todo 시리즈 수정 및 삭제 등
 * 반복 일정 관리에 필요한 핵심 기능을 제공합니다.
 * <p>
 * 주요 역할:
 * 1. 투두 생성 시 반복 규칙을 함께 저장하고, 해당 규칙에 따라 미래의 반복 투두를 자동으로 생성합니다.
 * 2. 반복 투두 시리즈를 "전체 수정" 또는 "이후 일정만 수정"하는 기능을 제공합니다.
 * 3. 반복 규칙의 종료일을 설정하여 더 이상 반복 투두가 생성되지 않도록 합니다.
 * 4. 특정 시점 이후의 반복 투두들을 삭제하고, 반복 규칙의 종료일을 갱신합니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RepeatService {

    private final RepeatMapper repeatMapper;
    private final TodoMapper todoMapper;

    /**
     * 새로운 Todo와 함께 반복 규칙을 생성하고, 해당 규칙에 따라 반복 Todo들을 생성합니다.
     * 이 메서드는 트랜잭션 내에서 실행되어 데이터의 일관성을 보장합니다.
     *
     * @param repeatVO 반복 규칙 정보를 담고 있는 {@link RepeatVO} 객체
     * @param todo     생성될 기본 Todo 정보를 담고 있는 {@link TodoVO} 객체
     */
    @Transactional
    public void createTodoWithRepeatRule(RepeatVO repeatVO, TodoVO todo) {
        // 1. 새로운 반복 규칙을 데이터베이스에 삽입합니다.
        // 이 과정에서 repeatVO 객체에 생성된 repeatRuleId가 설정됩니다.
        repeatMapper.insertRepeatRule(repeatVO);
        // 2. 기본 Todo에 생성된 반복 규칙의 ID를 설정합니다.
        todo.setRepeatRuleId(repeatVO.getRepeatRuleId());
        // 3. 반복 규칙 ID가 업데이트된 Todo를 데이터베이스에 반영합니다.
        todoMapper.updateTodo(todo);
        // 4. 설정된 반복 규칙에 따라 미래의 반복 Todo들을 생성합니다.
        // 이 메서드 내에서 실제로 여러 개의 Todo 항목이 데이터베이스에 삽입될 수 있습니다.
        generateRepeatTodos(repeatVO, todo);
    }

    /**
     * 주어진 반복 규칙과 기본 Todo를 바탕으로 미래의 반복 Todo들을 생성하여 데이터베이스에 저장합니다.
     * 이 메서드는 트랜잭션 내에서 실행되어 데이터의 일관성을 보장합니다.
     *
     * @param rule     반복 규칙 정보를 담고 있는 {@link RepeatVO} 객체
     * @param baseTodo 반복 Todo 생성의 기준이 되는 {@link TodoVO} 객체
     */
    /**
     * 주어진 반복 규칙과 기본 Todo를 바탕으로 미래의 반복 Todo들을 생성하여 데이터베이스에 저장합니다.
     * 이 메서드는 트랜잭션 내에서 실행되어 데이터의 일관성을 보장합니다.
     * <p>
     * 변경사항: baseTodo의 DueDate가 null인 경우, 반복 Todo를 생성하지 않고 즉시 반환합니다.
     * 이는 마감일이 없는 Todo를 기준으로 반복 일정을 생성하려 할 때 발생하는 논리적 오류를 방지합니다.
     *
     * @param rule     반복 규칙 정보를 담고 있는 {@link RepeatVO} 객체
     * @param baseTodo 반복 Todo 생성의 기준이 되는 {@link TodoVO} 객체
     */
    @Transactional
    public void generateRepeatTodos(RepeatVO rule, TodoVO baseTodo) {
        // baseTodo의 DueDate가 null인 경우 반복 Todo를 생성할 수 없으므로 즉시 반환
        if (baseTodo.getDueDate() == null) {
            log.warn("기준 Todo의 DueDate가 null이므로 반복 Todo들을 생성하지 않습니다. TodoId: {}", baseTodo.getTodoId());
            return;
        }

        List<TodoVO> todosToCreate = new ArrayList<>(); // 새로 생성할 Todo 목록
        Set<LocalDate> generatedDates = new HashSet<>(); // 중복 생성을 방지하기 위한 생성된 날짜 집합

        // Todo 생성의 상한선을 계산합니다. (예: 주간 반복은 3개월, 월간 반복은 1년)
        LocalDate generationLimit = calculateGenerationLimit(rule.getType(), baseTodo.getDueDate());
        LocalDate endDate = rule.getEndDate(); // 반복 규칙의 명시적 종료일

        // 반복 규칙이 '주간(WEEKLY)'인 경우
        if ("WEEKLY".equals(rule.getType())) {
            // 규칙에 설정된 요일(예: "MON,WED,FRI")을 파싱하여 DayOfWeek 객체 목록으로 변환합니다.
            List<DayOfWeek> targetDaysOfWeek = getParsedWeekDays(rule.getWeekDays()).stream()
                    .map(this::getDayOfWeek) // 문자열 요일을 DayOfWeek 열거형으로 변환
                    .filter(Optional::isPresent) // 유효한 요일만 필터링
                    .map(Optional::get)
                    .collect(Collectors.toList());

            // 유효한 요일이 없으면 Todo를 생성하지 않고 경고 로그를 남깁니다.
            if (targetDaysOfWeek.isEmpty()) {
                log.warn("주간 반복 규칙(ID: {})에 유효한 요일이 없어 Todo를 생성하지 않습니다.", rule.getRepeatRuleId());
                return;
            }

            // 반복 날짜 계산을 시작할 기준 날짜 (기본 Todo의 DueDate부터 시작)
            LocalDate weekStepper = baseTodo.getDueDate();
            // 생성 상한선에 도달할 때까지 주간 반복 Todo를 생성합니다.
            while (weekStepper.isBefore(generationLimit)) {
                // 각 목표 요일에 대해 Todo를 생성합니다.
                for (DayOfWeek dayOfWeek : targetDaysOfWeek) {
                    // 현재 주차(weekStepper 기준)에서 해당 요일의 날짜를 계산합니다.
                    LocalDate nextDueDate = weekStepper.with(dayOfWeek);

                    // 생성된 날짜가 기본 Todo의 DueDate 이후인 경우에만 처리합니다.
                    // 이는 과거의 Todo를 다시 생성하지 않기 위함입니다.
                    if(nextDueDate.isAfter(baseTodo.getDueDate())){
                        // 종료일(endDate)을 넘어서거나 생성 상한선을 넘어서면 현재 요일 이후의 Todo는 생성하지 않습니다.
                        if ((endDate != null && nextDueDate.isAfter(endDate)) || nextDueDate.isAfter(generationLimit)) {
                            continue; // 다음 요일로 넘어갑니다.
                        }
                        // 이미 생성된 날짜인지 확인하고, 중복이 아니면 Todo 목록에 추가합니다.
                        // generatedDates.add(nextDueDate)는 중복이 아닐 경우 true를 반환하고, 집합에 추가합니다.
                        if (generatedDates.add(nextDueDate)) {
                            todosToCreate.add(createNewTodoFromBase(baseTodo, nextDueDate, rule.getRepeatRuleId()));
                        }
                    }
                }
                // 다음 반복 주기(간격)만큼 주차를 증가시킵니다. (예: 2주마다 반복이면 2주 증가)
                weekStepper = weekStepper.plusWeeks(rule.getIntervalValue());
            }
        }
        // 반복 규칙이 '일간(DAILY)', '월간(MONTHLY)'인 경우
        else {
            LocalDate currentDate = baseTodo.getDueDate(); // 반복 날짜 계산을 시작할 기준 날짜
            // 생성 상한선에 도달할 때까지 일간/월간 반복 Todo를 생성합니다.
            while (currentDate.isBefore(generationLimit)) {
                int interval = rule.getIntervalValue(); // 반복 간격
                LocalDate nextDueDate;
                // 반복 타입에 따라 다음 DueDate를 계산합니다.
                switch (rule.getType()) {
                    case "DAILY": // 일간 반복: interval 만큼 일(day)을 더합니다.
                        nextDueDate = currentDate.plusDays(interval);
                        break;
                    case "MONTHLY": // 월간 반복: interval 만큼 월(month)을 더합니다.
                        nextDueDate = currentDate.plusMonths(interval);
                        break;
                    default: // 지원하지 않는 반복 타입인 경우
                        log.warn("Unknown repeat type: {}. Terminating repeat generation.", rule.getType());
                        return; // 메서드를 종료합니다.
                }

                // 계산된 다음 DueDate가 종료일(endDate)을 넘어서거나 생성 상한선을 넘어서면 반복을 중단합니다.
                if ((endDate != null && nextDueDate.isAfter(endDate)) || nextDueDate.isAfter(generationLimit)) {
                    break;
                }

                // 해당 날짜가 반복 규칙에 맞는지 확인하고, 중복이 아니면 Todo 목록에 추가합니다.
                if (isDateMatchingRule(nextDueDate, rule, baseTodo) && generatedDates.add(nextDueDate)) {
                    todosToCreate.add(createNewTodoFromBase(baseTodo, nextDueDate, rule.getRepeatRuleId()));
                }
                currentDate = nextDueDate; // 다음 반복을 위해 currentDate를 nextDueDate로 업데이트합니다.
            }
        }

        // 생성할 Todo가 있으면 일괄적으로 데이터베이스에 삽입합니다.
        if (!todosToCreate.isEmpty()) {
            todoMapper.insertTodos(todosToCreate);
        }
    }

    /**
     * 기존 Todo 정보를 바탕으로 새로운 반복 Todo 객체를 생성합니다.
     * 새로운 DueDate와 반복 규칙 ID를 설정합니다.
     *
     * @param baseTodo     새로운 Todo를 생성할 때 기준이 되는 {@link TodoVO} 객체
     * @param newDueDate   새로 생성될 Todo의 완료 예정일
     * @param repeatRuleId 이 Todo가 속할 반복 규칙의 ID
     * @return 새로 생성된 {@link TodoVO} 객체
     */
    private TodoVO createNewTodoFromBase(TodoVO baseTodo, LocalDate newDueDate, Long repeatRuleId) {
        return TodoVO.builder()
                .userId(baseTodo.getUserId())           // 사용자 ID
                .title(baseTodo.getTitle())             // Todo 제목
                .memo(baseTodo.getMemo())               // 메모 내용
                .dueDate(newDueDate)                    // 새로 계산된 완료 예정일
                .isCompleted("N")                       // 기본적으로 미완료 상태
                .priority(baseTodo.getPriority())       // 우선순위
                .repeatRuleId(repeatRuleId)             // 반복 규칙 ID
                .categoryId(baseTodo.getCategoryId())   // 카테고리 ID
                .build();
    }

    /**
     * 반복 규칙과 관련된 Todo 시리즈를 수정합니다.
     * "ALL" 또는 "AFTER_THIS" 두 가지 변경 타입에 따라 다르게 동작하며,
     * 트랜잭션 내에서 실행되어 데이터의 일관성을 보장합니다.
     *
     * @param ruleId     수정할 반복 규칙의 ID
     * @param changeType 변경 타입 ("ALL": 모든 반복 Todo 수정, "AFTER_THIS": 기준 Todo 이후의 반복 Todo만 수정)
     * @param newRuleVO  새로운 반복 규칙 정보를 담고 있는 {@link RepeatVO} 객체
     * @param baseTodoId 변경의 기준이 되는 Todo의 ID
     * @throws CustomException  기준 Todo를 찾을 수 없거나 반복 규칙을 찾을 수 없을 경우 발생
     * @throws IllegalArgumentException 지원하지 않는 변경 타입일 경우 발생
     */
    @Transactional
    public void updateRepeatRule(Long ruleId, String changeType, RepeatVO newRuleVO, Long baseTodoId, LocalDate originalDueDate) {
        // 1. 기준 Todo를 조회합니다.
        TodoVO baseTodo = todoMapper.findTodoById(baseTodoId);
        if (baseTodo == null) {
            throw new CustomException(ErrorCode.TODO_NOT_FOUND); // Todo가 없으면 예외 발생
        }

        List<TodoVO> todosToShift; // 변경 대상이 되는 Todo 목록
        TodoVO anchorTodo; // 변경의 기준점이 되는 Todo

        // 변경 타입이 "ALL" (시리즈 전체 수정)인 경우
        if ("ALL".equalsIgnoreCase(changeType)) {
            // 해당 반복 규칙에 속하는 모든 Todo를 조회합니다.
            List<TodoVO> allTodosInSeries = todoMapper.findTodosByRepeatRuleId(ruleId);
            // 미완료된 Todo 중 가장 빠른 DueDate를 가진 Todo를 기준점(anchorTodo)으로 설정합니다.
            anchorTodo = allTodosInSeries.stream()
                    .filter(t -> "N".equals(t.getIsCompleted())) // 미완료된 Todo만 필터링
                    .min(Comparator.comparing(TodoVO::getDueDate)) // DueDate가 가장 빠른 Todo
                    .orElse(null); // 없으면 null

            // 모든 Todo가 완료되었거나, 기준 Todo를 찾을 수 없으면 수정을 종료합니다.
            if (anchorTodo == null) {
                log.info("반복 시리즈의 모든 투두가 완료되어 수정을 종료합니다. Rule ID: {}", ruleId);
                return;
            }

            // 기준점(anchorTodo) 이후의 미완료 Todo들을 변경 대상으로 설정합니다.
            todosToShift = allTodosInSeries.stream()
                    .filter(t -> "N".equals(t.getIsCompleted()) && !t.getDueDate().isBefore(anchorTodo.getDueDate()))
                    .collect(Collectors.toList());

            // 새로운 반복 규칙 정보를 기존 규칙 ID에 맵핑하여 업데이트합니다.
            newRuleVO.setRepeatRuleId(ruleId);
            repeatMapper.updateRepeatRule(newRuleVO);

        }
        // 변경 타입이 "AFTER_THIS" (기준 Todo 이후 일정만 수정)인 경우
        else if ("AFTER_THIS".equalsIgnoreCase(changeType)) {
            anchorTodo = baseTodo; // 기준 Todo 자체가 변경의 기준점이 됩니다.
            // 기준 Todo의 DueDate를 포함하여 그 이후의 미완료 Todo들을 변경 대상으로 설정합니다.
            todosToShift = todoMapper.findTodosByRepeatRuleIdOnOrAfterDate(ruleId, originalDueDate).stream()
                    .filter(t -> "N".equals(t.getIsCompleted()))
                    .collect(Collectors.toList());

            // 기존 반복 규칙을 조회하여 종료일을 기준 Todo의 하루 전으로 설정합니다.
            // 이는 기존 규칙의 적용 범위를 줄이기 위함입니다.
            RepeatVO oldRule = repeatMapper.findRepeatRuleById(ruleId)
                    .orElseThrow(() -> new CustomException(ErrorCode.REPEAT_RULE_NOT_FOUND));
            // 중요: 시리즈 분리 시점의 정확성을 위해 '수정 전 원본 마감일'을 기준으로 기존 규칙의 종료일을 설정합니다.
            // 만약 여기서 변경 후의 마감일(baseTodo.getDueDate())을 사용하면,
            // 기존 시리즈와 새 시리즈 사이에 날짜 공백이 생기거나 의도치 않은 중첩이 발생할 수 있습니다.
            oldRule.setEndDate(originalDueDate.minusDays(1));
            repeatMapper.updateRepeatRule(oldRule);

            // 새로운 반복 규칙을 삽입합니다. (새로운 시리즈가 시작됨)
            repeatMapper.insertRepeatRule(newRuleVO);

        }
        // 지원하지 않는 변경 타입인 경우
        else {
            throw new IllegalArgumentException("지원하지 않는 변경 타입입니다: " + changeType);
        }

        // 실제 Todo들의 DueDate를 변경하고 불필요한 Todo를 삭제하는 로직을 호출합니다.
        shiftRepeatTodos(todosToShift, newRuleVO, anchorTodo);
    }


    /**
     * '이후 일정 수정' 시, 반복 Todo들의 컨텐츠(제목, 우선순위 등)와 날짜를 새로운 규칙에 맞게 변경하고,
     * 새 규칙에 따라 더 이상 필요 없는 미래의 Todo는 삭제합니다.
     *
     * @param todosToShift 변경 대상이 되는 {@link TodoVO} 목록 (수정 기준 Todo 포함)
     * @param newRule      적용할 새로운 반복 규칙 {@link RepeatVO}
     * @param anchorTodo   변경의 기준점이 되는 {@link TodoVO} (이 Todo의 최신 컨텐츠가 후속 Todo들에 전파됨)
     */
    private void shiftRepeatTodos(List<TodoVO> todosToShift, RepeatVO newRule, TodoVO anchorTodo) {
        if (todosToShift.isEmpty()) {
            return;
        }

        // 새 반복 규칙에 따라 생성될 후속 Todo들의 DueDate 목록을 생성합니다.
        // 이 목록은 anchorTodo '이후'의 날짜들만 포함합니다.
        List<LocalDate> newSuccessorDueDates = generateRepeatDates(newRule, anchorTodo);
        // todosToShift는 원본 날짜 기준으로 정렬되어 있다고 가정합니다.
        Iterator<TodoVO> todoIterator = todosToShift.iterator();

        // 1. 첫 번째 Todo(수정의 기준이 된 anchorTodo)를 처리합니다.
        // 이 Todo의 컨텐츠(제목, 마감일 등)는 이미 TodoService에서 변경되었으므로,
        // 여기서는 새로운 반복 규칙 ID(newRule.getRepeatRuleId())만 할당해줍니다.
        TodoVO anchorTodoInList = todoIterator.next();
        todoMapper.updateShiftedRepeatTodo(
                anchorTodoInList.getTodoId(),
                anchorTodo.getDueDate(), // TodoService에서 변경된 최신 마감일
                newRule.getRepeatRuleId(),
                anchorTodo.getTitle(),
                anchorTodo.getMemo(),
                anchorTodo.getPriority()
        );

        // 2. 후속 Todo들을 순회하며 업데이트하거나 삭제 목록에 추가합니다.
        int successorDateIndex = 0;
        List<Long> idsToDelete = new ArrayList<>();
        while (todoIterator.hasNext()) {
            TodoVO currentSuccessorTodo = todoIterator.next();

            // 업데이트할 새 날짜가 남아있으면, 후속 Todo의 컨텐츠를 업데이트합니다.
            if (successorDateIndex < newSuccessorDueDates.size()) {
                LocalDate newDueDate = newSuccessorDueDates.get(successorDateIndex);

                // 핵심: 날짜와 규칙 ID 뿐만 아니라, 제목/메모/우선순위 등 anchorTodo의 최신 컨텐츠를 함께 전파합니다.
                todoMapper.updateShiftedRepeatTodo(
                        currentSuccessorTodo.getTodoId(),
                        newDueDate,
                        newRule.getRepeatRuleId(),
                        anchorTodo.getTitle(), // anchorTodo의 제목으로 통일
                        anchorTodo.getMemo(),   // anchorTodo의 메모로 통일
                        anchorTodo.getPriority() // anchorTodo의 우선순위로 통일
                );
                successorDateIndex++;
            }
            // 업데이트할 날짜가 더 없는데 기존 Todo가 남아있다면, 불필요한 Todo이므로 삭제 목록에 추가합니다.
            else {
                idsToDelete.add(currentSuccessorTodo.getTodoId());
            }
        }

        // 3. 삭제할 Todo가 있다면 DB에서 일괄 삭제합니다.
        if (!idsToDelete.isEmpty()) {
            todoMapper.deleteTodos(idsToDelete);
            log.info("{}개의 불필요한 반복 Todo를 삭제했습니다.", idsToDelete.size());
        }
    }

    /**
     * 주어진 반복 규칙과 기준 Todo를 바탕으로 미래에 반복될 Todo들의 DueDate 목록을 생성합니다.
     * <p>
     * 변경사항: baseTodo의 DueDate가 null인 경우, 반복 날짜를 생성하지 않고 빈 리스트를 반환합니다.
     * 이는 마감일이 없는 Todo를 기준으로 반복 일정을 생성하려 할 때 발생하는 논리적 오류를 방지합니다.
     *
     * @param rule     반복 규칙 정보를 담고 있는 {@link RepeatVO} 객체
     * @param baseTodo 반복 날짜 생성의 기준이 되는 {@link TodoVO} 객체
     * @return 생성된 {@link LocalDate} 목록
     */
    private List<LocalDate> generateRepeatDates(RepeatVO rule, TodoVO baseTodo) {
        // baseTodo의 DueDate가 null인 경우 반복 날짜를 생성할 수 없으므로 빈 리스트 반환
        if (baseTodo.getDueDate() == null) {
            log.warn("기준 Todo의 DueDate가 null이므로 반복 날짜를 생성하지 않습니다. TodoId: {}", baseTodo.getTodoId());
            return Collections.emptyList();
        }

        List<LocalDate> newDueDates = new ArrayList<>(); // 생성될 DueDate 목록
        Set<LocalDate> generatedDates = new HashSet<>(); // 중복 방지를 위한 생성된 날짜 집합

        // Todo 생성의 상한선을 계산합니다.
        LocalDate generationLimit = calculateGenerationLimit(rule.getType(), baseTodo.getDueDate());
        LocalDate dateCalculator = baseTodo.getDueDate(); // 날짜 계산을 위한 현재 날짜
        LocalDate endDate = rule.getEndDate(); // 반복 규칙의 명시적 종료일

        // 생성 상한선에 도달할 때까지 반복 날짜를 생성합니다.
        while (dateCalculator.isBefore(generationLimit)) {
            // 다음 유효한 날짜를 찾습니다. (반복 타입에 따라 다름)
            Optional<LocalDate> nextDueDateOpt = findNextValidDate(dateCalculator, rule, baseTodo);
            // 다음 유효한 날짜가 없으면 반복을 중단합니다. (예: 주간 반복 요일이 없는 경우)
            if (!nextDueDateOpt.isPresent()) break;

            LocalDate nextDueDate = nextDueDateOpt.get();
            // 계산된 날짜가 종료일(endDate)을 넘어서거나 생성 상한선을 넘어서면 반복을 중단합니다.
            if ((endDate != null && nextDueDate.isAfter(endDate)) || nextDueDate.isAfter(generationLimit)) break;

            // 중복되지 않은 날짜인 경우에만 목록에 추가합니다.
            if (generatedDates.add(nextDueDate)) {
                newDueDates.add(nextDueDate);
            }
            dateCalculator = nextDueDate; // 다음 반복을 위해 현재 날짜를 업데이트합니다.
        }
        return newDueDates;
    }

    /**
     * 현재 날짜와 반복 규칙을 바탕으로 다음 유효한 반복 날짜를 찾아 반환합니다.
     *
     * @param currentDate 현재 날짜
     * @param rule        반복 규칙 정보를 담고 있는 {@link RepeatVO} 객체
     * @param baseTodo    반복 날짜 생성의 기준이 되는 {@link TodoVO} 객체 (월간 반복 시 일(day) 정보 활용)
     * @return 다음 유효한 {@link LocalDate}를 포함하는 Optional 객체. 유효한 날짜를 찾지 못하면 Optional.empty() 반환.
     */
    private Optional<LocalDate> findNextValidDate(LocalDate currentDate, RepeatVO rule, TodoVO baseTodo) {
        // 반복 규칙이 '주간(WEEKLY)'인 경우
        if ("WEEKLY".equals(rule.getType())) {
            // 규칙에 설정된 요일을 파싱하여 정렬된 DayOfWeek 목록을 가져옵니다.
            List<DayOfWeek> targetDaysOfWeek = getParsedWeekDays(rule.getWeekDays()).stream()
                    .map(this::getDayOfWeek).filter(Optional::isPresent).map(Optional::get).sorted().collect(Collectors.toList());
            if (targetDaysOfWeek.isEmpty()) return Optional.empty(); // 목표 요일이 없으면 빈 Optional 반환

            DayOfWeek currentDay = currentDate.getDayOfWeek(); // 현재 날짜의 요일
            // 현재 주(week) 내에서 현재 요일 이후에 오는 첫 번째 목표 요일을 찾습니다.
            Optional<DayOfWeek> nextDayInSameWeek = targetDaysOfWeek.stream().filter(d -> d.getValue() > currentDay.getValue()).findFirst();

            // 현재 주 내에 다음 목표 요일이 있다면 해당 요일의 날짜를 반환합니다.
            if (nextDayInSameWeek.isPresent()) {
                 return Optional.of(currentDate.with(nextDayInSameWeek.get()));
            }
            // 현재 주에 다음 목표 요일이 없다면, 다음 반복 주기(intervalValue)만큼 주를 더한 후,
            // 목표 요일 목록의 첫 번째 요일(가장 빠른 요일)의 날짜를 반환합니다.
            else {
                LocalDate nextIntervalWeek = currentDate.plusWeeks(rule.getIntervalValue());
                return Optional.of(nextIntervalWeek.with(targetDaysOfWeek.get(0)));
            }
        }
        // 반복 규칙이 '일간(DAILY)' 또는 '월간(MONTHLY)'인 경우
        else {
            int interval = rule.getIntervalValue(); // 반복 간격
            LocalDate nextDate = currentDate; // 다음 날짜 계산을 위한 임시 변수
            // 항상 다음 날짜를 찾도록 무한 루프를 사용합니다. (조건에 맞을 때까지)
            while(true) {
                // 반복 타입에 따라 다음 날짜를 계산합니다.
                switch (rule.getType()) {
                    case "DAILY": // 일간 반복: interval 만큼 일(day)을 더합니다.
                        nextDate = nextDate.plusDays(interval);
                        break;
                    case "MONTHLY": // 월간 반복: interval 만큼 월(month)을 더합니다.
                        nextDate = nextDate.plusMonths(interval);
                        break;
                    default: return Optional.empty(); // 지원하지 않는 타입이면 빈 Optional 반환
                }
                // 계산된 날짜가 반복 규칙에 맞는지 확인합니다. (예: 월간 반복의 경우 날짜의 일(day)이 일치하는지)
                if (isDateMatchingRule(nextDate, rule, baseTodo)) {
                    return Optional.of(nextDate); // 규칙에 맞으면 해당 날짜 반환
                }
            }
        }
    }

    /**
     * 주어진 날짜가 반복 규칙에 부합하는지 확인합니다.
     * 각 반복 타입(일간, 주간, 월간)에 따라 다른 기준을 적용합니다.
     *
     * @param newDate   확인할 {@link LocalDate} 객체
     * @param rule      반복 규칙 정보를 담고 있는 {@link RepeatVO} 객체
     * @param anchorTodo 월간 반복 시 기준이 되는 Todo의 DueDate 정보를 활용하기 위한 {@link TodoVO} 객체
     * @return 날짜가 규칙에 일치하면 true, 그렇지 않으면 false
     */
    private boolean isDateMatchingRule(LocalDate newDate, RepeatVO rule, TodoVO anchorTodo) {
        switch (rule.getType()) {
            case "DAILY":
                return true; // 일간 반복은 모든 날짜가 규칙에 일치합니다.
            case "WEEKLY":
                // 주간 반복의 경우, 규칙에 설정된 요일 목록에 newDate의 요일이 포함되는지 확인합니다.
                List<String> weekDays = getParsedWeekDays(rule.getWeekDays());
                return weekDays.stream().anyMatch(day -> getDayOfWeek(day).map(d -> d == newDate.getDayOfWeek()).orElse(false));
            case "MONTHLY":
                // 월간 반복의 경우, newDate의 일(day)이 기준 Todo의 DueDate의 일(day)과 일치하는지 확인합니다.
                // 예를 들어, 매월 15일 반복이면 newDate의 일도 15여야 합니다.
                return newDate.getDayOfMonth() == anchorTodo.getDueDate().getDayOfMonth();
            default:
                return false; // 지원하지 않는 반복 타입
        }
    }

    /**
     * 반복 타입에 따라 Todo 생성의 상한선(미래의 언제까지 Todo를 생성할 것인지)을 계산합니다.
     * 이는 무한 반복 생성을 방지하고 성능을 관리하기 위함입니다.
     *
     * @param repeatType 반복 타입 (예: "WEEKLY", "MONTHLY", "DAILY")
     * @param baseDate   기준 날짜 (보통 첫 번째 Todo의 DueDate)
     * @return 계산된 생성 상한선 {@link LocalDate}
     */
    private LocalDate calculateGenerationLimit(String repeatType, LocalDate baseDate) {
        switch (repeatType) {
            case "WEEKLY":
                return baseDate.plusMonths(3); // 주간 반복은 기준 날짜로부터 3개월 후까지 생성
            case "MONTHLY":
                return baseDate.plusYears(1); // 월간 반복은 기준 날짜로부터 1년 후까지 생성
            default: // "DAILY" 및 기타 모든 경우
                return baseDate.plusWeeks(4); // 일간 반복은 기준 날짜로부터 4주 후까지 생성
        }
    }

    /**
     * 요일 문자열(예: "SUN", "MON", "TUE")을 Java의 {@link DayOfWeek} 열거형으로 변환합니다.
     * 대소문자를 구분하지 않으며, 약어 및 전체 이름 모두 지원을 시도합니다.
     *
     * @param day 요일을 나타내는 문자열
     * @return {@link DayOfWeek}를 포함하는 Optional 객체. 변환에 실패하면 Optional.empty() 반환.
     */
    private Optional<DayOfWeek> getDayOfWeek(String day) {
        if (day == null) return Optional.empty(); // 입력 문자열이 null이면 빈 Optional 반환
        String upperDay = day.trim().toUpperCase(); // 공백 제거 및 대문자로 변환하여 비교 일관성 유지
        switch (upperDay) {
            // 주로 사용되는 약어에 대한 매핑
            case "SUN": return Optional.of(DayOfWeek.SUNDAY);
            case "MON": return Optional.of(DayOfWeek.MONDAY);
            case "TUE": return Optional.of(DayOfWeek.TUESDAY);
            case "WED": return Optional.of(DayOfWeek.WEDNESDAY);
            case "THU": return Optional.of(DayOfWeek.THURSDAY);
            case "FRI": return Optional.of(DayOfWeek.FRIDAY);
            case "SAT": return Optional.of(DayOfWeek.SATURDAY);
            default:
                try {
                    // 약어가 아닌 전체 요일 이름(예: "MONDAY")이 올 경우 DayOfWeek.valueOf()를 사용하여 변환 시도
                    return Optional.of(DayOfWeek.valueOf(upperDay));
                } catch (IllegalArgumentException e) {
                    // 유효한 요일 문자열이 아니면 예외가 발생하고, 빈 Optional을 반환합니다.
                    return Optional.empty();
                }
        }
    }

    /**
     * 콤마로 구분된 요일 문자열(예: "MON,WED,FRI")을 파싱하여 요일 문자열 리스트로 변환합니다.
     * 입력 문자열이 null이거나 비어 있으면 빈 리스트를 반환합니다.
     *
     * @param weekDaysCsv 콤마로 구분된 요일 문자열
     * @return 요일 문자열의 {@link List}
     */
    private List<String> getParsedWeekDays(String weekDaysCsv) {
        if (weekDaysCsv == null || weekDaysCsv.trim().isEmpty()) {
            return Collections.emptyList(); // 입력 문자열이 유효하지 않으면 빈 리스트 반환
        }
        // 콤마(,)를 기준으로 문자열을 분리하고, 각 요일 문자열의 앞뒤 공백을 제거한 후 리스트로 수집합니다.
        return Arrays.stream(weekDaysCsv.split(","))
                .map(String::trim)
                .collect(Collectors.toList());
    }

    /**
     * 특정 반복 규칙의 종료일을 설정하여 더 이상 해당 규칙에 따른 Todo가 생성되지 않도록 합니다.
     * 트랜잭션 내에서 실행되어 데이터의 일관성을 보장합니다.
     *
     * @param ruleId     종료할 반복 규칙의 ID
     * @param anchorDate 반복 규칙의 새로운 종료일이 될 기준 날짜 (이 날짜 하루 전으로 종료일 설정)
     */
    @Transactional
    public void terminateRepeatRule(Long ruleId, LocalDate anchorDate) {
        // 1. ruleId로 반복 규칙을 조회합니다.
        RepeatVO rule = repeatMapper.findRepeatRuleById(ruleId).orElse(null);
        if (rule == null) {
            log.warn("반복 규칙(ID: {})을 찾을 수 없어 종료일을 업데이트할 수 없습니다.", ruleId);
            return; // 규칙을 찾을 수 없으면 작업을 중단합니다.
        }
        if (anchorDate == null) {
            log.warn("반복 규칙(ID: {}) 종료를 위한 기준 날짜가 null이므로 작업을 중단합니다.", ruleId);
            return; // 기준 날짜가 없으면 작업을 중단합니다.
        }
        // 2. 반복 규칙의 종료일을 anchorDate의 하루 전으로 설정합니다.
        // 이는 anchorDate부터는 해당 규칙의 적용을 받지 않도록 하기 위함입니다.
        rule.setEndDate(anchorDate.minusDays(1));
        // 3. 업데이트된 반복 규칙을 데이터베이스에 반영합니다.
        repeatMapper.updateRepeatRule(rule);
        log.info("반복 규칙(ID: {})의 효력을 중지했습니다. 종료일을 {}로 설정했습니다.", ruleId, rule.getEndDate());
    }

    /**
     * 특정 Todo를 기준으로 그 이후의 모든 반복 Todo를 삭제하고,
     * 해당 반복 규칙의 종료일을 갱신합니다.
     * 트랜잭션 내에서 실행되어 데이터의 일관성을 보장합니다.
     *
     * @param todoId 기준이 되는 Todo의 ID
     */
    @Transactional
    public void deleteRepeatTodosAfter(Long todoId) {
        // 1. 기준 Todo를 조회합니다.
        TodoVO todo = todoMapper.findTodoById(todoId);
        // Todo가 존재하지 않거나 반복 규칙에 속하지 않는 Todo인 경우 작업을 중단합니다.
        if (todo == null || todo.getRepeatRuleId() == null) {
            log.info("Todo가 존재하지 않거나 반복되지 않는 Todo이므로 '이후 일정 삭제'를 진행하지 않습니다: " + todoId);
            return;
        }

        log.info("'이후 모든 일정 삭제'를 시작합니다: todoId={}, repeatRuleId={}", todo.getTodoId(), todo.getRepeatRuleId());
        // 2. 기준 Todo의 DueDate 이후에 있는 모든 반복 Todo를 삭제합니다.
        // 예를 들어, 2023-01-15 Todo를 기준으로 삭제를 요청하면, 2023-01-15 이후의 모든 반복 Todo가 삭제됩니다.
        todoMapper.deleteTodosAfterDate(todo.getRepeatRuleId(), todo.getDueDate());
        log.info("미래의 반복 Todo들을 삭제했습니다.");
        // 3. 해당 반복 규칙의 종료일을 기준 Todo의 DueDate의 하루 전으로 설정하여 규칙을 종료합니다.
        // 이는 새로운 Todo가 이 규칙에 따라 더 이상 생성되지 않도록 합니다.
        terminateRepeatRule(todo.getRepeatRuleId(), todo.getDueDate());
        // 4. 마지막으로, 기준이 되는 Todo 자체를 삭제합니다.
        todoMapper.deleteTodo(todoId);
        log.info("기준 Todo(ID: {})를 삭제했습니다.", todoId);
    }

    /**
     * 반복 규칙의 종료일이 지났는지 확인하고, 만약 지났다면 해당 규칙에 따라 생성된 미래의 Todo들을 정리합니다.
     * 이 메서드는 스케줄러 등에 의해 주기적으로 호출될 수 있습니다.
     *
     * @param ruleId 확인할 반복 규칙의 ID
     */
    @Transactional
    public void handleRepeatEndDate(Long ruleId) {
        // 1. ruleId로 반복 규칙을 조회합니다.
        RepeatVO rule = repeatMapper.findRepeatRuleById(ruleId).orElse(null);
        // 규칙이 존재하고, 종료일이 설정되어 있으며, 그 종료일이 현재 날짜보다 이전인 경우에만 처리합니다.
        if (rule != null && rule.getEndDate() != null) {
            if (rule.getEndDate().isBefore(LocalDate.now())) {
                // 2. 종료일이 지났으므로, 현재 날짜 이후의 모든 Todo를 삭제합니다.
                // 이는 더 이상 유효하지 않은 미래의 반복 Todo들을 정리하여 데이터베이스를 깔끔하게 유지하기 위함입니다.
                todoMapper.deleteTodosAfterDate(ruleId, LocalDate.now());
                log.info("반복 규칙 ID {}의 종료일이 경과하여 향후 일정을 정리했습니다.", ruleId);
            }
        }
    }
}

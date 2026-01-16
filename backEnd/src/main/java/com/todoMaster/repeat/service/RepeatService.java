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

@Service
@RequiredArgsConstructor
@Slf4j
public class RepeatService {

    private final RepeatMapper repeatMapper;
    private final TodoMapper todoMapper;

    @Transactional
    public void createTodoWithRepeatRule(RepeatVO repeatVO, TodoVO todo) {
        repeatMapper.insertRepeatRule(repeatVO);
        todo.setRepeatRuleId(repeatVO.getRepeatRuleId());
        todoMapper.updateTodo(todo);
        generateRepeatTodos(repeatVO, todo);
    }

    @Transactional
    public void generateRepeatTodos(RepeatVO rule, TodoVO baseTodo) {
        List<TodoVO> todosToCreate = new ArrayList<>();
        Set<LocalDate> generatedDates = new HashSet<>();

        LocalDate generationLimit = calculateGenerationLimit(rule.getType(), baseTodo.getDueDate());
        LocalDate endDate = rule.getEndDate();

        if ("WEEKLY".equals(rule.getType())) {
            List<DayOfWeek> targetDaysOfWeek = getParsedWeekDays(rule.getWeekDays()).stream()
                    .map(this::getDayOfWeek)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(Collectors.toList());

            if (targetDaysOfWeek.isEmpty()) {
                log.warn("주간 반복 규칙(ID: {})에 유효한 요일이 없어 Todo를 생성하지 않습니다.", rule.getRepeatRuleId());
                return;
            }

            LocalDate weekStepper = baseTodo.getDueDate();
            while (weekStepper.isBefore(generationLimit)) {
                
                for (DayOfWeek dayOfWeek : targetDaysOfWeek) {
                    LocalDate nextDueDate = weekStepper.with(dayOfWeek);
                    
                    if(nextDueDate.isAfter(baseTodo.getDueDate())){
                        if ((endDate != null && nextDueDate.isAfter(endDate)) || nextDueDate.isAfter(generationLimit)) {
                            continue;
                        }
                        if (generatedDates.add(nextDueDate)) {
                            todosToCreate.add(createNewTodoFromBase(baseTodo, nextDueDate, rule.getRepeatRuleId()));
                        }
                    }
                }
                weekStepper = weekStepper.plusWeeks(rule.getIntervalValue());
            }
        } else {
            LocalDate currentDate = baseTodo.getDueDate();
            while (currentDate.isBefore(generationLimit)) {
                int interval = rule.getIntervalValue();
                LocalDate nextDueDate;
                switch (rule.getType()) {
                    case "DAILY":
                        nextDueDate = currentDate.plusDays(interval);
                        break;
                    case "MONTHLY":
                        nextDueDate = currentDate.plusMonths(interval);
                        break;
                    default:
                        log.warn("Unknown repeat type: {}. Terminating repeat generation.", rule.getType());
                        return;
                }
                
                if ((endDate != null && nextDueDate.isAfter(endDate)) || nextDueDate.isAfter(generationLimit)) {
                    break;
                }

                if (isDateMatchingRule(nextDueDate, rule, baseTodo) && generatedDates.add(nextDueDate)) {
                    todosToCreate.add(createNewTodoFromBase(baseTodo, nextDueDate, rule.getRepeatRuleId()));
                }
                currentDate = nextDueDate;
            }
        }

        if (!todosToCreate.isEmpty()) {
            todoMapper.insertTodos(todosToCreate);
        }
    }

    private TodoVO createNewTodoFromBase(TodoVO baseTodo, LocalDate newDueDate, Long repeatRuleId) {
        return TodoVO.builder()
                .userId(baseTodo.getUserId())
                .title(baseTodo.getTitle())
                .memo(baseTodo.getMemo())
                .dueDate(newDueDate)
                .isCompleted("N")
                .priority(baseTodo.getPriority())
                .repeatRuleId(repeatRuleId)
                .categoryId(baseTodo.getCategoryId())
                .build();
    }

    @Transactional
    public void updateRepeatRule(Long ruleId, String changeType, RepeatVO newRuleVO, Long baseTodoId) {
        TodoVO baseTodo = todoMapper.findTodoById(baseTodoId);
        if (baseTodo == null) {
            throw new CustomException(ErrorCode.TODO_NOT_FOUND);
        }

        List<TodoVO> todosToShift;
        TodoVO anchorTodo;

        if ("ALL".equalsIgnoreCase(changeType)) {
            List<TodoVO> allTodosInSeries = todoMapper.findTodosByRepeatRuleId(ruleId);
            anchorTodo = allTodosInSeries.stream()
                    .filter(t -> "N".equals(t.getIsCompleted()))
                    .min(Comparator.comparing(TodoVO::getDueDate))
                    .orElse(null);

            if (anchorTodo == null) {
                log.info("반복 시리즈의 모든 투두가 완료되어 수정을 종료합니다. Rule ID: {}", ruleId);
                return;
            }

            todosToShift = allTodosInSeries.stream()
                    .filter(t -> "N".equals(t.getIsCompleted()) && !t.getDueDate().isBefore(anchorTodo.getDueDate()))
                    .collect(Collectors.toList());

            newRuleVO.setRepeatRuleId(ruleId);
            repeatMapper.updateRepeatRule(newRuleVO);

        } else if ("AFTER_THIS".equalsIgnoreCase(changeType)) {
            anchorTodo = baseTodo;
            todosToShift = todoMapper.findTodosByRepeatRuleIdOnOrAfterDate(ruleId, baseTodo.getDueDate()).stream()
                    .filter(t -> "N".equals(t.getIsCompleted()))
                    .collect(Collectors.toList());

            RepeatVO oldRule = repeatMapper.findRepeatRuleById(ruleId)
                    .orElseThrow(() -> new CustomException(ErrorCode.REPEAT_RULE_NOT_FOUND));

            oldRule.setEndDate(baseTodo.getDueDate().minusDays(1));
            repeatMapper.updateRepeatRule(oldRule);

            repeatMapper.insertRepeatRule(newRuleVO);

        } else {
            throw new IllegalArgumentException("지원하지 않는 변경 타입입니다: " + changeType);
        }

        shiftRepeatTodos(todosToShift, newRuleVO, anchorTodo);
    }

    private void shiftRepeatTodos(List<TodoVO> todosToShift, RepeatVO newRule, TodoVO anchorTodo) {
        if (todosToShift.isEmpty()) {
            return;
        }

        List<LocalDate> newDueDates = generateRepeatDates(newRule, anchorTodo);
        Iterator<TodoVO> todoIterator = todosToShift.iterator();

        TodoVO firstTodo = todoIterator.next();
        if (newRule.getRepeatRuleId() != null && !newRule.getRepeatRuleId().equals(firstTodo.getRepeatRuleId())) {
             todoMapper.updateTodoDueDateAndRepeatRule(firstTodo.getTodoId(), firstTodo.getDueDate(), newRule.getRepeatRuleId());
        }

        int dateIndex = 0;
        List<Long> idsToDelete = new ArrayList<>();
        while (todoIterator.hasNext()) {
            TodoVO currentTodo = todoIterator.next();
            if (dateIndex < newDueDates.size()) {
                LocalDate newDueDate = newDueDates.get(dateIndex);
                todoMapper.updateTodoDueDateAndRepeatRule(currentTodo.getTodoId(), newDueDate, newRule.getRepeatRuleId());
                dateIndex++;
            } else {
                idsToDelete.add(currentTodo.getTodoId());
            }
        }

        if (!idsToDelete.isEmpty()) {
            idsToDelete.forEach(todoMapper::deleteTodo);
            log.info("{}개의 불필요한 반복 Todo를 삭제했습니다.", idsToDelete.size());
        }
    }

    private List<LocalDate> generateRepeatDates(RepeatVO rule, TodoVO baseTodo) {
        List<LocalDate> newDueDates = new ArrayList<>();
        Set<LocalDate> generatedDates = new HashSet<>();

        LocalDate generationLimit = calculateGenerationLimit(rule.getType(), baseTodo.getDueDate());
        LocalDate dateCalculator = baseTodo.getDueDate();
        LocalDate endDate = rule.getEndDate();

        while (dateCalculator.isBefore(generationLimit)) {
            Optional<LocalDate> nextDueDateOpt = findNextValidDate(dateCalculator, rule, baseTodo);
            if (!nextDueDateOpt.isPresent()) break;

            LocalDate nextDueDate = nextDueDateOpt.get();
            if ((endDate != null && nextDueDate.isAfter(endDate)) || nextDueDate.isAfter(generationLimit)) break;

            if (generatedDates.add(nextDueDate)) {
                newDueDates.add(nextDueDate);
            }
            dateCalculator = nextDueDate;
        }
        return newDueDates;
    }

    private Optional<LocalDate> findNextValidDate(LocalDate currentDate, RepeatVO rule, TodoVO baseTodo) {
        if ("WEEKLY".equals(rule.getType())) {
            List<DayOfWeek> targetDaysOfWeek = getParsedWeekDays(rule.getWeekDays()).stream()
                    .map(this::getDayOfWeek).filter(Optional::isPresent).map(Optional::get).sorted().collect(Collectors.toList());
            if (targetDaysOfWeek.isEmpty()) return Optional.empty();

            DayOfWeek currentDay = currentDate.getDayOfWeek();
            Optional<DayOfWeek> nextDayInSameWeek = targetDaysOfWeek.stream().filter(d -> d.getValue() > currentDay.getValue()).findFirst();

            if (nextDayInSameWeek.isPresent()) {
                 return Optional.of(currentDate.with(nextDayInSameWeek.get()));
            } else {
                LocalDate nextIntervalWeek = currentDate.plusWeeks(rule.getIntervalValue());
                return Optional.of(nextIntervalWeek.with(targetDaysOfWeek.get(0)));
            }
        } else {
            int interval = rule.getIntervalValue();
            LocalDate nextDate = currentDate;
            // 항상 다음 날짜를 찾도록 루프를 사용합니다.
            while(true) {
                switch (rule.getType()) {
                    case "DAILY":
                        nextDate = nextDate.plusDays(interval);
                        break;
                    case "MONTHLY":
                        nextDate = nextDate.plusMonths(interval);
                        break;
                    default: return Optional.empty();
                }
                if (isDateMatchingRule(nextDate, rule, baseTodo)) {
                    return Optional.of(nextDate);
                }
            }
        }
    }

    private boolean isDateMatchingRule(LocalDate newDate, RepeatVO rule, TodoVO anchorTodo) {
        switch (rule.getType()) {
            case "DAILY": return true;
            case "WEEKLY":
                List<String> weekDays = getParsedWeekDays(rule.getWeekDays());
                return weekDays.stream().anyMatch(day -> getDayOfWeek(day).map(d -> d == newDate.getDayOfWeek()).orElse(false));
            case "MONTHLY": return newDate.getDayOfMonth() == anchorTodo.getDueDate().getDayOfMonth();
            default: return false;
        }
    }

    private LocalDate calculateGenerationLimit(String repeatType, LocalDate baseDate) {
        switch (repeatType) {
            case "WEEKLY": return baseDate.plusMonths(3);
            case "MONTHLY": return baseDate.plusYears(1);
            default: return baseDate.plusWeeks(4);
        }
    }

    private Optional<DayOfWeek> getDayOfWeek(String day) {
        if (day == null) return Optional.empty();
        String upperDay = day.trim().toUpperCase();
        switch (upperDay) {
            case "SUN": return Optional.of(DayOfWeek.SUNDAY);
            case "MON": return Optional.of(DayOfWeek.MONDAY);
            case "TUE": return Optional.of(DayOfWeek.TUESDAY);
            case "WED": return Optional.of(DayOfWeek.WEDNESDAY);
            case "THU": return Optional.of(DayOfWeek.THURSDAY);
            case "FRI": return Optional.of(DayOfWeek.FRIDAY);
            case "SAT": return Optional.of(DayOfWeek.SATURDAY);
            default:
                try {
                    return Optional.of(DayOfWeek.valueOf(upperDay));
                } catch (IllegalArgumentException e) {
                    return Optional.empty();
                }
        }
    }

    private List<String> getParsedWeekDays(String weekDaysCsv) {
        if (weekDaysCsv == null || weekDaysCsv.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(weekDaysCsv.split(","))
                .map(String::trim)
                .collect(Collectors.toList());
    }

    @Transactional
    public void terminateRepeatRule(Long ruleId, LocalDate anchorDate) {
        RepeatVO rule = repeatMapper.findRepeatRuleById(ruleId).orElse(null);
        if (rule == null) {
            log.warn("반복 규칙(ID: {})을 찾을 수 없어 종료일을 업데이트할 수 없습니다.", ruleId);
            return;
        }
        if (anchorDate == null) {
            log.warn("반복 규칙(ID: {}) 종료를 위한 기준 날짜가 null이므로 작업을 중단합니다.", ruleId);
            return;
        }
        rule.setEndDate(anchorDate.minusDays(1));
        repeatMapper.updateRepeatRule(rule);
        log.info("반복 규칙(ID: {})의 효력을 중지했습니다. 종료일을 {}로 설정했습니다.", ruleId, rule.getEndDate());
    }

    @Transactional
    public void deleteRepeatTodosAfter(Long todoId) {
        TodoVO todo = todoMapper.findTodoById(todoId);
        if (todo == null || todo.getRepeatRuleId() == null) {
            log.info("Todo가 존재하지 않거나 반복되지 않는 Todo이므로 '이후 일정 삭제'를 진행하지 않습니다: " + todoId);
            return;
        }
        log.info("'이후 모든 일정 삭제'를 시작합니다: todoId={}, repeatRuleId={}", todo.getTodoId(), todo.getRepeatRuleId());
        todoMapper.deleteTodosAfterDate(todo.getRepeatRuleId(), todo.getDueDate());
        log.info("미래의 반복 Todo들을 삭제했습니다.");
        terminateRepeatRule(todo.getRepeatRuleId(), todo.getDueDate());
        todoMapper.deleteTodo(todoId);
        log.info("기준 Todo(ID: {})를 삭제했습니다.", todoId);
    }

    @Transactional
    public void handleRepeatEndDate(Long ruleId) {
        RepeatVO rule = repeatMapper.findRepeatRuleById(ruleId).orElse(null);
        if (rule != null && rule.getEndDate() != null) {
            if (rule.getEndDate().isBefore(LocalDate.now())) {
                todoMapper.deleteTodosAfterDate(ruleId, LocalDate.now());
                log.info("반복 규칙 ID {}의 종료일이 경과하여 향후 일정을 정리했습니다.", ruleId);
            }
        }
    }
}

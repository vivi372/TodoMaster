package com.todoMaster.batch;

import com.todoMaster.repeat.mapper.RepeatMapper;
import com.todoMaster.repeat.vo.RepeatVO;
import com.todoMaster.todo.mapper.TodoMapper;
import com.todoMaster.todo.vo.TodoVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * 반복 Todo 생성을 위한 배치 스케줄러 클래스.
 * 정해진 시간에 자동으로 실행되어, 반복 규칙에 따라 미래의 Todo 항목들을 미리 생성합니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RepeatTodoBatchScheduler {

    private final RepeatMapper repeatMapper;
    private final TodoMapper todoMapper;

    /**
     * 매일 새벽 4시에 실행되는 주된 배치 메서드.
     * 반복 규칙에 따라 필요한 Todo를 생성하고, 더 이상 사용되지 않는 규칙을 정리합니다.
     */
    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void createRepeatTodosBatch() {
        long startTime = System.currentTimeMillis();
        log.info("============== KST 04:00, 반복 Todo 배치 작업을 시작합니다. ==============");

        // 1. (선행 작업) 어떤 Todo와도 연결되지 않은 '고아 반복 규칙'을 삭제하여 정합성을 확보합니다.
        int deletedOrphanRulesCount = repeatMapper.deleteOrphanedRules();
        if (deletedOrphanRulesCount > 0) {
            log.info("{}개의 고아 반복 규칙을 삭제했습니다.", deletedOrphanRulesCount);
        }

        LocalDate today = LocalDate.now(); // 배치 실행 기준일

        // 2. 활성 상태인 모든 반복 규칙을 조회합니다.
        List<RepeatVO> activeRules = repeatMapper.findAllActiveRules(today);
        if (activeRules.isEmpty()) {
            log.info("처리할 활성 반복 규칙이 없습니다. 배치를 종료합니다.");
            long endTime = System.currentTimeMillis();
            log.info("============== 반복 Todo 배치 작업을 종료합니다. (총 소요 시간: {}ms) ==============", (endTime - startTime));
            return;
        }
        log.info("총 {}개의 활성 반복 규칙을 대상으로 작업을 시작합니다.", activeRules.size());

        List<TodoVO> allTodosToCreate = new ArrayList<>(); // 전체 신규 Todo를 담을 리스트

        // 3. 각 규칙을 순회하며 미래의 Todo를 생성합니다.
        for (RepeatVO rule : activeRules) {
            // 3-1. 생성 기준이 될 원본 Todo를 조회합니다.
            TodoVO baseTodo = todoMapper.findFirstByRepeatRuleId(rule.getRepeatRuleId());
            if (baseTodo == null) {
                log.warn("반복 규칙 ID [{}]에 연결된 원본 Todo가 없어 생성을 건너뜁니다. (고아 규칙일 수 있음)", rule.getRepeatRuleId());
                continue;
            }

            // 3-2. 원본 Todo에 마감일이 없으면 반복 생성이 불가능하므로 건너뜁니다.
            if (baseTodo.getDueDate() == null) {
                log.warn("반복 규칙 ID [{}]의 원본 Todo(ID: {})에 마감일(DueDate)이 없어 생성을 건너뜁니다.", rule.getRepeatRuleId(), baseTodo.getTodoId());
                continue;
            }

            // 3-3. 중복 생성을 방지하기 위해, 해당 반복 규칙으로 이미 생성된 모든 날짜를 조회합니다.
            Set<LocalDate> existingDueDates = todoMapper.findDueDatesByRepeatRuleId(rule.getRepeatRuleId());

            // 3-4. 반복 유형에 따라 생성 상한선을 계산합니다. (DAILY: 4주, WEEKLY: 3개월, MONTHLY: 1년)
            LocalDate generationLimit = calculateGenerationLimit(rule.getType(), today);

            // 3-5. 오늘부터 생성 상한선까지 날짜를 하루씩 증가시키며 조건에 맞는 Todo를 생성합니다.
            LocalDate currentDate = today;
            while (!currentDate.isAfter(generationLimit)) {
                // 규칙의 종료일이 설정되어 있고, 현재 날짜가 종료일을 지났다면 더 이상 탐색할 필요가 없습니다.
                if (rule.getEndDate() != null && currentDate.isAfter(rule.getEndDate())) {
                    break;
                }

                // isMatchingDate: 현재 날짜가 반복 규칙(주기, 요일, 날짜 등)에 정확히 부합하는지 검사합니다.
                boolean isTargetDay = isMatchingDate(currentDate, rule, baseTodo.getDueDate());

                // 오늘 이전 날짜는 생성하지 않으며, 규칙에 맞는 날짜이고, 아직 생성되지 않았다면 신규 Todo를 생성 목록에 추가합니다.
                if (!currentDate.isBefore(today) && isTargetDay && !existingDueDates.contains(currentDate)) {
                    TodoVO newTodo = createNewTodoFromBase(baseTodo, currentDate, rule.getRepeatRuleId());
                    allTodosToCreate.add(newTodo);
                    existingDueDates.add(currentDate); // 중복 추가 방지를 위해 Set에도 기록
                }
                
                // ※ 중요: 날짜 제어권을 이 곳으로 통일하여 하루씩 안정적으로 증가시킵니다.
                // isMatchingDate 함수 내부 또는 다른 로직에서 날짜를 임의로 증가시키지 않습니다.
                currentDate = currentDate.plusDays(1);
            }
        }

        // 4. 생성할 Todo가 있는 경우, DB에 Bulk Insert를 실행합니다.
        if (!allTodosToCreate.isEmpty()) {
            log.info("총 {}개의 새로운 반복 Todo를 데이터베이스에 추가합니다.", allTodosToCreate.size());
            todoMapper.insertTodos(allTodosToCreate);
        } else {
            log.info("새롭게 생성할 반복 Todo가 없습니다.");
        }

        long endTime = System.currentTimeMillis();
        log.info("총 생성된 Todo 개수: {}개", allTodosToCreate.size());
        log.info("============== 반복 Todo 배치 작업을 종료합니다. (총 소요 시간: {}ms) ==============", (endTime - startTime));
    }

    /**
     * 주어진 날짜(date)가 반복 규칙(rule)에 부합하는지 여부를 판단합니다.
     * @param date 검사할 대상 날짜
     * @param rule 반복 규칙
     * @param baseDueDate 반복의 기준이 되는 원본 Todo의 마감일
     * @return 규칙에 부합하면 true, 그렇지 않으면 false
     */
    private boolean isMatchingDate(LocalDate date, RepeatVO rule, LocalDate baseDueDate) {
        // 원본 마감일보다 이전 날짜는 비교 대상이 아님
        if (date.isBefore(baseDueDate)) {
            return false;
        }

        long interval = rule.getIntervalValue();
        switch (rule.getType()) {
            case "DAILY": {
                long daysBetween = ChronoUnit.DAYS.between(baseDueDate, date);
                return daysBetween >= 0 && daysBetween % interval == 0;
            }
            case "WEEKLY": {
                // 1. 요일이 일치하는지 먼저 확인
                if (rule.getWeekDays() == null || !rule.getWeekDays().contains(date.getDayOfWeek().name().substring(0, 3))) {
                    return false;
                }
                // 2. 기준일로부터의 주(week) 간격이 설정된 간격의 배수인지 확인
                long weeksBetween = ChronoUnit.WEEKS.between(baseDueDate, date);
                return weeksBetween >= 0 && weeksBetween % interval == 0;
            }
            case "MONTHLY": {
                // 1. 기준일로부터의 월(month) 간격이 설정된 간격의 배수인지 확인
                //    (날짜와 무관하게 월의 차이만 계산하기 위해 각 달의 1일로 정규화하여 비교)
                long monthsBetween = ChronoUnit.MONTHS.between(baseDueDate.withDayOfMonth(1), date.withDayOfMonth(1));
                if (monthsBetween <= 0 || monthsBetween % interval != 0) {
                    return false;
                }

                // 2. 날짜(day of month)가 일치하는지 확인
                // 예: 기준일이 31일인데 2월(28/29일)이나 4월(30일)처럼 해당 날짜가 없는 경우, 그 달의 마지막 날을 기준으로 함
                // Java Time API의 plusMonths는 이 부분을 자동으로 처리해주므로, 그 결과를 예상하여 비교
                LocalDate expectedDate = baseDueDate.plusMonths(monthsBetween);
                return date.equals(expectedDate);
            }
            default:
                log.warn("알 수 없는 반복 유형입니다: {}", rule.getType());
                return false;
        }
    }


    /**
     * 반복 유형에 따라 Todo 생성의 상한선을 계산합니다.
     * @param repeatType 반복 타입 ("DAILY", "WEEKLY", "MONTHLY")
     * @param baseDate 기준 날짜 (오늘)
     * @return 계산된 생성 상한선 날짜
     */
    private LocalDate calculateGenerationLimit(String repeatType, LocalDate baseDate) {
        switch (repeatType) {
            case "DAILY":
                return baseDate.plusWeeks(4); // 매일 반복은 향후 4주까지 생성
            case "WEEKLY":
                return baseDate.plusMonths(3); // 매주 반복은 향후 3개월까지 생성
            case "MONTHLY":
                return baseDate.plusYears(1); // 매월 반복은 향후 1년까지 생성
            default:
                // 알 수 없는 타입의 경우, 가장 짧은 범위인 4주를 기본값으로 사용
                log.warn("알 수 없는 반복 유형 '{}'에 대해 기본 생성 범위(4주)를 적용합니다.", repeatType);
                return baseDate.plusWeeks(4);
        }
    }

    /**
     * 원본 Todo 정보를 바탕으로 새로운 반복 Todo 객체를 생성합니다.
     * @param baseTodo 기준이 되는 TodoVO 객체
     * @param newDueDate 새로 생성될 Todo의 마감일
     * @param repeatRuleId 이 Todo가 속할 반복 규칙의 ID
     * @return 새로 생성된 TodoVO 객체
     */
    private TodoVO createNewTodoFromBase(TodoVO baseTodo, LocalDate newDueDate, Long repeatRuleId) {
        return TodoVO.builder()
                .userId(baseTodo.getUserId())
                .title(baseTodo.getTitle())
                .memo(baseTodo.getMemo())
                .priority(baseTodo.getPriority())
                .categoryId(baseTodo.getCategoryId())
                .dueDate(newDueDate) // 새로 계산된 마감일
                .repeatRuleId(repeatRuleId) // 동일한 반복 규칙 ID
                .isCompleted("N") // 항상 '미완료' 상태로 생성
                .build();
    }
}
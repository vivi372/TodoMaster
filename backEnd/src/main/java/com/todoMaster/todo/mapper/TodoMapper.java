package com.todoMaster.todo.mapper;

import com.todoMaster.todo.vo.TodoVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import java.util.Set;

@Mapper
public interface TodoMapper {
    void insertTodo(TodoVO todo);
    void insertTodos(List<TodoVO> todos);
    TodoVO findTodoById(long todoId);
    List<TodoVO> findTodosByUserId(long userId);
    void updateTodo(TodoVO todo);
    void deleteTodo(long todoId);
    List<TodoVO> findTodosWithPaging(Map<String, Object> params);
    int countTodos(Map<String, Object> params);
    List<TodoVO> findTodosByRepeatRuleId(Long repeatRuleId);
    void deleteTodosAfterDate(@Param("repeatRuleId") Long repeatRuleId, @Param("date") LocalDate date);
    List<TodoVO> findTodosByRepeatRuleIdAndDate(@Param("repeatRuleId") Long repeatRuleId, @Param("date") LocalDate date);
    List<TodoVO> findTodosByRepeatRuleIdOnOrAfterDate(@Param("repeatRuleId") Long repeatRuleId, @Param("date") LocalDate date);
    void updateTodoDueDateAndRepeatRule(@Param("todoId") Long todoId, @Param("dueDate") LocalDate dueDate, @Param("repeatRuleId") Long repeatRuleId);
    void setDueDateToNull(long todoId);

    void updateShiftedRepeatTodo(@Param("todoId") Long todoId,
                                 @Param("dueDate") LocalDate dueDate,
                                 @Param("repeatRuleId") Long repeatRuleId,
                                 @Param("title") String title,
                                 @Param("memo") String memo,
                                 @Param("priority") Integer priority);
    void deleteTodos(List<Long> todoIds);

    /**
     * 특정 반복 규칙에 속하는 모든 '미완료(Incomplete)' 상태의 Todo를 삭제합니다.
     * @param repeatRuleId 삭제할 Todo들이 속한 반복 규칙의 ID
     */
    void deleteIncompleteTodosByRepeatRuleId(Long repeatRuleId);

    /**
     * 특정 반복 규칙에 속하는 Todo 중 하나를 조회하여 배치 생성의 기준 데이터로 사용합니다.
     * @param repeatRuleId 기준 Todo를 찾을 반복 규칙의 ID
     * @return 조회된 TodoVO 객체
     */
    TodoVO findFirstByRepeatRuleId(Long repeatRuleId);

    /**
     * 특정 반복 규칙으로 생성된 모든 Todo의 완료 예정일(dueDate) 목록을 조회합니다.
     * 중복 생성을 방지하기 위해 사용됩니다.
     * @param repeatRuleId 중복을 확인할 반복 규칙의 ID
     * @return 날짜(LocalDate)의 Set
     */
    Set<LocalDate> findDueDatesByRepeatRuleId(Long repeatRuleId);
}

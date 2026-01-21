package com.todoMaster.todo.mapper;

import com.todoMaster.todo.vo.TodoVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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
}

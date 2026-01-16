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
}

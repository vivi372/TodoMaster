package com.todoMaster.todo.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import com.todoMaster.todo.vo.TodoVO;

/**
 * Todo 데이터베이스 작업을 위한 MyBatis Mapper 인터페이스.
 * 'TodoMapper.xml' 파일의 SQL 쿼리와 매핑됩니다.
 */
@Mapper
public interface TodoMapper {

    /**
     * 새로운 Todo 항목을 데이터베이스에 추가합니다.
     * @param vo 생성할 Todo의 정보가 담긴 TodoVO 객체
     * @return 성공적으로 추가된 행의 수 (일반적으로 1)
     */
    int insertTodo(TodoVO vo);

    /**
     * 고유 식별자(ID)를 사용하여 특정 Todo 항목을 조회합니다.
     * @param todoId 조회할 Todo의 ID
     * @return 조회된 Todo 정보를 담은 TodoVO 객체, 없을 경우 null
     */
    TodoVO findTodoById(Long todoId);

    /**
     * 특정 사용자가 생성한 모든 Todo 항목을 조회합니다.
     * @param userId 사용자의 ID
     * @return 해당 사용자의 모든 Todo 목록
     */
    List<TodoVO> findTodosByUserId(Long userId);

    /**
     * 기존 Todo 항목의 정보를 수정합니다.
     * @param vo 수정할 정보가 담긴 TodoVO 객체 (todoId 포함 필수)
     * @return 성공적으로 수정된 행의 수 (일반적으로 1)
     */
    int updateTodo(TodoVO vo);

    /**
     * 특정 Todo 항목을 데이터베이스에서 삭제합니다.
     * @param todoId 삭제할 Todo의 ID
     * @return 성공적으로 삭제된 행의 수 (일반적으로 1)
     */
    int deleteTodo(Long todoId);

    /**
     * 페이징 처리를 적용하여 특정 사용자의 Todo 목록을 조회합니다.
     * @param params 'userId', 'startRow', 'endRow'를 포함하는 Map 객체
     * @return 페이징 처리된 Todo 목록
     */
    List<TodoVO> findTodosWithPaging(Map<String, Object> params);
    
    /**
     * 특정 사용자의 전체 Todo 항목 수를 조회합니다. (페이징 계산용)
     * @param params 'userId'를 포함하는 Map 객체
     * @return 해당 사용자의 전체 Todo 수
     */
    int countTodos(Map<String, Object> params);
}

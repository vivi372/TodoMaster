import { api } from '@/shared/lib/api/axios';
import type { ApiResponse } from '@/shared/types/api';

// 요청 타입
export interface CreateTodoRequest {
  title: string;
  memo?: string;
  dueDate?: string; // YYYY-MM-DD
  /**
   * Todo 항목의 우선순위입니다. (0: 낮음, 1: 보통, 2: 높음)
   * 백엔드에서 기본값을 설정할 수 있으므로 선택 사항입니다.
   */
  priority?: number;
}

export interface UpdateTodoRequest {
  title?: string;
  memo?: string;
  /**
   * Todo의 완료 여부를 나타냅니다.
   * 백엔드 API 스키마 변경에 따라 'Y'(완료) 또는 'N'(미완료) 값을 사용합니다.
   */
  isCompleted?: 'Y' | 'N';
  dueDate?: string; // YYYY-MM-DD
  /**
   * Todo 항목의 우선순위입니다. (0: 낮음, 1: 보통, 2: 높음)
   * 부분 업데이트를 위해 선택 사항입니다.
   */
  priority?: number;
}

// 단일 Todo에 대한 응답 타입
export interface TodoResponse {
  todoId: number;
  userId: number;
  title: string;
  memo: string;
  /**
   * 우선순위 값 (0: 낮음, 1: 보통, 2: 높음).
   * 백엔드로부터 받은 숫자 값을 프론트엔드에서 문자열 키('low', 'medium', 'high')로 변환하여 사용해야 합니다.
   */
  priority: number;
  /**
   * Todo의 완료 여부를 나타냅니다.
   * 백엔드 DB에는 VARCHAR(1) 타입('Y'/'N')으로 저장되므로, 프론트엔드에서도 이에 맞게 타입을 string으로 유지합니다.
   * UI 로직에서는 이 값을 boolean으로 변환하여 사용해야 합니다. (예: isCompleted === 'Y')
   */
  isCompleted: 'Y' | 'N';
  dueDate: string; // YYYY-MM-DD
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export const todoApi = {
  /**
   * 새로운 Todo를 생성합니다.
   * POST /api/todos
   * @param payload - 새 Todo 생성을 위한 데이터 (제목, 메모, 마감일)
   * @returns {Promise<TodoResponse>} - 생성된 Todo 데이터
   */
  createTodo: async (payload: CreateTodoRequest): Promise<TodoResponse> => {
    const res = await api.post<ApiResponse<TodoResponse>>('/api/todos', payload);
    if (!res.data.success) {
      throw res.data;
    }
    return res.data.data;
  },

  /**
   * ID로 Todo를 조회합니다.
   * GET /api/todos/{todoId}
   * @param todoId - 조회할 Todo의 ID
   * @returns {Promise<TodoResponse>} - 요청된 Todo 데이터
   */
  getTodoById: async (todoId: number): Promise<TodoResponse> => {
    const res = await api.get<ApiResponse<TodoResponse>>(`/api/todos/${todoId}`);
    if (!res.data.success) {
      throw res.data;
    }
    return res.data.data;
  },

  /**
   * 인증된 사용자의 모든 Todo 목록을 조회합니다.
   * GET /api/todos
   * @returns {Promise<TodoResponse[]>} - Todo 데이터 목록
   */
  getTodoList: async (): Promise<TodoResponse[]> => {
    const res = await api.get<ApiResponse<TodoResponse[]>>('/api/todos');
    if (!res.data.success) {
      throw res.data;
    }
    return res.data.data;
  },

  /**
   * 기존 Todo를 업데이트합니다.
   * PATCH /api/todos/{todoId}
   * @param todoId - 업데이트할 Todo의 ID
   * @param payload - Todo 업데이트를 위한 데이터 (제목, 메모, 완료 여부, 마감일). 부분 업데이트를 위해 필드는 선택 사항입니다.
   * @returns {Promise<TodoResponse>} - 업데이트된 Todo 데이터
   */
  updateTodo: async (todoId: number, payload: UpdateTodoRequest): Promise<TodoResponse> => {
    const res = await api.patch<ApiResponse<TodoResponse>>(`/api/todos/${todoId}`, payload);
    if (!res.data.success) {
      throw res.data;
    }
    return res.data.data;
  },

  /**
   * ID로 Todo를 삭제합니다.
   * DELETE /api/todos/{todoId}
   * @param todoId - 삭제할 Todo의 ID
   * @returns {Promise<void>} - 성공적으로 삭제되면 내용 없음
   */
  deleteTodo: async (todoId: number): Promise<void> => {
    const res = await api.delete<ApiResponse<void>>(`/api/todos/${todoId}`);
    if (!res.data.success) {
      throw res.data;
    }
  },
};

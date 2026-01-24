import { api } from '@/shared/lib/api/axios';
import type { ApiResponse } from '@/shared/types/api';
import type { RepeatRuleCreateRequest } from './RepeatApi';

// ============================
// Interfaces and Types
// ============================

/**
 * @description Todo 항목의 기본 구조를 정의하는 인터페이스.
 * 백엔드의 `TodoResponseDto`와 완벽하게 일치합니다.
 */
export interface Todo {
  todoId: number;
  userId: number;
  title: string;
  memo: string | null;
  /**
   * @description Todo 항목의 우선순위 (0: 낮음, 1: 보통, 2: 높음).
   */
  priority: number;
  /**
   * @description Todo의 완료 여부. 'Y'는 완료, 'N'은 미완료를 의미합니다.
   */
  isCompleted: 'Y' | 'N';
  /**
   * @description Todo 항목의 마감 기한. 'YYYY-MM-DD' 형식의 문자열입니다.
   */
  dueDate: string | null;
  /**
   * @description Todo 항목의 생성 일시. ISO 8601 형식의 문자열입니다. (예: '2023-01-01T12:00:00')
   */
  createdAt: string;
  /**
   * @description Todo 항목의 마지막 수정 일시. ISO 8601 형식의 문자열입니다.
   */
  updatedAt: string;
  /**
   * @description Todo 항목의 완료 일시. ISO 8601 형식의 문자열이거나 null 입니다.
   */
  completedAt: string | null;
  /**
   * @description 이 Todo가 반복 일정의 일부인 경우, 반복 규칙 정보.
   */
  repeatVO?: RepeatVO;
}

/**
 * @description 백엔드에서 내려오는 반복 규칙 정보.
 * `RepeatService`의 응답과 일치합니다.
 */
export interface RepeatVO {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY'; // 반복 타입
  intervalValue: number; // 반복 간격 (예: 2일마다, 3주마다)
  /**
   * @description WEEKLY 타입일 경우, 반복 요일.
   * 백엔드에서는 콤마로 구분된 문자열(예: "MON,TUE,WED")로 관리됩니다.
   */
  weekDays?: string;
  endDate?: string; // YYYY-MM-DD 형식의 반복 종료일
}

/**
 * @description Todo 생성을 위한 요청 데이터 타입.
 * 백엔드의 `TodoCreateRequestDto`와 일치합니다.
 */
export interface CreateTodoRequest {
  title: string;
  memo?: string;
  dueDate?: string; // 'YYYY-MM-DD'
  priority?: number; // 0, 1, 2
  /**
   * @description 신규 Todo와 함께 생성될 반복 규칙 정보.
   * 이 필드가 존재하면 반복 Todo로 생성됩니다.
   */
  repeatRule?: RepeatRuleCreateRequest;
}

/**
 * @description Todo 수정을 위한 요청 데이터 타입.
 * 백엔드의 `TodoUpdateRequestDto`와 일치합니다.
 * 모든 필드는 선택 사항이며, 요청에 포함된 필드만 업데이트됩니다.
 */
export interface UpdateTodoRequest {
  title?: string;
  memo?: string;
  isCompleted?: 'Y' | 'N';
  dueDate?: string; // 'YYYY-MM-DD'
  priority?: number; // 0, 1, 2
  /**
   * @description 수정 또는 새로 추가할 반복 규칙 정보.
   */
  repeatRule?: RepeatRuleCreateRequest;
  /**
   * @description 반복 규칙 변경 시 적용 범위.
   * - "ALL": 반복 시리즈의 모든 미완료 일정 변경
   * - "AFTER_THIS": 현재 일정과 그 이후의 모든 미완료 일정 변경
   */
  changeType?: 'ALL' | 'AFTER_THIS';
}

/**
 * @description Todo 삭제 시 범위를 지정하는 타입
 * - "ONE_TODO": 현재 Todo 인스턴스만 삭제 (반복 시리즈에 영향 없음)
 * - "FUTURE": 해당 Todo를 포함한 이후의 모든 반복 일정을 삭제
 * - "ALL_INCOMPLETE_REPEATED": 해당 Todo가 속한 시리즈의 모든 '미완료' 상태의 반복 일정을 삭제
 */
export type DeleteTodoScope = 'ONE_TODO' | 'FUTURE' | 'ALL_INCOMPLETE_REPEATED';

// ============================
// API Functions
// ============================

const TODO_API_URL = '/api/todos';

/**
 * @description Todo 관련 API 요청을 처리하는 객체.
 * 백엔드 `TodoController`의 명세와 1:1로 매칭됩니다.
 */
export const todoApi = {
  /**
   * @summary **새로운 Todo 생성 API**
   * @description 새로운 Todo 항목을 서버에 생성합니다. 반복 규칙을 포함할 수 있습니다.
   * @param {CreateTodoRequest} payload - 생성할 Todo의 정보
   * @returns {Promise<Todo>} 생성된 Todo 객체
   * @throws {ApiResponse} API 요청 실패 시 에러 응답 객체
   */
  createTodo: async (payload: CreateTodoRequest): Promise<Todo> => {
    const response = await api.post<ApiResponse<Todo>>(TODO_API_URL, payload);

    if (!response.data.success) {
      throw response.data;
    }

    return response.data.data;
  },

  /**
   * @summary **특정 ID의 Todo 조회 API**
   * @description 주어진 ID에 해당하는 Todo 항목의 상세 정보를 조회합니다.
   * @param {number} todoId - 조회할 Todo의 고유 ID
   * @returns {Promise<Todo>} 조회된 Todo 객체
   * @throws {ApiResponse} API 요청 실패 시 에러 응답 객체
   */
  getTodoById: async (todoId: number): Promise<Todo> => {
    const response = await api.get<ApiResponse<Todo>>(`${TODO_API_URL}/${todoId}`);

    if (!response.data.success) {
      throw response.data;
    }

    return response.data.data;
  },

  /**
   * @summary **사용자의 모든 Todo 목록 조회 API**
   * @description 현재 인증된 사용자의 모든 Todo 목록을 조회합니다.
   * @returns {Promise<Todo[]>} Todo 객체 배열
   * @throws {ApiResponse} API 요청 실패 시 에러 응답 객체
   */
  getTodoList: async (): Promise<Todo[]> => {
    const response = await api.get<ApiResponse<Todo[]>>(TODO_API_URL);

    if (!response.data.success) {
      throw response.data;
    }

    return response.data.data;
  },

  /**
   * @summary **Todo 정보 수정 API**
   * @description 주어진 ID에 해당하는 Todo 항목의 정보를 수정합니다. 반복 규칙도 함께 수정할 수 있습니다.
   * @param {number} todoId - 수정할 Todo의 고유 ID
   * @param {UpdateTodoRequest} payload - 수정할 정보
   * @returns {Promise<Todo>} 수정된 Todo 객체
   * @throws {ApiResponse} API 요청 실패 시 에러 응답 객체
   */
  updateTodo: async (todoId: number, payload: UpdateTodoRequest): Promise<Todo> => {
    const response = await api.patch<ApiResponse<Todo>>(`${TODO_API_URL}/${todoId}`, payload);

    if (!response.data.success) {
      throw response.data;
    }

    return response.data.data;
  },

  /**
   * @summary **Todo 삭제 API**
   * @description 주어진 ID에 해당하는 Todo 항목을 삭제합니다. 반복의 경우 삭제 범위를 지정할 수 있습니다.
   * @param {number} todoId - 삭제할 Todo의 고유 ID
   * @param {DeleteTodoScope} [deleteScope] - 반복 일정 삭제 범위. "FUTURE"는 이후 일정, "ALL_INCOMPLETE_REPEATED"는 미완료된 전체 반복 일정을 삭제합니다.
   * @returns {Promise<void>} 성공 시 아무것도 반환하지 않음
   * @throws {ApiResponse} API 요청 실패 시 에러 응답 객체
   */
  deleteTodo: async (todoId: number, deleteScope?: DeleteTodoScope): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`${TODO_API_URL}/${todoId}`, {
      params: { deleteScope },
    });

    if (response.status === 200 || (response.data && response.data.success)) {
      return;
    }

    if (!response.data.success) {
      throw response.data;
    }
  },
};

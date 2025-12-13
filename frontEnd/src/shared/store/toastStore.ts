import { create } from 'zustand';

/**
 * 토스트 메시지의 유형(스타일)을 정의하는 타입입니다.
 */
export type ToastType = 'success' | 'error' | 'info';

/**
 * 개별 토스트 메시지의 구조를 정의하는 인터페이스입니다.
 */
interface Toast {
  id: number; // 토스트를 고유하게 식별하는 ID (삭제를 위해 필요)
  message: string; // 사용자에게 표시될 메시지 내용
  type: ToastType; // 토스트의 유형 (성공, 오류, 정보 등)
}

/**
 * ToastStore의 상태와 액션(함수)의 구조를 정의하는 인터페이스입니다.
 */
interface ToastStore {
  toasts: Toast[]; // 현재 활성화된 모든 토스트 객체의 배열

  /**
   * 새로운 토스트 메시지를 목록에 추가하는 함수입니다.
   * @param message 표시할 메시지
   * @param type 메시지의 유형 (기본값: 'info')
   */
  show: (message: string, type?: ToastType) => void;

  /**
   * 특정 ID를 가진 토스트 메시지를 목록에서 제거하는 함수입니다.
   * @param id 제거할 토스트의 고유 ID
   */
  remove: (id: number) => void;
}

// 토스트 메시지에 고유 ID를 할당하기 위한 전역 카운터 변수
let id = 0;

/**
 * useToastStore: 애플리케이션 전역의 토스트 알림을 관리하는 Zustand Store입니다.
 */
export const useToastStore = create<ToastStore>((set) => ({
  // --- 초기 상태(Initial State) ---
  toasts: [], // 처음에는 활성화된 토스트가 없습니다.

  // --- 액션(Actions) ---

  /**
   * 토스트 메시지를 목록에 추가하고, ID 카운터를 증가시킵니다.
   */
  show: (message, type = 'info') =>
    set((state) => ({
      toasts: [
        ...state.toasts, // 기존 토스트 목록을 유지
        { id: ++id, message, type }, // 새 토스트를 목록 끝에 추가 (ID 증가 후 사용)
      ],
    })),

  /**
   * 지정된 ID의 토스트를 목록에서 필터링하여 제거합니다.
   */
  remove: (idToRemove) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== idToRemove),
    })),
}));

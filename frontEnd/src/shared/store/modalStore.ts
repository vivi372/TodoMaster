import { create } from 'zustand';
import type { ComponentType } from 'react';
import type { actionCode } from '../hooks/useMessageActions';

// ConfirmModalProps에서 버튼/핸들러 관련 속성들을 제외한 순수 데이터 타입
export type BaseModalData = {
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  action?: actionCode;
};

// Alert 모달 데이터는 Confirm 모달 데이터와 동일하지만, 버튼이 하나여야 함
type AlertModalData = BaseModalData;

// Promise의 결과를 호출자에게 전달할 resolve 함수 타입
type ModalResolveFunction = ((confirmed: boolean) => void) | null;
type AlertResolveFunction = (() => void) | null;

// 모달 타입 (alert 또는 confirm)
type ModalType = 'alert' | 'confirm';

interface ModalStore {
  // 현재 모달에 표시될 데이터
  modalData: (AlertModalData & { type: ModalType }) | null;

  // 모달의 결과를 호출자에게 전달하기 위한 Promise의 resolve 함수
  resolve: ModalResolveFunction | AlertResolveFunction;

  /**
   * Alert 모달을 띄우고 Promise를 반환합니다 (사용자의 닫힘만 대기).
   * @returns 모달이 닫혔음을 알리는 Promise<void>
   */
  showAlert: (props: AlertModalData) => Promise<void>;

  /**
   * Confirm 모달을 띄우고 Promise를 반환합니다 (확인/취소 결과 대기).
   * @returns 사용자가 확인/취소한 결과를 담은 Promise<boolean>
   */
  showConfirm: (props: BaseModalData) => Promise<boolean>;

  /** 공통 닫기/취소 처리 */
  handleClose: (confirmed: boolean) => void;

  // ================================================================
  // D. Custom Modal Component Support
  // ================================================================

  /**
   * 사용자 정의 컴포넌트를 모달로 띄우기 위한 상태
   * - `modalComponent`: 렌더링할 React 컴포넌트
   * - `props`: 해당 컴포넌트에 전달될 속성
   */
  modalComponent: ComponentType<any> | null;
  props: Record<string, any>;

  /**
   * 사용자 정의 컴포넌트를 모달로 띄웁니다.
   * @param component - 모달로 렌더링할 React 컴포넌트
   * @param props - 컴포넌트에 전달할 props
   */
  showModal: <T extends Record<string, any>>(component: ComponentType<T>, props: T) => void;

  /**
   * 현재 열려 있는 사용자 정의 모달을 닫습니다.
   */
  closeModal: () => void;
}

export const useModalStore = create<ModalStore>((set, get) => ({
  modalData: null,
  resolve: null,
  modalComponent: null,
  props: {},

  // ================================================================
  // A. Core Handler (for Alert/Confirm)
  // ================================================================

  handleClose: (confirmed) => {
    const { resolve } = get();
    // Alert 모달은 결과가 필요 없으므로 resolve() (void) 처리
    // Confirm 모달은 결과가 필요하므로 resolve(true/false) 처리
    resolve?.(confirmed);
    set({ modalData: null, resolve: null }); // 모달 닫기
  },

  // ================================================================
  // B. Public API (Alert)
  // ================================================================

  showAlert: (props) => {
    return new Promise<void>((resolve) => {
      set({
        modalData: { ...props, type: 'alert' },
        resolve: resolve as AlertResolveFunction,
      });
    });
  },

  // ================================================================
  // C. Public API (Confirm)
  // ================================================================

  showConfirm: (props) => {
    return new Promise<boolean>((resolve) => {
      set({
        modalData: { ...props, type: 'confirm' },
        resolve: resolve as ModalResolveFunction,
      });
    });
  },

  // ================================================================
  // D. Public API (Custom Modal)
  // ================================================================

  /**
   * 사용자 정의 컴포넌트를 모달 상태로 설정합니다.
   *
   * @template T - 컴포넌트의 props 타입
   * @param {ComponentType<T>} component - 모달로 표시할 컴포넌트
   * @param {T} props - 컴포넌트에 전달할 props
   */
  showModal: (component, props) => {
    set({ modalComponent: component, props: props });
  },

  /**
   * 현재 표시된 사용자 정의 모달을 상태에서 제거하여 닫습니다.
   */
  closeModal: () => {
    set({ modalComponent: null, props: {} });
  },
}));

/**
 * 전역 모달 상태를 사용하기 위한 커스텀 훅.
 * `alert`, `confirm`, `showModal`, `closeModal` 함수를 제공하여
 * 다양한 종류의 모달을 쉽게 제어할 수 있습니다.
 */
export const useModal = () => {
  const store = useModalStore.getState();
  return {
    alert: store.showAlert,
    confirm: store.showConfirm,
    showModal: store.showModal,
    closeModal: store.closeModal,
  };
};

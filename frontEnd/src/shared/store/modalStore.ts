import { create } from 'zustand';
import type { ConfirmModalProps } from '../ui/modal';
import type { ErrorActionCode } from '../hooks/useErrorActions';

// ConfirmModalProps에서 버튼/핸들러 관련 속성들을 제외한 순수 데이터 타입
type BaseModalData = Omit<ConfirmModalProps, 'open' | 'onOpenChange' | 'onConfirm' | 'onCancel'> & {
  action?: ErrorActionCode;
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
}

export const useModalStore = create<ModalStore>((set, get) => ({
  modalData: null,
  resolve: null,

  // ================================================================
  // A. Core Handler
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
        resolve: resolve as AlertResolveFunction, // Promise<void>를 resolve에 저장
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
        resolve: resolve as ModalResolveFunction, // Promise<boolean>을 resolve에 저장
      });
    });
  },
}));

// Custom Hook도 이제 showConfirm과 showAlert 두 함수를 모두 반환하도록 변경할 수 있습니다.
export const useModal = () => {
  const store = useModalStore.getState();
  return {
    alert: store.showAlert,
    confirm: store.showConfirm,
  };
};

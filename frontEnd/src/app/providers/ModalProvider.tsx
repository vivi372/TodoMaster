'use client';

import { useMessageActions } from '../../shared/hooks/useMessageActions';
import { useModalStore } from '../../shared/store/modalStore';
import { AlertModal, ConfirmModal } from '../../shared/ui/modal';
import { useShallow } from 'zustand/react/shallow';

/**
 * Zustand Store의 상태에 따라 모달을 렌더링하는 전역 컴포넌트.
 * 이 컴포넌트는 앱의 최상단(예: App.tsx)에 한 번만 배치되어야 합니다.
 *
 * 두 종류의 모달을 처리합니다:
 * 1. `alert`/`confirm`: Promise 기반의 간단한 알림/확인 모달.
 * 2. **Custom Component Modals**: `useModal().showModal(Component, props)`를 통해
 *    호출되는 모든 사용자 정의 React 컴포넌트 모달.
 */
export function ModalProvider() {
  // =================================================================
  // 1. Zustand 스토어에서 모달 상태 감지
  // =================================================================
  const {
    modalData,
    handleClose,
    modalComponent: Component, // 렌더링할 사용자 정의 컴포넌트
    props, // 사용자 정의 컴포넌트에 전달될 props
    closeModal, // 사용자 정의 컴포넌트를 닫는 함수
  } = useModalStore(
    useShallow((state) => ({
      modalData: state.modalData,
      handleClose: state.handleClose,
      modalComponent: state.modalComponent,
      props: state.props,
      closeModal: state.closeModal,
    })),
  );
  const { executeAction } = useMessageActions();

  // =================================================================
  // 2. 사용자 정의 컴포넌트 모달 렌더링
  // =================================================================
  // `modalComponent`가 스토어에 설정되어 있다면, 해당 컴포넌트를 렌더링합니다.
  if (Component) {
    // `showModal` 호출 시 전달된 모든 `props`와 함께,
    // 모달 스스로 닫을 수 있도록 `closeModal` 함수를 추가로 전달합니다.
    return <Component {...props} closeModal={closeModal} />;
  }

  // =================================================================
  // 3. `alert`/`confirm` 모달 렌더링 (기존 로직)
  // =================================================================
  const open = !!modalData;
  if (!modalData) {
    return null;
  }

  const handleModalClose = (confirmed: boolean) => handleClose(confirmed);
  const { type, ...restData } = modalData;

  let ModalToRender: React.ElementType | null = null;
  let handlerProps = {};

  const handleConfirmAction = () => {
    handleModalClose(true);
    if (modalData?.action) {
      executeAction(modalData.action);
    }
  };

  if (type === 'alert') {
    ModalToRender = AlertModal;
    handlerProps = { onOk: handleConfirmAction };
  } else if (type === 'confirm') {
    ModalToRender = ConfirmModal;
    handlerProps = {
      onConfirm: handleConfirmAction,
      onCancel: () => handleModalClose(false),
    };
  } else {
    return null;
  }

  return (
    <ModalToRender
      open={open}
      onOpenChange={(isOpen: boolean) => !isOpen && handleModalClose(false)}
      {...restData}
      {...handlerProps}
    />
  );
}

import { useMessageActions } from '../../shared/hooks/useMessageActions';
import { useModalStore } from '../../shared/store/modalStore';
import { AlertModal, ConfirmModal } from '../../shared/ui/modal'; // Modal.tsx에서 정의된 ConfirmModal
import { useShallow } from 'zustand/react/shallow';

/**
 * Zustand Store의 상태에 따라 모달을 렌더링하는 컴포넌트 (App.tsx에 배치)
 */
export function ModalProvider() {
  const { modalData, handleClose } = useModalStore(
    useShallow((state) => ({
      modalData: state.modalData,
      handleClose: state.handleClose,
    })),
  );
  const { executeAction } = useMessageActions(); // useErrorActions 훅 사용

  const open = !!modalData;
  if (!modalData) {
    return null;
  }

  // 모달이 닫힐 때 공통 핸들러를 호출합니다.
  const handleModalClose = (confirmed: boolean) => handleClose(confirmed);

  // modalData에서 type을 분리하고 나머지 데이터는 rest로 전달
  const { type, ...restData } = modalData;

  // 렌더링할 모달 컴포넌트 결정
  let ModalToRender: React.ElementType | null = null;
  let handlerProps = {};

  // 🟢 Confirm 모달의 최종 '확인' 처리
  const handleConfirmAction = () => {
    // 1. Store의 handleClose 실행 (Promise resolve, 모달 닫기)
    handleModalClose(true);

    // 2. Action이 있을때만 실행
    if (modalData?.action) {
      executeAction(modalData.action); // 🟢 액션 실행
    }
  };

  if (type === 'alert') {
    ModalToRender = AlertModal;
    // Alert은 onOk만 필요하며, onOk는 handleClose(true)로 연결
    handlerProps = {
      onOk: handleConfirmAction,
    };
  } else if (type === 'confirm') {
    ModalToRender = ConfirmModal;
    // Confirm은 onConfirm/onCancel이 필요하며, 각각 handleClose(true/false)로 연결
    handlerProps = {
      onConfirm: handleConfirmAction,
      onCancel: () => handleModalClose(false),
    };
  } else {
    return null; // 알 수 없는 타입
  }

  return (
    <ModalToRender
      open={open}
      // Backdrop이나 ESC로 닫힐 때 항상 취소/닫기 처리
      onOpenChange={(isOpen: boolean) => !isOpen && handleModalClose(false)}
      // modalData의 title, description, variant 등 전달
      {...restData}
      // onOk, onConfirm, onCancel 등 핸들러 전달
      {...handlerProps}
    />
  );
}

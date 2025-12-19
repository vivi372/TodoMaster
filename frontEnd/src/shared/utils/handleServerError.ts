import { errorMessagePolicy, type messagePolicy } from '../error/errorMessagePolicy';
import type { AppError, ServerErrorCode } from '../error/types';
import { useModalStore } from '../store/modalStore';
import { appToast } from './appToast';

/**
 * 서버 에러를 코드 기반으로 분석하고, 정책에 따라 토스트, 모달 등을 출력하는 중앙 처리 함수
 * * @param appError 파싱된 에러 정보 (code, title, description 포함)
 * @returns 액션이 실행되어 페이지 이동 등이 발생했으면 true, 아니면 false
 */
export async function handleServerError(appError: AppError): Promise<boolean> {
  // 1. ErrorCode가 없는 경우 (네트워크 오류, 예상치 못한 에러) → 공통 토스트 처리
  if (!appError.code) {
    // 백엔드에서 받은 title과 description 대신, 공통 메시지를 사용할 수도 있습니다.
    appToast.error({ message: appError.title || '알 수 없는 오류가 발생했습니다.' });
    return false;
  }

  const policy: messagePolicy = errorMessagePolicy[appError.code as ServerErrorCode];

  // 2. 정책이 없거나 silent면 아무 것도 하지 않음
  if (!policy || policy.silent) {
    return false;
  }

  // 3. 토스트 출력 정책
  if (policy.displayType === 'toast') {
    // policy.type (error/warning/info)을 사용하여 해당 토스트 출력
    // 백엔드에서 받은 message(title)를 사용
    appToast[policy.type]({ message: appError.title });
    return false;
  }

  // 4. 모달 출력 정책 (ModalType: 'alert' 또는 'confirm')
  if (policy.displayType === 'modal') {
    const modalStore = useModalStore.getState();
    const modalProps = {
      title: appError.title,
      description: appError.description,
      variant: policy.type,
    };

    let actionExecuted = false;

    // 🟢 Confirm 모달 (사용자의 선택 필요)
    if (policy.ModalType === 'confirm') {
      const isConfirmed = await modalStore.showConfirm({
        ...modalProps,
        action: policy.action, // Action Code 전달
        // 필요한 버튼 텍스트는 백엔드에서 받지 않았다면 여기서 기본값 설정 가능
        // confirmText: '이동', cancelText: '취소',
      });

      if (isConfirmed && policy.action) {
        // Action 실행은 ModalHost에서 이미 처리되지만,
        // 즉시 실행을 원한다면 여기서 useErrorActions의 getState()를 통해 실행 가능
        actionExecuted = true;
      }
    }

    // 🟢 Alert 모달 (단순 고지)
    else if (policy.ModalType === 'alert') {
      await modalStore.showAlert({
        ...modalProps,
        // Alert 모달은 확인 버튼만 있으므로 action을 전달하지 않아도 됨
      });
      // Alert은 액션을 실행하지 않으므로 actionExecuted = false
    }

    // 모달 처리 후 액션이 실행되었다면 true 반환
    return actionExecuted;
  }

  return false;
}

import * as React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button'; // Button 컴포넌트는 사용자의 환경에 맞게 조정하세요.

// ====================================================================
// 1. 타입 정의
// ====================================================================

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

interface ModalContentProps {
  className?: string;
  children: React.ReactNode;
  showClose?: boolean; // 닫기 버튼 표시 여부
}

interface ModalHeaderProps {
  className?: string;
  children: React.ReactNode;
  // 모달의 시각적 테마 (아이콘/배경색 변경)
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

interface ModalFooterProps {
  className?: string;
  children: React.ReactNode;
}

interface ModalTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface ModalDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

// ====================================================================
// 2. Context 정의
// ====================================================================

// 모달 내부 컴포넌트에서 open/onOpenChange 함수에 접근하기 위한 Context
const ModalContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

// ====================================================================
// 3. 메인 모달 컴포넌트 (Modal Root)
// ====================================================================

export function Modal({ open, onOpenChange, children, className }: ModalProps) {
  // 모달이 열릴 때 Body 스크롤을 막는 로직 (UX 개선)
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // 컴포넌트 언마운트 시 항상 복구
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // 모달이 닫혀있으면 아무것도 렌더링하지 않음
  if (!open) return null;

  return (
    <ModalContext.Provider value={{ open, onOpenChange }}>
      {/* 고정된 화면 오버레이 (z-index 50) */}
      <div className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}>
        {/* Backdrop (배경) */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
          // 배경 클릭 시 모달 닫기
          //onClick={() => onOpenChange(false)}
        />
        {children}
      </div>
    </ModalContext.Provider>
  );
}

// ====================================================================
// 4. 모달 콘텐츠 영역
// ====================================================================

export function ModalContent({ className, children, showClose = true }: ModalContentProps) {
  // Context에서 닫기 함수를 가져옴
  const { onOpenChange } = React.useContext(ModalContext);

  return (
    <div
      className={cn(
        'relative z-50 w-full max-w-md mx-4',
        'bg-white rounded-xl shadow-xl',
        'border border-gray-200',
        // 애니메이션 효과
        'animate-in zoom-in-95 fade-in-0 slide-in-from-bottom-4',
        'duration-300',
        className,
      )}
      // 모달 콘텐츠 내부 클릭 시 Backdrop 닫힘 방지
      onClick={(e) => e.stopPropagation()}
    >
      {showClose && (
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 rounded-sm p-0.5
                   text-gray-400 hover:text-gray-600
                   transition-colors duration-200"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">닫기</span>
        </button>
      )}
      {children}
    </div>
  );
}

// ====================================================================
// 5. 모달 헤더 (제목, 아이콘)
// ====================================================================

export function ModalHeader({ className, children, variant = 'default' }: ModalHeaderProps) {
  const variantIcons = {
    // 테마별 아이콘 정의
    default: null,
    success: (
      <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="h-8 w-8 text-green-500" strokeWidth={2.5} />
      </div>
    ),
    error: (
      <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" strokeWidth={2.5} />
      </div>
    ),
    warning: (
      <div className="w-16 h-16 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="h-8 w-8 text-orange-500" strokeWidth={2.5} />
      </div>
    ),
    info: (
      <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center mx-auto mb-4">
        <Info className="h-8 w-8 text-blue-500" strokeWidth={2.5} />
      </div>
    ),
  };

  return (
    <div className={cn('px-6 pt-8 pb-2 text-center', className)}>
      {variant !== 'default' && variantIcons[variant]}
      {children}
    </div>
  );
}

// ====================================================================
// 6. 기타 서브 컴포넌트 (Body, Footer, Title, Description)
// ====================================================================

export function ModalBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('px-6 pb-6 text-center', className)}>{children}</div>;
}

export function ModalFooter({ className, children }: ModalFooterProps) {
  return <div className={cn('px-6 pb-6 pt-2', 'flex flex-col gap-2', className)}>{children}</div>;
}

export function ModalTitle({ className, children }: ModalTitleProps) {
  return <h2 className={cn('text-lg font-semibold text-gray-900', className)}>{children}</h2>;
}

export function ModalDescription({ className, children }: ModalDescriptionProps) {
  return <p className={cn('text-sm text-gray-500 mt-2', className)}>{children}</p>;
}

// ====================================================================
// 7. Preset: Confirm / Alert Modal (선언적 사용 가능)
// ====================================================================

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

/**
 * 확인/취소 버튼이 포함된 미리 정의된 모달
 */
export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false); // 확인 후 모달 닫기
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false); // 취소 후 모달 닫기
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-sm">
        <ModalHeader variant={variant}>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <ModalDescription>{description}</ModalDescription>
        </ModalBody>
        <ModalFooter>
          {/* 확인 버튼 */}
          <Button className="w-full" onClick={handleConfirm}>
            {confirmText}
          </Button>
          {/* 취소 버튼 */}
          <Button
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50 bg-transparent"
            onClick={handleCancel}
          >
            {cancelText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ConfirmModalProps와 동일하지만, 핸들러는 onOk 하나만 받도록 재정의
interface AlertModalProps extends Omit<
  ConfirmModalProps,
  'open' | 'onOpenChange' | 'onConfirm' | 'onCancel'
> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOk: () => void;
  okText?: string;
}

/**
 * 단순 정보 고지 및 확인 버튼 하나만 있는 모달
 */
export function AlertModal({
  open,
  onOpenChange,
  title,
  description,
  okText = '확인',
  variant = 'info',
  onOk, // 확인 버튼 액션
}: AlertModalProps) {
  const handleOk = () => {
    onOk(); // 확인 액션 수행
    onOpenChange(false); // 모달 닫기
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md" showClose={true}>
        <ModalHeader variant={variant}>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <ModalDescription>{description}</ModalDescription>
        </ModalBody>
        <ModalFooter>
          {/* 버튼이 하나만 존재 */}
          <Button className="w-full" onClick={handleOk}>
            {okText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

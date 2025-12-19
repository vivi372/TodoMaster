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
          onClick={() => onOpenChange(false)}
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
        'relative z-50 w-full max-w-lg mx-4',
        'bg-white rounded-2xl shadow-2xl',
        'border-4 border-primary/20',
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
          className="absolute right-4 top-4 rounded-full p-1.5 
                      text-gray-400 hover:text-gray-600 hover:bg-gray-100
                      transition-all duration-200 hover:rotate-90"
        >
          <X className="h-5 w-5" />
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
  const variantStyles = {
    // 테마별 배경색 및 테두리 색상 정의
    default: 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20',
    success: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
    error: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200',
    warning: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200',
    info: 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200',
  };

  const icons = {
    // 테마별 아이콘 정의
    default: null,
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    error: <AlertCircle className="h-6 w-6 text-red-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-orange-500" />,
    info: <Info className="h-6 w-6 text-blue-500" />,
  };

  return (
    <div className={cn('px-6 py-5 border-b-2', variantStyles[variant], 'rounded-t-2xl', className)}>
      {/* default가 아닐 경우에만 아이콘 표시 */}
      {variant !== 'default' && (
        <div className="flex items-center gap-3 mb-3">{icons[variant]}</div>
      )}
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
  return <div className={cn('px-6 py-5', className)}>{children}</div>;
}

export function ModalFooter({ className, children }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 bg-gray-50/50 rounded-b-2xl',
        'flex flex-col-reverse sm:flex-row sm:justify-end gap-2',
        'border-t border-gray-100',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ModalTitle({ className, children }: ModalTitleProps) {
  return (
    <h2 className={cn('text-2xl font-bold text-gray-900', 'tracking-tight', className)}>
      {children}
    </h2>
  );
}

export function ModalDescription({ className, children }: ModalDescriptionProps) {
  return <p className={cn('text-sm text-gray-600 leading-relaxed', className)}>{children}</p>;
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
      <ModalContent className="max-w-md">
        <ModalHeader variant={variant}>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <ModalDescription>{description}</ModalDescription>
        </ModalBody>
        <ModalFooter>
          {/* 취소 버튼 */}
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          {/* 확인 버튼 */}
          <Button onClick={handleConfirm}>{confirmText}</Button>
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
          <Button onClick={handleOk}>{okText}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

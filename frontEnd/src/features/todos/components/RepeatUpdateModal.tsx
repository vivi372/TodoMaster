// 1. 필요한 훅과 컴포넌트들을 import합니다.
import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
// 2. 퍼블리싱 가이드에 맞춰 아이콘(AlertCircle, X)을 import합니다.
import { AlertCircle, X } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { useModal } from '@/shared/store/modalStore';

/**
 * @description 반복 일정 수정 시 어떤 범위로 수정할지 사용자에게 선택받는 모달.
 *              Promise 기반으로 동작하며, `onResolve` 콜백을 통해 선택된 값을 부모로 전달합니다.
 *              UI는 RepeatUpdateModalPB.tsx 가이드를 100% 따릅니다.
 */
interface RepeatUpdateModalProps {
  onResolve: (value: 'ALL' | 'AFTER_THIS' | 'ONLY_THIS' | null) => void;
  isDueDateCleared?: boolean;
  isDueDateChanged?: boolean;
  isRuleChanged?: boolean;
}

// 3. PB 가이드의 값 ('single', 'future', 'all')을 내부 상태로 사용합니다.
type ChangeType = 'single' | 'future' | 'all';

export function RepeatUpdateModal({
  onResolve,
  isDueDateCleared,
  isDueDateChanged,
  isRuleChanged,
}: RepeatUpdateModalProps) {
  const { closeModal } = useModal();
  // 4. 내부 상태의 기본값을 'future'로 설정합니다. (PB 가이드의 '이후 일정 모두 수정'에 해당)
  const [selectedChangeType, setSelectedChangeType] = useState<ChangeType>('future');

  // 5. 기존 로직을 유지하여, 특정 조건에 따라 기본 선택값을 동적으로 변경합니다.
  useEffect(() => {
    // 마감일만 변경되고 규칙은 변경되지 않은 경우, '이 할 일만 수정'을 기본값으로 설정
    if (isDueDateChanged && !isRuleChanged) {
      setSelectedChangeType('single');
    } else {
      // 그 외 규칙이 변경되는 경우 등은 '이후 모든 할 일 수정'을 기본값으로 설정
      setSelectedChangeType('future');
    }
  }, [isDueDateChanged, isRuleChanged]);

  // 6. 확인 버튼 클릭 시, 내부 상태 값을 API가 요구하는 값으로 매핑하여 반환합니다.
  const handleConfirm = useCallback(() => {
    const resolveValue = {
      single: 'ONLY_THIS',
      future: 'AFTER_THIS',
      all: 'ALL',
    }[selectedChangeType];
    onResolve(resolveValue as 'ALL' | 'AFTER_THIS' | 'ONLY_THIS');
    closeModal();
  }, [selectedChangeType, onResolve, closeModal]);

  // 7. 취소 로직은 기존과 동일하게 유지합니다.
  const handleCancel = useCallback(() => {
    onResolve(null);
    closeModal();
  }, [onResolve, closeModal]);

  // 8. PB 가이드의 마크업 구조와 스타일을 그대로 적용합니다.
  return (
    // z-index를 높여(z-[60]) 다른 모달(TodoFormModal, z-50) 위에 표시되도록 레이어 우선순위를 조정합니다.
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 9. 닫기 버튼 스타일 및 핸들러를 PB 가이드에 맞춰 적용합니다. */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* 10. 헤더 아이콘 및 스타일을 PB 가이드에 맞춰 적용합니다. */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* 11. 타이틀과 설명을 PB 가이드에 맞춰 적용합니다. */}
        <h2 className="text-xl font-bold text-center text-foreground mb-2">반복 일정 수정</h2>
        <p className="text-sm text-center text-muted-foreground mb-6">
          선택한 할 일의 수정 범위를
          <br />
          아래 옵션에서 선택해주세요.
        </p>

        {/* 12. 라디오 그룹 UI/UX를 PB 가이드에 맞춰 전면 개편합니다. */}
        <RadioGroup
          value={selectedChangeType}
          onValueChange={(v) => setSelectedChangeType(v as ChangeType)}
          className="space-y-3 mb-6"
        >
          {/* 옵션: '이 일정만 수정' */}
          <div
            className={cn(
              'flex flex-col p-4 rounded-lg border-2 transition-colors cursor-pointer',
              selectedChangeType === 'single'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300',
            )}
            onClick={() => setSelectedChangeType('single')}
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="single" id="update-single" className="mt-0.5" />
              <div className="flex-1">
                <Label
                  htmlFor="update-single"
                  className="font-medium text-foreground cursor-pointer"
                >
                  이 일정만 수정
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  선택한 일정만 개별적으로 수정하고, 반복 리스트에서 분리합니다.
                </p>
              </div>
            </div>
            {/* 13. [핵심] '규칙 변경 시 미래 일정 삭제 안내' 문구를 Alert 스타일로 직접 구현하여 통합합니다. */}
            {isRuleChanged && selectedChangeType === 'single' && (
              <div className="relative mt-3 flex items-start gap-3 rounded-lg border border-amber-500 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="flex-1">
                  <p className="font-semibold">주의</p>
                  <p className="text-xs">
                    ※ 이 항목의 규칙을 변경하면, 기존 규칙으로 생성되었던 이후의 일정들은 모두
                    삭제되고 새 규칙에 맞춰 다시 생성됩니다.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 옵션: '이후 일정 모두 수정' */}
          <div
            className={cn(
              'flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer',
              selectedChangeType === 'future'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300',
            )}
            onClick={() => setSelectedChangeType('future')}
          >
            <RadioGroupItem value="future" id="update-future" className="mt-0.5" />
            <div className="flex-1">
              <Label htmlFor="update-future" className="font-medium text-foreground cursor-pointer">
                이후 일정 모두 수정
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                선택한 일정부터 그 이후의 모든 반복 일정에 변경 사항을 적용합니다.
              </p>
            </div>
          </div>

          {/* 옵션: '전체 일정 수정' */}
          <div
            className={cn(
              'flex flex-col p-4 rounded-lg border-2 transition-colors cursor-pointer',
              selectedChangeType === 'all'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300',
            )}
            onClick={() => setSelectedChangeType('all')}
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="all" id="update-all" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="update-all" className="font-medium text-foreground cursor-pointer">
                  전체 반복 일정 수정
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  과거와 미래를 포함한 모든 반복 일정에 변경 사항을 적용합니다.
                </p>
              </div>
            </div>
            {/* 14. 기존의 '마감일 삭제 시 경고' 로직을 유지하고, 직접 구현한 Alert 스타일로 표시합니다. */}
            {isDueDateCleared && selectedChangeType === 'all' && (
              <div className="relative mt-3 flex items-start gap-3 rounded-lg border border-destructive bg-red-50 p-3 text-sm text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">강력 경고</p>
                  <p className="text-xs">
                    마감일을 삭제하면, 이후 모든 반복 일정이 삭제되고 반복이 종료됩니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </RadioGroup>

        {/* 15. 하단 버튼 영역을 PB 가이드에 맞춰 스타일링합니다. */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handleCancel}>
            취소
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-primary to-amber-400 hover:opacity-90"
            onClick={handleConfirm}
          >
            확인
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

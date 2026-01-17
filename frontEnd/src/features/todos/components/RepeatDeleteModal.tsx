// 1. 필요한 훅과 컴포넌트, 아이콘을 import합니다.
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react'; // PB 가이드에 따른 아이콘

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { useDeleteTodo } from '@/features/todos/hooks/useTodos';
import { appToast } from '@/shared/utils/appToast';
// 2. 기존의 삭제 API 타입을 그대로 사용합니다.
import type { DeleteTodoScope } from '@/features/todos/api/todoApi';

/**
 * @description RepeatDeleteModalPB 컴포넌트의 디자인을 적용한 Props 타입.
 *              기존 로직을 유지하기 위해 onClose, onSuccess 콜백 방식을 유지합니다.
 */
interface RepeatDeleteModalProps {
  todoId: number;
  onSuccess?: () => void;
  onClose: () => void;
}

// 3. PB 가이드의 값('single', 'future')을 내부 상태로 사용합니다.
type DeleteType = 'single' | 'future';

/**
 * @description 반복 Todo의 삭제 범위를 선택하는 모달. UI가 PB 가이드에 맞춰 전면 개편되었습니다.
 */
export function RepeatDeleteModal({ todoId, onSuccess, onClose }: RepeatDeleteModalProps) {
  // 4. 내부 상태의 기본값을 'future'로 설정합니다. (더 파괴적인 옵션을 기본으로 하여 사용자 주의를 환기)
  const [selectedDeleteType, setSelectedDeleteType] = useState<DeleteType>('future');

  const deleteTodoMutation = useDeleteTodo({
    onSuccess: () => {
      appToast.success({ message: '반복 일정이 성공적으로 삭제되었습니다.' });
      onSuccess?.();
    },
    onError: () => {
      onClose();
    },
  });

  // 5. 삭제 버튼 클릭 시, 내부 상태 값을 API가 요구하는 값으로 매핑하여 전달합니다.
  const handleDelete = useCallback(() => {
    if (!todoId) {
      appToast.error({ message: 'Todo ID가 없습니다.' });
      return;
    }

    const scopeApi: DeleteTodoScope = {
      single: 'ONE_TODO',
      future: 'FUTURE',
    }[selectedDeleteType];

    deleteTodoMutation.mutate({ id: todoId, scope: scopeApi });
  }, [todoId, selectedDeleteType, deleteTodoMutation]);

  // 6. PB 가이드의 마크업 구조와 스타일을 그대로 적용합니다.
  return (
    // z-index를 높여(z-[100]) 다른 모달 위에 표시되도록 레이어 우선순위를 조정합니다.
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 7. 닫기 버튼 스타일 및 핸들러를 PB 가이드에 맞춰 적용합니다. */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* 8. 삭제 테마에 맞는 헤더 아이콘 및 스타일을 PB 가이드에 맞춰 적용합니다. */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        {/* 9. 타이틀과 설명을 PB 가이드에 맞춰 적용합니다. (todoTitle은 제거) */}
        <h2 className="text-xl font-bold text-center text-foreground mb-2">반복 일정 삭제</h2>
        <p className="text-sm text-center text-muted-foreground mb-6">
          이 동작은 되돌릴 수 없습니다.
          <br />
          삭제 범위를 선택해주세요.
        </p>

        {/* 10. 라디오 그룹 UI/UX를 PB 가이드에 맞춰 전면 개편합니다. */}
        <RadioGroup
          value={selectedDeleteType}
          onValueChange={(v) => setSelectedDeleteType(v as DeleteType)}
          className="space-y-3 mb-6"
        >
          {/* 옵션: '이 일정만 삭제' */}
          <div
            className={cn(
              'flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer',
              selectedDeleteType === 'single'
                ? 'border-destructive bg-destructive/5'
                : 'border-gray-200 hover:border-gray-300',
            )}
            onClick={() => setSelectedDeleteType('single')}
          >
            <RadioGroupItem value="single" id="delete-single" className="mt-0.5" />
            <div className="flex-1">
              <Label htmlFor="delete-single" className="font-medium text-foreground cursor-pointer">
                이 일정만 삭제
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                선택한 일정만 삭제되고, 이후 반복 일정은 유지됩니다.
              </p>
            </div>
          </div>
          {/* 옵션: '이후 일정 모두 삭제' */}
          <div
            className={cn(
              'flex flex-col p-4 rounded-lg border-2 transition-colors cursor-pointer',
              selectedDeleteType === 'future'
                ? 'border-destructive bg-destructive/5'
                : 'border-gray-200 hover:border-gray-300',
            )}
            onClick={() => setSelectedDeleteType('future')}
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="future" id="delete-future" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="delete-future" className="font-medium text-foreground cursor-pointer">
                  이후 일정 모두 삭제 (기본)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  선택한 일정부터 이후의 모든 반복 일정이 삭제됩니다.
                </p>
              </div>
            </div>
            {/* 11. [핵심] 파괴적인 작업에 대한 강력한 경고 메시지를 Alert 스타일로 추가합니다. */}
            {selectedDeleteType === 'future' && (
              <div className="relative mt-3 flex items-start gap-3 rounded-lg border border-red-500 bg-red-50 p-3 text-sm text-red-800">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
                <div className="flex-1">
                  <p className="font-semibold">주의</p>
                  <p className="text-xs">
                    이 옵션은 현재 일정을 포함한 모든 미래의 반복 일정을 영구적으로 삭제합니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </RadioGroup>

        {/* 12. 하단 버튼 영역을 PB 가이드에 맞춰 스타일링합니다. (삭제 버튼은 destructive variant 사용) */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleDelete}
            disabled={deleteTodoMutation.isPending}
          >
            {deleteTodoMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

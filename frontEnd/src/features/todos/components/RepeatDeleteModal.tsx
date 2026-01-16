'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { useDeleteTodo } from '@/features/todos/hooks/useTodos';
import { appToast } from '@/shared/utils/appToast';
import type { DeleteTodoScope } from '@/features/todos/api/todoApi';

/**
 * @description RepeatDeleteModal 컴포넌트에 전달될 Props 타입.
 * @property {number} todoId - 삭제할 Todo의 ID.
 * @property {() => void} [onSuccess] - 삭제 성공 시 호출될 콜백 함수.
 * @property {() => void} onClose - 모달을 닫아야 할 때 호출될 콜백 함수.
 */
interface RepeatDeleteModalProps {
  todoId: number;
  onSuccess?: () => void;
  // `closeModal` 대신, 부모 컴포넌트로부터 `onClose` 콜백을 받습니다.
  // 이는 모달의 닫기 로직을 부모가 제어하도록 하여 컴포넌트의 재사용성을 높입니다.
  onClose: () => void;
}

/**
 * @description 반복 Todo의 삭제 범위를 선택하는 모달.
 *              이 컴포넌트는 `useModal().showModal(RepeatDeleteModal, props)`를 통해 호출되어야 합니다.
 *              모달의 닫기(취소, 성공)는 모두 부모로부터 받은 콜백(onClose, onSuccess)을 통해 처리됩니다.
 */
export function RepeatDeleteModal({ todoId, onSuccess, onClose }: RepeatDeleteModalProps) {
  const [selectedDeleteScope, setSelectedDeleteScope] = useState<DeleteTodoScope>('ONE_TODO');

  /**
   * @description useDeleteTodo 훅을 사용합니다.
   *              useDeleteTodo 훅은 반복 삭제를 위해 id와 scope를 포함하는 객체를 인자로 받도록 수정되었습니다.
   *              이 컴포넌트는 해당 시그니처에 맞춰 mutate 함수를 호출합니다.
   */
  const deleteTodoMutation = useDeleteTodo({
    onSuccess: () => {
      appToast.success({ message: '반복 일정이 성공적으로 삭제되었습니다.' });
      // 부모 컴포넌트에서 전달한 onSuccess 콜백을 호출합니다.
      // 모달 닫기를 포함한 모든 후속 처리는 이제 부모의 책임입니다.
      onSuccess?.();
    },
    onError: () => {
      // 에러 발생 시 모달을 닫습니다.
      onClose();
    },
  });

  const handleDelete = useCallback(() => {
    if (!todoId) {
      appToast.error({ message: 'Todo ID가 없습니다.' });
      return;
    }

    // 변경된 useDeleteTodo 훅의 시그니처에 맞춰 id와 scope를 객체로 전달합니다.
    deleteTodoMutation.mutate({ id: todoId, scope: selectedDeleteScope });
  }, [todoId, selectedDeleteScope, deleteTodoMutation]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        // 배경 클릭 시 onClose 콜백을 호출하여 모달 닫기를 부모에게 요청합니다.
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn('relative z-50 w-full max-w-md mx-4 p-6 rounded-2xl shadow-xl bg-white')}
          // 컨텐츠 영역 클릭 시 이벤트 버블링 방지
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h3 className="text-xl font-bold">반복 일정 삭제</h3>
            {/* 닫기 버튼 클릭 시 onClose 콜백을 호출합니다. */}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            어떤 범위의 반복 일정을 삭제하시겠습니까?
          </p>

          <RadioGroup
            value={selectedDeleteScope}
            onValueChange={(value: DeleteTodoScope) => setSelectedDeleteScope(value)}
            className="grid gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ONE_TODO" id="delete-one" />
              <Label htmlFor="delete-one">이 할 일만 삭제</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="FUTURE" id="delete-future" />
              <Label htmlFor="delete-future">향후 모든 할 일 삭제</Label>
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-3 mt-6">
            {/* 취소 버튼 클릭 시 onClose 콜백을 호출합니다. */}
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            {/* 삭제 실행 버튼 */}
            <Button onClick={handleDelete} disabled={deleteTodoMutation.isPending}>
              {deleteTodoMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

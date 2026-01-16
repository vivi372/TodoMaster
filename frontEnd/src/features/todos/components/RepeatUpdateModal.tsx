import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { useModal } from '@/shared/store/modalStore';

/**
 * @description 반복 일정 수정 시 어떤 범위로 수정할지 사용자에게 선택받는 모달.
 *              Promise 기반으로 동작하며, `onResolve` 콜백을 통해 선택된 값을 부모로 전달합니다.
 */
interface RepeatUpdateModalProps {
  /**
   * 모달이 닫힐 때 호출될 콜백 함수.
   * 사용자의 선택 값('ALL', 'AFTER_THIS') 또는 취소 시(null)를 인자로 받습니다.
   */
  onResolve: (value: 'ALL' | 'AFTER_THIS' | null) => void;
  /**
   * @description 마감일이 삭제되었는지 여부.
   * 이 값이 true이고 사용자가 '전체 반복 일정 수정'을 선택하면,
   * 마감일 부재 시 반복이 종료된다는 강력한 경고가 표시됩니다.
   */
  isDueDateCleared?: boolean;
}

type ChangeType = 'ALL' | 'AFTER_THIS';

export function RepeatUpdateModal({ onResolve, isDueDateCleared }: RepeatUpdateModalProps) {
  const { closeModal } = useModal();
  // API 명세에 맞는 'AFTER_THIS'를 기본값으로 설정합니다.
  const [selectedChangeType, setSelectedChangeType] = useState<ChangeType>('AFTER_THIS');

  // "확인" 버튼 클릭 시 선택된 값을 onResolve 콜백으로 전달하고 모달을 닫습니다.
  const handleConfirm = useCallback(() => {
    onResolve(selectedChangeType);
    closeModal();
  }, [selectedChangeType, onResolve, closeModal]);

  // "취소" 버튼 클릭 또는 배경 클릭 시 null을 전달하고 모달을 닫습니다.
  const handleCancel = useCallback(() => {
    onResolve(null);
    closeModal();
  }, [onResolve, closeModal]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleCancel} // 배경 클릭 시 취소
    >
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn('relative z-50 w-full max-w-md mx-4 p-6 rounded-2xl shadow-xl bg-white')}
        onClick={(e) => e.stopPropagation()} // 컨텐츠 클릭 시 이벤트 전파 방지
      >
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="text-xl font-bold">반복 일정 수정</h3>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          어떤 범위의 반복 일정을 수정하시겠습니까?
        </p>

        <RadioGroup
          value={selectedChangeType}
          // onValueChange의 타입 시그니처에 맞게 캐스팅합니다.
          onValueChange={(value) => setSelectedChangeType(value as ChangeType)}
          className="grid gap-4"
        >
          {/* API 명세에 있는 'AFTER_THIS'와 'ALL' 옵션만 제공합니다. */}
          <div className="flex items-center space-x-2 p-3 rounded-md border has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <RadioGroupItem value="AFTER_THIS" id="change-forward" />
            <Label htmlFor="change-forward" className="w-full cursor-pointer">
              이후 모든 할 일 수정
            </Label>
          </div>
          <div className="flex flex-col space-y-2 p-3 rounded-md border has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ALL" id="change-all" />
              <Label htmlFor="change-all" className="w-full cursor-pointer">
                전체 반복 일정 수정
              </Label>
            </div>
            {
              /*
               * [경고 문구 표시 로직]
               * 부모 컴포넌트(TodoFormModal)로부터 받은 isDueDateCleared가 true이고,
               * 사용자가 '전체 반복 일정 수정(ALL)'을 선택했을 때 경고 메시지를 노출합니다.
               * 이는 백엔드에서 마감일이 없는 반복 일정의 '전체 수정'을 '반복 종료'로 처리하는 정책을
               * 사용자에게 명확히 고지하기 위함입니다.
               */
              isDueDateCleared && selectedChangeType === 'ALL' && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  <span className="font-bold">⚠️ 경고:</span> 마감일을 삭제할 경우, 시스템 정책에
                  따라 이후 생성된 모든 반복 일정이 삭제되며 반복 규칙이 종료됩니다. 이 작업을
                  진행하시겠습니까?
                </div>
              )
            }
          </div>
        </RadioGroup>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button onClick={handleConfirm}>확인</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

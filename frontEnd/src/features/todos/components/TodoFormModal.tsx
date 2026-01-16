'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarIcon, Flag, FolderOpen, Repeat, BellRing, CalendarDays } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Calendar } from '@/shared/ui/calendar';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';
import { Checkbox } from '@/shared/ui/checkbox';
import { useCreateTodo, useUpdateTodo } from '@/features/todos/hooks/useTodos';
import { appToast } from '@/shared/utils/appToast';
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  RepeatVO,
} from '@/features/todos/api/todoApi';
import type { RepeatRuleCreateRequest } from '@/features/todos/api/RepeatApi';
import { useForm, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LoadingSkeletonCard } from '@/shared/ui/loading/LoadingSkeletonCard';
import { useModal } from '@/shared/store/modalStore'; // 1. useModal 훅 임포트
import { RepeatUpdateModal } from './RepeatUpdateModal'; // 2. RepeatUpdateModal 임포트
import { format, parseISO, add, addDays, addWeeks, addMonths, getDay } from 'date-fns';

// --- 상수 및 타입 정의 (기존과 동일) ---

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const WEEK_DAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEK_DAYS_NUMBERS = [0, 1, 2, 3, 4, 5, 6];

const dayToKorean = (dayNum: number) => WEEK_DAYS[dayNum];

interface PriorityMapInterface {
  [key: string]: number | string;
  [key: number]: string | number;
  high: 2;
  medium: 1;
  low: 0;
  2: 'high';
  1: 'medium';
  0: 'low';
}

const priorityMap: PriorityMapInterface = {
  high: 2,
  medium: 1,
  low: 0,
  2: 'high',
  1: 'medium',
  0: 'low',
};

/**
 * @description 첫 번째 반복 최소 종료일을 계산하는 함수.
 * @param dueDateStr - 마감일 (YYYY-MM-DD 형식의 문자열).
 * @param repeatType - 반복 유형 ('DAILY', 'WEEKLY', 'MONTHLY').
 * @param interval - 반복 간격 (숫자).
 * @param weekDays - 주간 반복 시 선택된 요일 배열 (0=일, 6=토).
 * @returns {Date | null} 계산된 최소 종료일 Date 객체 또는 계산 불가 시 null.
 */
const calculateMinEndDate = (
  dueDateStr: string,
  repeatType: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  interval: number,
  weekDays?: number[],
): Date | null => {
  if (!dueDateStr) return null;
  const startDate = parseISO(dueDateStr);

  switch (repeatType) {
    // 1. 매일 반복: 시작일 + interval 만큼의 날짜를 더합니다.
    // 예: 1월 15일 마감, 2일 간격 -> 첫 반복은 1월 17일.
    case 'DAILY':
      return addDays(startDate, interval);

    // 2. 매주 반복:
    case 'WEEKLY': {
      // 선택된 요일이 없으면, '시작일 + interval 주'를 최소일로 합니다.
      if (!weekDays || weekDays.length === 0) {
        return addWeeks(startDate, interval);
      }

      const startDay = getDay(startDate); // 시작일의 요일 (0-6)
      const sortedWeekDays = [...weekDays].sort((a, b) => a - b);

      // 시작일의 요일보다 크면서 가장 가까운 요일을 찾습니다.
      let nextRepeatDay = sortedWeekDays.find((day) => day > startDay);

      // 만약 이번 주에 다음 반복일이 없다면,
      // (interval-1) 주를 더한 후, 다음 주의 가장 빠른 요일로 설정합니다.
      if (nextRepeatDay === undefined) {
        const nextWeekStartDate = addWeeks(startDate, interval);
        // 다음 반복 주에서 가장 빠른 요일 찾기
        nextRepeatDay = sortedWeekDays[0];
        const nextWeekStartDay = getDay(nextWeekStartDate);
        let dayDiff = nextRepeatDay - nextWeekStartDay;
        return addDays(nextWeekStartDate, dayDiff);
      } else {
        // 이번 주에 다음 반복일이 있다면, 해당 요일로 설정합니다.
        let dayDiff = nextRepeatDay - startDay;
        return addDays(startDate, dayDiff);
      }
    }

    // 3. 매월 반복: 시작일 + interval 만큼의 달을 더합니다.
    // 예: 1월 15일 마감, 1달 간격 -> 첫 반복은 2월 15일.
    case 'MONTHLY':
      return addMonths(startDate, interval);

    default:
      return null;
  }
};

const formSchema =
  z
    .object({
      title: z
        .string()
        .nonempty('제목을 입력해주세요.')
        .min(2, '제목은 최소 2자 이상이어야 합니다.')
        .max(100, '제목은 100자를 초과할 수 없습니다.'),
      memo: z.string().max(500, '메모는 500자를 초과할 수 없습니다.').optional(),
      category: z.string().optional(),
      priority: z.enum(['high', 'medium', 'low']).default('medium').nonoptional(),
      dueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, '유효한 날짜 형식이 아닙니다 (YYYY-MM-DD).')
        .optional()
        .nullable(),
      isRepeating: z.boolean().default(false).nonoptional(),
      repeatRule: z
        .object({
          type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY'], {
            message: '반복 타입을 선택해주세요.',
          }),
          intervalValue: z
            .number()
            .int()
            .min(1, '반복 간격은 1 이상이어야 합니다.')
            .default(1)
            .nonoptional(),
          weekDays: z.array(z.number()).optional(),
          endDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, '유효한 날짜 형식이 아닙니다 (YYYY-MM-DD).')
            .optional()
            .nullable(),
        })
        .optional(),
    })
    .refine(
      (data) => {
        // 반복 설정을 사용하고, 마감일과 종료일이 모두 있는 경우에만 유효성 검사 실행
        if (data.isRepeating && data.dueDate && data.repeatRule?.endDate) {
          // 반복 종료일이 마감일보다 이전 날짜이면 유효성 검사 실패
          return parseISO(data.repeatRule.endDate) >= parseISO(data.dueDate);
        }
        // 그 외의 경우는 항상 통과
        return true;
      },
      {
        // 유효성 검사 실패 시 표시될 메시지
        message: '반복 종료일은 마감일보다 이전 날짜일 수 없습니다.',
        // 이 오류 메시지를 'repeatRule.endDate' 필드와 연결
        path: ['repeatRule', 'endDate'],
      },
    )
    .refine(
      (data) => {
        // 반복 종료일이 최소 반복 생성일보다 빠른지 검증
        if (data.isRepeating && data.dueDate && data.repeatRule?.endDate && data.repeatRule) {
          const minEndDate = calculateMinEndDate(
            data.dueDate,
            data.repeatRule.type,
            data.repeatRule.intervalValue,
            data.repeatRule.weekDays,
          );
          if (minEndDate) {
            return parseISO(data.repeatRule.endDate) >= minEndDate;
          }
        }
        return true;
      },
      {
        message: '반복 종료일은 최소 1회 이상 반복이 생성되는 날짜여야 합니다.',
        path: ['repeatRule', 'endDate'],
      },
    );

type TodoFormValues = z.infer<typeof formSchema>;

const defaultFormValues: TodoFormValues = {
  title: '',
  memo: '',
  category: '',
  priority: 'medium',
  dueDate: null,
  isRepeating: false,
  repeatRule: {
    type: 'DAILY',
    intervalValue: 1,
    weekDays: [],
    endDate: null,
  },
};

interface TodoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  todoToEdit?: Todo;
  onSuccess?: () => void;
}

const priorityOptions = [
  { value: 'high', label: '높음', color: 'text-red-500', bgColor: 'bg-red-50' },
  { value: 'medium', label: '보통', color: 'text-amber-500', bgColor: 'bg-amber-50' },
  { value: 'low', label: '낮음', color: 'text-blue-500', bgColor: 'bg-blue-50' },
];

const sampleCategories = ['업무', '개인', '생활', '공부', '운동', '기타'];

const repeatPeriodOptions = [
  { value: 'DAILY', label: '일' },
  { value: 'WEEKLY', label: '주' },
  { value: 'MONTHLY', label: '월' },
];

// --- Helper Functions --- //

/**
 * @description 두 반복 규칙 객체(기존 규칙, 새 규칙)가 동일한지 비교하는 함수.
 * @param oldRule - 기존 Todo의 반복 규칙 (`RepeatVO` 또는 undefined).
 * @param newRule - 폼에서 새로 생성된 반복 규칙 (`RepeatRuleCreateRequest` 또는 undefined).
 * @returns {boolean} 규칙이 동일하면 true, 아니면 false.
 */
const areRepeatRulesEqual = (
  oldRule: RepeatVO | undefined,
  newRule: RepeatRuleCreateRequest | undefined,
): boolean => {
  // 1. 둘 다 없으면 동일한 것으로 간주
  if (!oldRule && !newRule) return true;
  // 2. 하나만 없으면 다른 것으로 간주
  if (!oldRule || !newRule) return false;

  // 3. 타입, 간격, 종료일 비교
  if (
    oldRule.type !== newRule.type ||
    oldRule.intervalValue !== newRule.intervalValue ||
    (oldRule.endDate ?? null) !== (newRule.endDate ?? null)
  ) {
    return false;
  }

  // 4. 주간 반복 요일 비교 (문자열 정렬 후 비교)
  if (oldRule.type === 'WEEKLY') {
    const oldWeekDays = oldRule.weekDays?.split(',').sort().join(',') || '';
    const newWeekDays = newRule.weekDays?.split(',').sort().join(',') || '';
    if (oldWeekDays !== newWeekDays) {
      return false;
    }
  }

  // 모든 비교를 통과하면 동일한 규칙으로 판단
  return true;
};

// --- RepeatDaysOfWeek Component (기존과 동일) ---
interface RepeatDaysOfWeekProps {
  control: any;
  name: string;
}

function RepeatDaysOfWeek({ control, name }: RepeatDaysOfWeekProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selectedDays: number[] = field.value || [];
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {WEEK_DAYS_NUMBERS.map((dayNum) => (
              <div key={dayNum} className="flex items-center space-x-2">
                <Checkbox
                  id={`weekday-${dayNum}`}
                  checked={selectedDays.includes(dayNum)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      field.onChange([...selectedDays, dayNum]);
                    } else {
                      field.onChange(selectedDays.filter((d) => d !== dayNum));
                    }
                  }}
                />
                <Label htmlFor={`weekday-${dayNum}`}>{dayToKorean(dayNum)}</Label>
              </div>
            ))}
          </div>
        );
      }}
    />
  );
}

// --- Component Body --- //
export function TodoFormModal({
  open,
  onOpenChange,
  mode = 'create',
  todoToEdit,
  onSuccess,
}: TodoFormModalProps) {
  const form = useForm<TodoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [minEndDate, setMinEndDate] = useState<Date | null>(null);
  const modal = useModal(); // 모달 훅 사용

  const createTodoMutation = useCreateTodo({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const updateTodoMutation = useUpdateTodo({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const isSaving = createTodoMutation.isPending || updateTodoMutation.isPending;
  const currentPriority = watch('priority');
  const dueDate = watch('dueDate');
  const endDate = watch('repeatRule.endDate');
  const isRepeating = watch('isRepeating');
  const repeatRule = watch('repeatRule');
  const repeatType = watch('repeatRule.type');
  const repeatInterval = watch('repeatRule.intervalValue');
  const repeatWeekDays = watch('repeatRule.weekDays');

  // 마감일이 없는 경우 반복 설정을 비활성화하는 로직
  useEffect(() => {
    if (!dueDate) {
      setValue('isRepeating', false);
    }
  }, [dueDate, setValue]);

  // [useEffect] 반복 규칙 변경 시 최소 종료일 재계산 및 자동 보정
  useEffect(() => {
    if (isRepeating && dueDate && repeatType && repeatInterval) {
      const newMinEndDate = calculateMinEndDate(
        dueDate,
        repeatType,
        repeatInterval,
        repeatWeekDays,
      );
      setMinEndDate(newMinEndDate);

      // 현재 설정된 endDate가 새로운 최소 종료일보다 이전인 경우,
      // 사용자 경험을 위해 자동으로 최소 종료일로 보정해줍니다.
      if (newMinEndDate && endDate) {
        if (parseISO(endDate) < newMinEndDate) {
          setValue('repeatRule.endDate', format(newMinEndDate, 'yyyy-MM-dd'));
        }
      }
    } else {
      setMinEndDate(null);
    }
  }, [
    isRepeating,
    dueDate,
    repeatType,
    repeatInterval,
    repeatWeekDays,
    endDate,
    setValue,
  ]);

  const getRepeatSummary = useCallback(() => {
    if (!isRepeating || !repeatRule) return '';

    const { type, intervalValue, weekDays } = repeatRule;
    let summary = '';

    const periodMap = { DAILY: '일', WEEKLY: '주', MONTHLY: '개월' };
    const typeMap = { DAILY: '매일', WEEKLY: '매주', MONTHLY: '매월' };

    if (intervalValue > 1) {
      summary = `${intervalValue}${periodMap[type]}마다`;
    } else {
      summary = typeMap[type];
    }

    if (type === 'WEEKLY' && weekDays && weekDays.length > 0) {
      const dayLabels = weekDays
        .slice() // Create a copy before sorting
        .sort((a, b) => a - b)
        .map((day) => WEEK_DAYS[day]);
      summary += ` ${dayLabels.join(', ')}`;
    }

    return summary;
  }, [isRepeating, repeatRule]);

  const toggleRepeatDay = (day: number) => {
    const currentDays: number[] = watch('repeatRule.weekDays') || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    setValue(
      'repeatRule.weekDays',
      newDays.sort((a, b) => a - b),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  useEffect(() => {
    if (open) {
      setIsLoadingForm(true);
      const timer = setTimeout(() => {
        if (mode === 'edit' && todoToEdit) {
          // --- 수정 모드 ---
          const priorityString =
            (priorityMap[todoToEdit.priority] as 'high' | 'medium' | 'low') || 'medium';
          setValue('title', todoToEdit.title || '', { shouldValidate: true, shouldDirty: true });
          setValue('memo', todoToEdit.memo || '', { shouldValidate: true, shouldDirty: true });
          setValue('priority', priorityString, { shouldValidate: true, shouldDirty: true });
          setValue('dueDate', todoToEdit.dueDate, {
            shouldValidate: true,
            shouldDirty: true,
          });
          setValue('category', '', { shouldValidate: true, shouldDirty: true });

          // --- 반복 규칙 설정 ---
          const hasRepeatRule = !!todoToEdit.repeatVO;
          setValue('isRepeating', hasRepeatRule);

          if (hasRepeatRule) {
            const { type, intervalValue, weekDays, endDate } = todoToEdit.repeatVO!;
            setValue('repeatRule.type', type);
            setValue('repeatRule.intervalValue', intervalValue);
            if (endDate) {
              setValue('repeatRule.endDate', format(parseISO(endDate), 'yyyy-MM-dd'));
            } else {
              setValue('repeatRule.endDate', null);
            }

            if (type === 'WEEKLY' && weekDays) {
              const dayStringToNum: { [key: string]: number } = {
                SUN: 0,
                MON: 1,
                TUE: 2,
                WED: 3,
                THU: 4,
                FRI: 5,
                SAT: 6,
              };
              const weekDaysAsNumbers = weekDays
                .split(',')
                .map((day) => dayStringToNum[day.trim() as keyof typeof dayStringToNum]);
              setValue('repeatRule.weekDays', weekDaysAsNumbers);
            } else {
              setValue('repeatRule.weekDays', []);
            }
          }
        } else {
          // --- 생성 모드 또는 초기화 ---
          form.reset(defaultFormValues);
        }
        setIsLoadingForm(false);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsLoadingForm(false);
    }
  }, [open, mode, todoToEdit, setValue, form]);

  const onFormError = (error: FieldErrors<TodoFormValues>) => {
    // `repeatRule.endDate` 에러 메시지를 우선적으로 찾습니다.
    let errorMessage = error.repeatRule?.endDate?.message;

    // 만약 endDate 에러가 없다면, 다른 첫 번째 에러 메시지를 찾습니다.
    if (!errorMessage) {
      const firstError = Object.values(error).find((e) => e.message);
      errorMessage = firstError?.message;
    }

    appToast.warning({
      message: '입력 값에 오류가 있어요',
      description: errorMessage || '필수 항목을 모두 입력해주세요.',
    });
  };

  /**
   * @description 폼 제출 핸들러. 생성 또는 수정 API를 호출합니다.
   * 수정 시, 반복 규칙이 변경된 경우 `RepeatUpdateModal`을 호출하여 사용자 선택을 받습니다.
   */
  const onSubmit = async (data: TodoFormValues) => {
    const apiPriority = priorityMap[data.priority] as number;

    let repeatRulePayload: RepeatRuleCreateRequest | undefined = undefined;

    // 1. 폼 데이터 기반으로 새로운 반복 규칙 페이로드(newRule) 생성
    if (data.isRepeating && data.repeatRule) {
      repeatRulePayload = {
        type: data.repeatRule.type,
        intervalValue: data.repeatRule.intervalValue,
        endDate: data.repeatRule.endDate || undefined,
      };

      if (data.repeatRule.type === 'WEEKLY' && data.repeatRule.weekDays?.length) {
        repeatRulePayload.weekDays = data.repeatRule.weekDays
          .sort((a, b) => a - b) // 요일 순서를 정렬하여 일관성 유지
          .map((dayNum) => WEEK_DAYS_EN[dayNum])
          .join(',');
      }
    }

    if (mode === 'create') {
      const createPayload: CreateTodoRequest = {
        title: data.title,
        memo: data.memo,
        dueDate: data.dueDate || undefined,
        priority: apiPriority,
        repeatRule: repeatRulePayload,
      };
      createTodoMutation.mutate(createPayload);
    } else if (mode === 'edit' && todoToEdit) {
      // --- 수정 로직 시작 ---
      const updatePayload: UpdateTodoRequest = {
        title: data.title,
        memo: data.memo,
        dueDate: data.dueDate || undefined,
        priority: apiPriority,
        repeatRule: repeatRulePayload,
      };

      // 2. 기존 반복 규칙(oldRule)과 새로 생성된 규칙(newRule)을 비교
      const oldRule = todoToEdit.repeatVO;
      const rulesAreEqual = areRepeatRulesEqual(oldRule, repeatRulePayload);

      // 3. 규칙이 변경되었을 경우에만 모달을 띄움
      if (!rulesAreEqual && oldRule) {
        try {
          // 4. `showModal`을 Promise로 감싸서 사용자의 선택을 비동기적으로 기다립니다.
          const changeType = await new Promise<'ALL' | 'AFTER_THIS' | null>((resolve) => {
            modal.showModal(RepeatUpdateModal, {
              onResolve: resolve,
              isDueDateCleared: !data.dueDate, // 마감일이 삭제되었는지 여부를 전달
            });
          });

          // 5. 사용자가 '취소'를 선택하면(changeType이 null), API 호출을 중단.
          if (changeType === null) {
            appToast.info({ message: '수정이 취소되었습니다.' });
            return;
          }

          // 6. 사용자가 '모두' 또는 '이후'를 선택하면, payload에 changeType 추가
          updatePayload.changeType = changeType;
        } catch (error) {
          console.error('Modal promise failed:', error);
          appToast.error({ message: '오류가 발생하여 수정을 완료할 수 없습니다.' });
          return;
        }
      }

      // 7. 최종적으로 구성된 payload로 업데이트 API 호출
      updateTodoMutation.mutate({ id: todoToEdit.todoId, payload: updatePayload });
    }
  };

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'relative z-50 w-full md:max-w-2xl mx-4 mb-0 md:mb-4',
          'bg-white rounded-t-3xl md:rounded-2xl shadow-xl',
          'max-h-[90vh] flex flex-col',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {mode === 'create' ? '새로운 할 일' : '할 일 수정'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'create' ? '할 일을 추가해보세요' : '할 일 정보를 수정하세요'}
          </p>
        </div>
        {isLoadingForm ? (
          <LoadingSkeletonCard count={3} />
        ) : (
          <>
            <form
              onSubmit={handleSubmit(onSubmit, onFormError)}
              className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
            >
              {/* --- 폼 필드들 (기존과 동일) --- */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label htmlFor="title" className="text-sm font-medium flex items-center gap-1">
                  제목 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="할 일을 입력하세요"
                  {...register('title')}
                  className="mt-2"
                  autoFocus
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Label htmlFor="memo" className="text-sm font-medium">
                  메모
                </Label>
                <Textarea
                  id="memo"
                  placeholder="추가 메모를 입력하세요"
                  {...register('memo')}
                  className="mt-2 min-h-[100px]"
                />
                {errors.memo && <p className="text-red-500 text-xs mt-1">{errors.memo.message}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    카테고리
                  </Label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {sampleCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    우선순위
                  </Label>
                  <Controller
                    control={control}
                    name="priority"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={currentPriority}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className={option.color}>{option.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  마감일
                </Label>
                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal mt-2',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(parseISO(field.value), 'yyyy년 MM월 dd일')
                            : '날짜를 선택하세요'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? parseISO(field.value) : undefined}
                          onSelect={(date) =>
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : null)
                          }
                          disabled={{ before: new Date() }}
                          initialFocus
                        />
                        <div className="p-3 border-t">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setValue('dueDate', null, {
                                shouldDirty: true,
                              })
                            }
                          >
                            마감일 제거
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </motion.div>

              {/*
                [마감일 연동 UI/UX 개선]
                - 마감일(dueDate) 값의 존재 여부에 따라 반복 설정 UI의 활성/비활성 상태를 제어합니다.
                - 마감일이 없으면 전체 섹션이 비활성화(dimmed) 처리되어 사용자에게 시각적 힌트를 제공합니다.
                - Switch 또한 직접적으로 disabled 처리하여 상호작용을 차단합니다.
                - 정책 안내 문구를 추가하여 사용자에게 명확한 가이드를 제공합니다.
              */}
              <div className="border-t border-dashed border-border pt-4">
                <p className="text-xs text-muted-foreground mb-3">확장 기능</p>
                <div
                  className={cn('transition-opacity', {
                    'opacity-50 cursor-not-allowed': !dueDate,
                  })}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-between p-4 rounded-lg border',
                        !dueDate ? 'bg-gray-50' : 'border-border bg-blue-50/30',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            !dueDate ? 'bg-gray-200' : 'bg-blue-100',
                          )}
                        >
                          <Repeat
                            className={cn('h-5 w-5', !dueDate ? 'text-gray-400' : 'text-blue-500')}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="isRepeating"
                            className={cn(
                              'text-sm font-medium cursor-pointer',
                              !dueDate ? 'text-gray-400' : 'text-foreground',
                            )}
                          >
                            반복 설정
                          </Label>
                          {watch('isRepeating') && getRepeatSummary() && (
                            <p className="text-xs text-blue-600 font-medium mt-0.5">
                              {getRepeatSummary()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Controller
                        name="isRepeating"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            id="isRepeating"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!dueDate}
                          />
                        )}
                      />
                    </div>

                    <AnimatePresence>
                      {watch('isRepeating') && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 mt-3 space-y-4 bg-accent/30 rounded-lg border border-border">
                            {/* 정책 안내 문구 */}
                            <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded-md">
                              <p>
                                <span className="font-semibold">중요:</span> 반복 설정 시 마감일
                                입력은 필수이며, 마감일 삭제 시 이후의 모든 반복 일정과 규칙이
                                정리됩니다.
                              </p>
                            </div>

                            {/* 반복 주기 */}
                            <div>
                              <Label className="text-sm font-medium">반복 주기</Label>
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                <Controller
                                  name="repeatRule.intervalValue"
                                  control={control}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      min="1"
                                      value={field.value}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value, 10) || 1)
                                      }
                                      className="text-center"
                                    />
                                  )}
                                />
                                <Controller
                                  name="repeatRule.type"
                                  control={control}
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {repeatPeriodOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                            </div>

                            {/* 요일 선택 (주간 반복일 때만) */}
                            {watch('repeatRule.type') === 'WEEKLY' && (
                              <div>
                                <Label className="text-sm font-medium">반복 요일</Label>
                                <Controller
                                  name="repeatRule.weekDays"
                                  control={control}
                                  render={({ field }) => (
                                    <div className="grid grid-cols-7 gap-2 mt-2">
                                      {WEEK_DAYS_NUMBERS.map((dayNum) => (
                                        <Button
                                          key={dayNum}
                                          type="button"
                                          variant={
                                            (field.value || []).includes(dayNum)
                                              ? 'default'
                                              : 'outline'
                                          }
                                          size="sm"
                                          className={cn(
                                            'h-10 rounded-full',
                                            (field.value || []).includes(dayNum) &&
                                              'bg-blue-500 hover:bg-blue-600',
                                          )}
                                          onClick={() => toggleRepeatDay(dayNum)}
                                        >
                                          {WEEK_DAYS[dayNum]}
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                />
                              </div>
                            )}

                            {/* 반복 종료일 */}
                            <div>
                              <Label className="text-sm font-medium">반복 종료</Label>
                              <Controller
                                name="repeatRule.endDate"
                                control={control}
                                render={({ field }) => (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          'w-full justify-start text-left font-normal mt-2',
                                          !field.value && 'text-muted-foreground',
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value
                                          ? format(parseISO(field.value), 'yyyy년 MM월 dd일')
                                          : '종료 없음'}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value ? parseISO(field.value) : undefined}
                                        onSelect={(date) =>
                                          field.onChange(date ? format(date, 'yyyy-MM-dd') : null)
                                        }
                                        disabled={{
                                          before: minEndDate || new Date(),
                                        }}
                                        initialFocus
                                      />
                                      <div className="p-3 border-t">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="w-full"
                                          onClick={() =>
                                            setValue('repeatRule.endDate', null, {
                                              shouldDirty: true,
                                            })
                                          }
                                        >
                                          종료일 제거
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              />
                              {errors.repeatRule?.endDate && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors.repeatRule.endDate.message}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                반복 규칙에 따라 최소 한 번 이상의 일정이 생성되어야 합니다.
                              </p>
                            </div>
                            {/* 반복 일정 제한 고지 문구: PB 디자인에 맞춰 하단으로 이동 및 스타일 유지 */}
                            <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-md mt-4">
                              <p>
                                <span className="font-semibold">안내:</span> 반복 일정은 시스템
                                성능을 위해 일정 기간(예: 최대 1년 또는 N회)까지만 미리 생성됩니다.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mt-3"
                >
                  <button
                    type="button"
                    onClick={() =>
                      appToast.info({ message: '알림 설정 기능은 추후 개발 예정입니다.' })
                    }
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-lg border',
                      'bg-gray-50 border-gray-200',
                      'hover:bg-gray-100 transition-colors',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <BellRing className="h-5 w-5 text-purple-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">알림 설정</p>
                        <p className="text-xs text-muted-foreground">마감일 알림 받기</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      준비 중
                    </Badge>
                  </button>
                </motion.div>
              </div>
            </form>
            <div className="flex-shrink-0 px-6 py-4 border-t border-border">
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={handleClose}>
                  취소
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-amber-400 hover:opacity-90"
                  onClick={handleSubmit(onSubmit, onFormError)}
                  disabled={isSaving}
                >
                  {isSaving ? '저장 중...' : mode === 'create' ? '추가하기' : '수정하기'}
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

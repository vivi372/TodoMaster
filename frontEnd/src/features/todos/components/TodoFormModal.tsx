'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarIcon, Flag, FolderOpen, Repeat, BellRing } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Calendar } from '@/shared/ui/calendar';
import { Badge } from '@/shared/ui/badge';
import { useCreateTodo, useUpdateTodo } from '@/features/todos/hooks/useTodos';
import { appToast } from '@/shared/utils/appToast';
import type {
  TodoResponse,
  CreateTodoRequest,
  UpdateTodoRequest,
} from '@/features/todos/api/todoApi';
import { useForm, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LoadingSkeletonCard } from '@/shared/ui/loading/LoadingSkeletonCard';

// --- 상수 및 타입 정의 --- //

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

// Zod 스키마에 상세한 한국어 유효성 검사 메시지 추가
const formSchema = z.object({
  title: z
    .string()
    .nonempty('제목을 입력해주세요.')
    .min(2, '제목은 최소 2자 이상이어야 합니다.')
    .max(100, '제목은 100자를 초과할 수 없습니다.'),
  memo: z.string().max(500, '메모는 500자를 초과할 수 없습니다.').optional(),
  category: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium').nonoptional(),
  dueDate: z.date().optional().nullable(),
});

type TodoFormValues = z.infer<typeof formSchema>;

const defaultFormValues: TodoFormValues = {
  title: '',
  memo: '',
  category: '',
  priority: 'medium',
  dueDate: null,
};

interface TodoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  todoToEdit?: TodoResponse;
  onSuccess?: () => void;
}

const priorityOptions = [
  { value: 'high', label: '높음', color: 'text-red-500', bgColor: 'bg-red-50' },
  { value: 'medium', label: '보통', color: 'text-amber-500', bgColor: 'bg-amber-50' },
  { value: 'low', label: '낮음', color: 'text-blue-500', bgColor: 'bg-blue-50' },
];

const sampleCategories = ['업무', '개인', '생활', '공부', '운동', '기타'];

// --- 컴포넌트 본문 --- //

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
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const [isRepeatExpanded, setIsRepeatExpanded] = useState(false);
  const [isAlertExpanded, setIsAlertExpanded] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);

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

  // 2. **렌더링 내부에서 값 확인 (반영된 후)**
  const currentPriority = watch('priority');

  useEffect(() => {
    //console.log(currentPriority);
  }, [currentPriority]);

  useEffect(() => {
    if (open) {
      // 모달이 열리면 로딩 시작
      setIsLoadingForm(true);
      // 주석: 렌더링 사이클에서 충분한 시간을 주고 값을 세팅하는 꼼수 적용
      const timer = setTimeout(() => {
        if (mode === 'edit' && todoToEdit) {
          // 수정 시, setValue로 필드 값 설정.
          const priorityString =
            (priorityMap[todoToEdit.priority] as 'high' | 'medium' | 'low') || 'medium';
          setValue('title', todoToEdit.title || '', { shouldValidate: true, shouldDirty: true });
          setValue('memo', todoToEdit.memo || '', { shouldValidate: true, shouldDirty: true });
          console.log(priorityString);
          setValue('priority', priorityString, { shouldValidate: true, shouldDirty: true });
          setValue('dueDate', todoToEdit.dueDate ? new Date(todoToEdit.dueDate) : null, {
            shouldValidate: true,
            shouldDirty: true,
          });
          setValue('category', '', { shouldValidate: true, shouldDirty: true });
        } else {
          // 사용자 요청: 생성 모드에서 reset 대신 setValue로 초기화
          // reset(defaultFormValues);
          setValue('title', '', { shouldDirty: false });
          setValue('memo', '', { shouldDirty: false });
          setValue('priority', 'medium', { shouldDirty: false });
          setValue('dueDate', null, { shouldDirty: false });
          setValue('category', '', { shouldDirty: false });
        }
        setIsLoadingForm(false); // 값 설정 완료 후 로딩 종료
      }, 50);
      return () => {
        clearTimeout(timer); // 클린업 함수: 모달이 닫히면 타이머를 제거
      };
    } else {
      // 모달이 닫힐 때는 로딩 상태를 즉시 false로 설정하여 상태를 정리
      setIsLoadingForm(false);
    }
  }, [open, mode, todoToEdit, reset]);

  // RHF 유효성 검사 실패 시 호출될 에러 핸들러
  const onFormError = (error: FieldErrors<TodoFormValues>) => {
    const firstErrorMessage = Object.values(error).map((e) => e.message)[0];
    appToast.warning({
      message: '입력 값에 오류가 있어요',
      description: firstErrorMessage || '필수 항목을 모두 입력해주세요.',
    });
  };

  const onSubmit = async (data: TodoFormValues) => {
    const formattedDueDate = data.dueDate ? data.dueDate.toISOString().split('T')[0] : undefined;
    const apiPriority = priorityMap[data.priority] as number;

    if (mode === 'create') {
      const createPayload: CreateTodoRequest = {
        title: data.title,
        memo: data.memo,
        dueDate: formattedDueDate,
        priority: apiPriority,
      };
      createTodoMutation.mutate(createPayload);
    } else if (mode === 'edit' && todoToEdit) {
      const updatePayload: UpdateTodoRequest = {
        title: data.title,
        memo: data.memo,
        dueDate: formattedDueDate,
        priority: apiPriority,
      };
      updateTodoMutation.mutate({ id: todoToEdit.todoId, payload: updatePayload });
    }
  };

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!open) return null;

  //if (true) return <LoadingSkeletonCard count={5} />;

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
                            ? field.value.toLocaleDateString('ko-KR')
                            : '날짜를 선택하세요'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </motion.div>
              <div className="border-t border-dashed border-border pt-4">
                <p className="text-xs text-muted-foreground mb-3">확장 기능 (향후 업데이트 예정)</p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      appToast.info({ message: '반복 설정 기능은 추후 개발 예정입니다.' })
                    }
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-lg border',
                      'bg-gray-50 border-gray-200',
                      'hover:bg-gray-100 transition-colors',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Repeat className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">반복 설정</p>
                        <p className="text-xs text-muted-foreground">매일, 매주 등 반복 일정</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      준비 중
                    </Badge>
                  </button>

                  <AnimatePresence>
                    {isRepeatExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 mt-2 bg-accent/30 rounded-lg border border-border">
                          <p className="text-sm text-muted-foreground">
                            반복 설정 옵션이 여기에 표시됩니다.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
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

                  <AnimatePresence>
                    {isAlertExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 mt-2 bg-accent/30 rounded-lg border border-border">
                          <p className="text-sm text-muted-foreground">
                            알림 설정 옵션이 여기에 표시됩니다.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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

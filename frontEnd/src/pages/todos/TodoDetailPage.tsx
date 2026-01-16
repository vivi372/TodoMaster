import { useState } from 'react'; // useState 추가
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Flag,
  FolderOpen,
  Repeat,
  BellRing,
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';

import { Skeleton } from '@/shared/ui/skeleton';
import { handleAxiosError } from '@/shared/error/handleAxiosError';
import { useModalStore } from '@/shared/store/modalStore'; // useModalStore로 변경
import { appToast } from '@/shared/utils/appToast'; // appToast 추가
import { useUpdateTodo, useDeleteTodo } from '@/features/todos/hooks/useTodos'; // useUpdateTodo, useDeleteTodo 추가
import { TodoFormModal } from '@/features/todos/components/TodoFormModal'; // TodoFormModal 추가
import { RepeatDeleteModal } from '@/features/todos/components/RepeatDeleteModal'; // RepeatDeleteModal 임포트
import { useTodo } from '@/features/todos/hooks/useTodo';
import { formatRepeatRule, isRepeatExpired } from '@/shared/lib/utils'; // formatRepeatRule, isRepeatExpired 임포트

// 우선순위 설정
const priorityConfig = {
  2: { label: '높음', color: 'text-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  1: {
    label: '보통',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  0: {
    label: '낮음',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
};

/**
 * //* TodoDetailPage
 * 할 일 상세 정보를 표시하는 페이지 컴포넌트입니다.
 * URL 파라미터에서 todoId를 가져와 `useTodo` 훅으로 상세 데이터를 조회합니다.
 * 로딩 및 에러 상태에 따라 적절한 UI를 표시합니다.
 */
export default function TodoDetailPage() {
  const navigate = useNavigate();
  const { todoId } = useParams<{ todoId: string }>();
  // modalStore에서 모달을 제어하는 함수들을 직접 가져옵니다.
  // 이 방식은 Zustand 스토어의 상태를 구독하며, 리액티브하게 반응합니다.
  const { showModal, showConfirm, closeModal } = useModalStore();

  // Todo 수정 모달의 열림/닫힘 상태를 관리
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Todo 수정 뮤테이션 훅
  const updateTodoMutation = useUpdateTodo({
    onSuccess: () => {
      setIsEditModalOpen(false); // 수정 성공 시 모달 닫기
    },
  });
  // Todo 삭제 뮤테이션 훅
  const deleteTodoMutation = useDeleteTodo({
    onSuccess: () => {
      appToast.success({ message: '할 일이 성공적으로 삭제되었습니다.' });
      navigate('/todos'); // 삭제 성공 시 목록 페이지로 이동
    },
  });

  // 문자열로 받은 todoId를 숫자로 변환합니다. 변환할 수 없으면 0을 사용합니다.
  const numericTodoId = Number(todoId);

  const { data: todo, isLoading, isError, error } = useTodo(numericTodoId);

  if (isLoading) {
    return <TodoDetailSkeleton />;
  }

  if (isError) {
    handleAxiosError(error); // 에러를 toast로 표시
    navigate('/todos'); // 에러 발생 시 목록 페이지로 리디렉션
    return null;
  }

  if (!todo) {
    // 데이터가 없는 경우에 대한 처리
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50">
        <p className="text-muted-foreground">할 일 정보를 찾을 수 없습니다.</p>
        <Button variant="link" onClick={() => navigate('/todos')}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  // API 응답에 따라 UI에 필요한 데이터 가공
  const isCompleted = todo.isCompleted === 'Y';
  const priorityInfo =
    priorityConfig[todo.priority as keyof typeof priorityConfig] || priorityConfig[1];

  // 날짜 포맷 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  };

  // Todo 수정 핸들러
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  // 반복 일정 수정 핸들러
  // 상세 정보 페이지의 '반복 설정' 섹션에 있는 수정 버튼을 클릭했을 때 호출됩니다.
  const handleOpenRepeatUpdateModal = () => {
    // `RepeatUpdateModal`을 직접 호출하는 대신,
    // 전체 Todo를 수정할 수 있는 메인 수정 모달(`TodoFormModal`)을 엽니다.
    // `TodoFormModal`은 내부에 반복 일정 변경 시 수정 범위를 묻는
    // `RepeatUpdateModal`을 호출하는 완전한 로직을 이미 갖추고 있습니다.
    // 따라서 이 핸들러는 전체 수정 프로세스를 시작하는 `handleEdit`을 호출하는 것이
    // 가장 올바르고 일관된 사용자 경험을 제공합니다.
    handleEdit();
  };

  // 반복 일정 삭제 모달 열기 핸들러
  const handleOpenRepeatDeleteModal = async () => {
    if (!todo) return;
    // `showModal`을 호출하여 `RepeatDeleteModal` 커스텀 모달을 엽니다.
    // 이제 `RepeatDeleteModal`은 `onClose`와 `onSuccess` 콜백을 통해 닫기 로직을 처리하므로,
    // 이 콜백들 안에서 `closeModal` 함수를 호출하여 모달을 닫아줍니다.
    showModal(RepeatDeleteModal, {
      todoId: todo.todoId,
      onSuccess: () => {
        // `RepeatDeleteModal` 내부에서 삭제 성공 시 이 함수가 호출됩니다.
        closeModal(); // 모달을 닫습니다.
        // 삭제 성공 후 상세 페이지에서는 목록으로 이동하는 것이 자연스럽습니다.
        navigate('/todos');
      },
      onClose: () => {
        // `RepeatDeleteModal` 내부에서 사용자가 취소했을 때 이 함수가 호출됩니다.
        closeModal(); // 모달을 닫습니다.
      },
    });
  };

  // Todo 삭제 핸들러 (반복 일정 처리 포함)
  const handleDelete = async () => {
    if (todo.repeatVO) {
      // 반복 일정이 있는 경우, 반복 삭제 모달 열기
      handleOpenRepeatDeleteModal();
    } else {
      // 반복 일정이 없는 경우, 일반 삭제 확인 모달 열기
      // confirm 함수를 호출하여 사용자에게 삭제 여부를 확인받습니다.
      // Promise를 반환하므로 await을 사용하여 결과를 기다립니다.
      const confirmed = await showConfirm({
        title: 'Todo 삭제',
        description: '정말로 이 Todo를 삭제하시겠습니까?',
        confirmText: '삭제',
        cancelText: '취소',
        variant: 'warning',
      });

      if (confirmed) {
        // 수정한 useDeleteTodo 훅의 시그니처에 맞춰 id를 객체에 담아 전달합니다.
        // scope가 없으면 단일 Todo 삭제로 처리됩니다.
        deleteTodoMutation.mutate({ id: numericTodoId });
      }
    }
  };

  // Todo 완료/미완료 상태 토글 핸들러
  const handleToggleComplete = () => {
    updateTodoMutation.mutate({
      id: numericTodoId,
      payload: { isCompleted: isCompleted ? 'N' : 'Y' },
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-primary/5 via-white to-amber-50/30">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 bg-white border-b border-border"
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">할 일 상세</h1>
              <p className="text-xs text-muted-foreground">Todo #{todo.todoId}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
                수정
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          {/* 상단 영역 - 핵심 상태 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              'bg-white rounded-2xl border-2 p-6 shadow-sm',
              isCompleted ? 'border-green-200 bg-green-50/30' : priorityInfo.borderColor,
            )}
          >
            <div className="flex items-start gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleToggleComplete}
                className="flex-shrink-0 mt-1"
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : (
                  <Circle className="h-8 w-8 text-gray-300 hover:text-primary transition-colors" />
                )}
              </motion.button>

              <div className="flex-1 space-y-4">
                <div>
                  <h2
                    className={cn(
                      'text-2xl font-bold text-foreground leading-relaxed',
                      isCompleted && 'line-through text-muted-foreground',
                    )}
                  >
                    {todo.title}
                  </h2>
                  {/* //TODO: 완료일자 필드 추가되면 반영 필요 (현재 API 스펙에 없음) */}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    className={cn('gap-1.5', priorityInfo.bgColor, priorityInfo.color, 'border-0')}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    {priorityInfo.label}
                  </Badge>
                  {/* // TODO: 카테고리 필드 추가되면 반영 필요 (현재 API 스펙에 없음) */}
                  <Badge variant="secondary" className="gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5" />
                    미분류
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 일정 정보 영역 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4"
          >
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              일정 정보
            </h3>

            <div className="space-y-4">
              {/* 마감일 */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">마감일</p>
                  {todo.dueDate ? (
                    <p className="text-base font-semibold text-foreground mt-1">
                      {formatDate(todo.dueDate)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic mt-1">
                      마감일이 설정되지 않았습니다
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* 반복 정보 */}
              <div className="flex items-start gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    !!todo.repeatVO ? "bg-blue-100" : "bg-gray-100"
                  )}>
                  <Repeat className={cn("h-5 w-5", !!todo.repeatVO ? "text-blue-500" : "text-gray-400")} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">반복 설정</p>
                  {!!todo.repeatVO ? (
                    <div className="mt-1 space-y-1">
                      <p className="text-base font-semibold text-foreground">
                        {formatRepeatRule(todo.repeatVO)}
                      </p>
                      {todo.repeatVO.endDate && (
                        <p className="text-sm text-muted-foreground">
                          종료일: {formatDate(todo.repeatVO.endDate)}
                        </p>
                      )}
                      {isRepeatExpired(todo.repeatVO) && (
                        <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-2 rounded-md">
                          이 일정은 반복 기간이 종료되어 더 이상 반복되지 않습니다.
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic mt-1">
                      반복 설정이 없습니다
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 알림 정보 영역 (하드코딩된 UI) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-border p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <BellRing className="h-5 w-5 text-primary" />
              알림 정보
            </h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
                <BellRing className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">알림 설정</p>
                <p className="text-sm text-muted-foreground italic mt-1">알림 설정이 없습니다</p>
              </div>
            </div>
          </motion.div>

          {/* 메모 영역 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-border p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">메모</h3>
            {todo.memo ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{todo.memo}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">작성된 메모가 없습니다</p>
              </div>
            )}
          </motion.div>

          {/* 기타 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-border p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">정보</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">생성일</span>
                <span className="font-medium">{formatDate(todo.createdAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">최종 수정일</span>
                <span className="font-medium">{formatDate(todo.updatedAt)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      {/* TodoFormModal - Todo 수정 모달 */}
      {/*
        TodoFormModal 컴포넌트에 props를 전달합니다.
        - open: 모달의 열림/닫힘 상태를 제어합니다.
        - onOpenChange: 모달의 열림/닫힘 상태 변경을 처리하는 함수입니다.
        - mode: 모달의 작동 모드를 'edit'으로 설정하여 수정 기능을 활성화합니다.
        - todoToEdit: 현재 상세 정보를 보여주는 Todo 객체를 모달에 전달하여 수정할 데이터를 미리 채웁니다.
        - onSuccess: Todo 수정 성공 시 호출되는 콜백 함수입니다. 모달을 닫고 성공 토스트 메시지를 표시합니다.
      */}
      <TodoFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen} // TodoFormModal의 onOpenChange prop에 연결
        mode="edit" // 수정 모드임을 명시
        todoToEdit={todo} // 현재 상세 정보를 수정 대상으로 전달
        onSuccess={() => {
          setIsEditModalOpen(false); // 성공 시 모달 닫기
          appToast.success({ message: '할 일이 성공적으로 수정되었습니다.' }); // 성공 메시지 표시
        }}
      />
    </div>
  );
}

/**
 * //* TodoDetailSkeleton
 * 상세 페이지 로딩 시 보여줄 스켈레톤 UI 컴포넌트입니다.
 */
function TodoDetailSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header 스켈레톤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* 컨텐츠 스켈레톤 */}
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}

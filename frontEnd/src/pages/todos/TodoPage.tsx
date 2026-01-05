import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, ArrowUpDown, CheckSquare, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import {
  useGetTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
} from '@/features/todos/hooks/useTodos';
import type { TodoResponse } from '@/features/todos/api/todoApi';
import { appToast } from '@/shared/utils/appToast';
import { useModal } from '@/shared/store/modalStore';
import { TodoItem } from '@/features/todos/components/TodoItem'; // 분리된 TodoItem 컴포넌트를 import 합니다.

// --- TodoPage: 메인 페이지 컴포넌트 --- //
export default function TodoPage() {
  const modal = useModal(); // 공통 모달(alert, confirm)을 사용하기 위한 훅
  const [filterOpen, setFilterOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);

  // --- 데이터 로직 (커스텀 훅 사용) --- //
  // 1. Todo 목록 조회 (useQuery)
  const { data: todos, isLoading, isError, error } = useGetTodos();

  // 2. Todo 생성 (useMutation)
  const createTodoMutation = useCreateTodo();

  // 3. Todo 수정 (useMutation) - 완료/미완료 토글 포함
  const updateTodoMutation = useUpdateTodo();

  // 4. Todo 삭제 (useMutation)
  const deleteTodoMutation = useDeleteTodo();

  // --- 이벤트 핸들러 --- //
  /**
   * @description Todo 항목의 완료/미완료 상태를 토글하는 핸들러.
   * `updateTodoMutation`을 호출하여 서버 상태를 변경합니다.
   * isCompleted 값으로 'Y' 또는 'N'을 직접 전달합니다.
   */
  const handleToggle = useCallback(
    (id: number, isCompleted: 'Y' | 'N') => {
      updateTodoMutation.mutate({ id, payload: { isCompleted } });
    },
    [updateTodoMutation],
  );

  /**
   * @description Todo 항목을 삭제하는 핸들러.
   * 삭제 전 `modal.confirm`을 통해 사용자에게 재확인 받습니다.
   */
  const handleDelete = useCallback(
    (id: number) => {
      modal
        .confirm({
          title: 'Todo 삭제',
          description: '정말로 이 Todo를 삭제하시겠습니까?',
          confirmText: '삭제',
          cancelText: '취소',
          variant: 'warning',
        })
        .then((confirmed) => {
          if (confirmed) {
            deleteTodoMutation.mutate(id);
          }
        });
    },
    [deleteTodoMutation, modal],
  );

  /**
   * @description Todo 수정 기능을 위한 핸들러 (현재 미개발).
   * 사용자에게 기능이 준비 중임을 알립니다.
   */
  const handleEdit = useCallback((todo: TodoResponse) => {
    appToast.info({ message: 'Todo 수정 기능은 추후 개발 예정입니다.' });
  }, []);

  /**
   * @description 새로운 Todo를 추가하는 임시 핸들러.
   * `createTodoMutation`을 통해 '새로운 임시 Todo'를 생성합니다.
   */
  const handleAddTodo = useCallback(() => {
    appToast.info({ message: '임시 Todo를 생성합니다.' });
    createTodoMutation.mutate({
      title: `새로운 임시 Todo (${new Date().toLocaleTimeString()})`,
      memo: '임시로 생성된 Todo입니다.',
      dueDate: new Date().toISOString().split('T')[0],
    });
  }, [createTodoMutation]);

  /**
   * @description 미개발 기능(필터, 정렬 등)에 대한 임시 핸들러.
   */
  const handleFutureFeature = useCallback((featureName: string) => {
    appToast.info({ message: `${featureName} 기능은 추후 개발 예정입니다.` });
  }, []);

  // --- 렌더링 로직 (메모이제이션) --- //
  // 활성/완료 Todo 목록을 분리하여 계산 (useMemo로 불필요한 재연산 방지)
  // isCompleted 필터링 로직을 'Y'/'N' 문자열 비교로 수정합니다.
  const activeTodos = useMemo(
    () => todos?.filter((todo) => todo.isCompleted === 'N') || [],
    [todos],
  );
  const completedTodos = useMemo(
    () => todos?.filter((todo) => todo.isCompleted === 'Y') || [],
    [todos],
  );

  // --- UI 렌더링 --- //
  // 로딩 상태 UI
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg text-primary">할 일 목록 로딩 중...</span>
      </div>
    );
  }

  // 에러 상태 UI
  // useGetTodos 훅 내부의 useQuery에서 에러가 발생하면 isError가 true가 됩니다.
  // 전역 에러 핸들러(queryClient.ts)가 모달/토스트를 보여줄 수 있지만,
  // 이 페이지 자체를 렌더링할 수 없는 치명적인 경우를 대비해 에러 UI를 표시합니다.
  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center text-red-500">
        <XCircle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-bold">오류 발생</h2>
        <p className="text-muted-foreground">
          {error?.message || '할 일 목록을 불러오지 못했습니다.'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-primary/5 via-white to-amber-50/30">
      {/* 상단 컨트롤 영역 (헤더, 필터, 정렬) */}
      <header className="flex-shrink-0 bg-white border-b border-border">
        <div className="p-4 space-y-4">
          {/* 페이지 타이틀 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-bold text-foreground">오늘의 할 일</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTodos.length}개의 할 일이 남아있어요
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                className="lg:hidden h-10 w-10 rounded-full shadow-md bg-gradient-to-br from-primary to-amber-400"
                onClick={handleAddTodo}
                aria-label="할 일 추가"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* 필터 및 정렬 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterOpen(!filterOpen);
                handleFutureFeature('필터');
              }}
              className={cn('gap-2', filterOpen && 'bg-primary/10 text-primary')}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">필터</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
              onClick={() => handleFutureFeature('정렬')}
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">정렬</span>
            </Button>
            <div className="flex-1" />
            <Badge variant="secondary" className="hidden md:flex">
              전체 {todos?.length || 0}개
            </Badge>
          </motion.div>

          {/* 필터 상세 패널 (애니메이션) */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-accent/30 rounded-lg border">
                  <p className="text-sm font-medium mb-3">카테고리 (미개발)</p>
                  <div className="flex flex-wrap gap-2">
                    {['전체', '업무', '개인', '생활'].map((cat, i) => (
                      <motion.div
                        key={cat}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Badge
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => handleFutureFeature(`'${cat}' 카테고리 필터`)}
                        >
                          {cat}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Todo 리스트 메인 영역 */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 진행 중 목록 */}
        <section aria-labelledby="active-todos-heading">
          <motion.h2
            id="active-todos-heading"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-semibold text-muted-foreground px-2"
          >
            진행 중
          </motion.h2>
          <AnimatePresence mode="popLayout">
            <div className="space-y-2 mt-2">
              {activeTodos.map((todo) => (
                <motion.div
                  key={todo.todoId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  // ⭐ Y축 스크롤 깜빡임 및 잘림 방지를 위한 핵심 설정
                  style={{ position: 'relative' }} // z-index가 작동하려면 필요
                  whileHover={{
                    scale: 1.0, // 1.01로 최소한의 확대만 적용
                    y: -2, // Y축으로 2px만 살짝 들어 올려 부상 효과
                    zIndex: 99, // 다른 요소 위에 렌더링 (잘림 방지)
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)', // 더 부드러운 그림자
                  }}
                >
                  <TodoItem
                    todo={todo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </section>

        {/* 완료 목록 (접기/펴기 가능) */}
        {completedTodos.length > 0 && (
          <section aria-labelledby="completed-todos-heading">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between px-2 cursor-pointer"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <h2
                id="completed-todos-heading"
                className="text-sm font-semibold text-muted-foreground"
              >
                완료됨 ({completedTodos.length})
              </h2>
              <motion.div animate={{ rotate: showCompleted ? 0 : -90 }}>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </motion.div>
            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  variants={{
                    open: { opacity: 1, height: 'auto' },
                    collapsed: { opacity: 0, height: 0 },
                  }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2 mt-2 overflow-hidden"
                >
                  {completedTodos.map((todo) => (
                    <motion.div
                      key={todo.todoId}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TodoItem
                        todo={todo}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* 할 일이 없을 때 표시되는 빈 상태 UI */}
        {todos?.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4"
            >
              <CheckSquare className="h-10 w-10 text-primary" />
            </motion.div>
            <h3 className="text-lg font-semibold text-foreground mb-2">할 일이 없어요</h3>
            <p className="text-sm text-muted-foreground mb-6">새로운 할 일을 추가해보세요!</p>
            <Button className="gap-2" onClick={handleAddTodo}>
              <Plus className="h-4 w-4" />할 일 추가
            </Button>
          </motion.div>
        )}
      </main>

      {/* PC 화면용 플로팅 추가 버튼 */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="hidden lg:block fixed bottom-8 right-8 z-40"
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary to-amber-400 hover:shadow-xl"
          onClick={handleAddTodo}
          aria-label="할 일 추가"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
}

// ChevronDown 아이콘 컴포넌트 (완료 목록 토글에 사용)
const ChevronDown = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);
